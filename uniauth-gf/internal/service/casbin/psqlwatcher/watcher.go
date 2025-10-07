package psqlwatcher

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"sync"

	"github.com/casbin/casbin/v2"
	"github.com/casbin/casbin/v2/model"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/klauspost/compress/zstd"
)

// Watcher 实现了 casbin 的 Watcher 和 WatcherEX 接口，用于同步多个 casbin enforcer
type Watcher struct {
	sync.RWMutex

	opt        Option
	pool       *pgxpool.Pool
	callback   func(string)
	cancelFunc func()
}

// UpdateType 定义更新操作的类型
type UpdateType string

// 所有的更新类型
const (
	Update                        UpdateType = "Update"
	UpdateForAddPolicy            UpdateType = "UpdateForAddPolicy"
	UpdateForRemovePolicy         UpdateType = "UpdateForRemovePolicy"
	UpdateForRemoveFilteredPolicy UpdateType = "UpdateForRemoveFilteredPolicy"
	UpdateForSavePolicy           UpdateType = "UpdateForSavePolicy"
	UpdateForAddPolicies          UpdateType = "UpdateForAddPolicies"
	UpdateForRemovePolicies       UpdateType = "UpdateForRemovePolicies"
	UpdateForUpdatePolicy         UpdateType = "UpdateForUpdatePolicy"
	UpdateForUpdatePolicies       UpdateType = "UpdateForUpdatePolicies"
	UpdateForLoadPolicy           UpdateType = "UpdateForLoadPolicy"
	payloadLimit                  int        = 8000
	maxEstimateLimit              int        = 160000 // 按 5% 压缩率估计
)

// MSG 定义消息的载荷结构
type MSG struct {
	Method      UpdateType `json:"method"`
	ID          string     `json:"id"`
	Sec         string     `json:"sec,omitempty"`
	Ptype       string     `json:"ptype,omitempty"`
	OldRules    [][]string `json:"old_rules,omitempty"`
	NewRules    [][]string `json:"new_rules,omitempty"`
	FieldIndex  int        `json:"field_index,omitempty"`
	FieldValues []string   `json:"field_values,omitempty"`
	Compressed  bool       `json:"compressed,omitempty"` // 标识载荷是否已压缩
	Payload     string     `json:"payload,omitempty"`    // 压缩并 base64 编码后的原始消息
}

// NewWatcherWithConnString 使用 pgx 连接字符串创建一个 Watcher
func NewWatcherWithConnString(ctx context.Context, connString string, opt Option) (*Watcher, error) {
	// 使用连接字符串创建 pgx 连接池
	pool, err := pgxpool.New(ctx, connString)
	if err != nil {
		return nil, fmt.Errorf("failed to new pgx pool with %s: %v", connString, err)
	}

	return NewWatcherWithPool(ctx, pool, opt)
}

// NewWatcherWithPool 使用 pgx 连接池创建一个 Watcher
func NewWatcherWithPool(ctx context.Context, pool *pgxpool.Pool, opt Option) (*Watcher, error) {
	if err := pool.Ping(ctx); err != nil {
		return nil, fmt.Errorf("failed to ping pool: %v", err)
	}

	// 准备 watcher
	listenerCtx, cancel := context.WithCancel(context.Background())
	w := &Watcher{
		opt:        opt,
		pool:       pool,
		cancelFunc: cancel,
	}

	// 启动监听协程
	go func() {
		if err := w.listenMessage(listenerCtx); err == context.Canceled {
			log.Println("[psqlwatcher] watcher closed")
		} else if err != nil {
			log.Printf("[psqlwatcher] failed to listen message: %v\n", err)
		}
	}()

	return w, nil
}

var (
	// 使用sync.Once确保encoder和decoder只初始化一次，提高性能
	zstdEncoder     *zstd.Encoder
	zstdDecoder     *zstd.Decoder
	zstdInitEncoder sync.Once
	zstdInitDecoder sync.Once
)

// getZstdEncoder 获取或创建zstd encoder（使用默认压缩级别，平衡速度和压缩率）
func getZstdEncoder() *zstd.Encoder {
	zstdInitEncoder.Do(func() {
		var err error
		// 使用SpeedDefault级别（相当于level 3），在速度和压缩率之间取得平衡
		zstdEncoder, err = zstd.NewWriter(nil, zstd.WithEncoderLevel(zstd.SpeedDefault))
		if err != nil {
			log.Printf("[psqlwatcher] failed to create zstd encoder: %v\n", err)
		}
	})
	return zstdEncoder
}

// getZstdDecoder 获取或创建zstd decoder
func getZstdDecoder() *zstd.Decoder {
	zstdInitDecoder.Do(func() {
		var err error
		zstdDecoder, err = zstd.NewReader(nil)
		if err != nil {
			log.Printf("[psqlwatcher] failed to create zstd decoder: %v\n", err)
		}
	})
	return zstdDecoder
}

// compressPayload 使用 zstd 压缩并 base64 编码载荷
func compressPayload(data []byte) (string, error) {
	encoder := getZstdEncoder()
	if encoder == nil {
		return "", fmt.Errorf("zstd encoder not available")
	}

	// 使用zstd压缩
	compressed := encoder.EncodeAll(data, make([]byte, 0, len(data)))

	// base64编码
	return base64.StdEncoding.EncodeToString(compressed), nil
}

// decompressPayload 解码 base64 并使用 zstd 解压载荷
func decompressPayload(encodedData string) ([]byte, error) {
	// base64解码
	compressed, err := base64.StdEncoding.DecodeString(encodedData)
	if err != nil {
		return nil, fmt.Errorf("failed to decode base64: %v", err)
	}

	decoder := getZstdDecoder()
	if decoder == nil {
		return nil, fmt.Errorf("zstd decoder not available")
	}

	// 使用zstd解压
	decompressed, err := decoder.DecodeAll(compressed, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to decompress zstd: %v", err)
	}

	return decompressed, nil
}

// DefaultCallback 定义 WatcherEX 接口的通用实现
func DefaultCallback(e casbin.IEnforcer) func(string) {
	return func(s string) {
		// 解析消息
		var m MSG
		if err := json.Unmarshal([]byte(s), &m); err != nil {
			log.Printf("[psqlwatcher] unable to unmarshal %s: %v\n", s, err)
			return
		}

		// 处理压缩的载荷
		if m.Compressed && m.Payload != "" {
			decompressed, err := decompressPayload(m.Payload)
			if err != nil {
				log.Printf("[psqlwatcher] failed to decompress payload: %v\n", err)
				return
			}

			// 解压后再次解析消息
			if err := json.Unmarshal(decompressed, &m); err != nil {
				log.Printf("[psqlwatcher] unable to unmarshal decompressed payload: %v\n", err)
				return
			}
		}

		var res bool
		var err error
		switch m.Method {
		case Update, UpdateForSavePolicy, UpdateForLoadPolicy:
			err = e.LoadPolicy()
			res = true
		case UpdateForAddPolicy:
			res, err = e.SelfAddPolicy(m.Sec, m.Ptype, m.NewRules[0])
		case UpdateForAddPolicies:
			res, err = e.SelfAddPolicies(m.Sec, m.Ptype, m.NewRules)
		case UpdateForRemovePolicy:
			res, err = e.SelfRemovePolicy(m.Sec, m.Ptype, m.NewRules[0])
		case UpdateForRemoveFilteredPolicy:
			res, err = e.SelfRemoveFilteredPolicy(m.Sec, m.Ptype, m.FieldIndex, m.FieldValues...)
		case UpdateForRemovePolicies:
			res, err = e.SelfRemovePolicies(m.Sec, m.Ptype, m.NewRules)
		case UpdateForUpdatePolicy:
			res, err = e.SelfUpdatePolicy(m.Sec, m.Ptype, m.OldRules[0], m.NewRules[0])
		case UpdateForUpdatePolicies:
			res, err = e.SelfUpdatePolicies(m.Sec, m.Ptype, m.OldRules, m.NewRules)
		default:
			err = fmt.Errorf("unknown update type: %s", m.Method)
		}
		if err != nil {
			log.Printf("[psqlwatcher] failed to update policy: %v\n", err)
		}
		if !res {
			log.Println("[psqlwatcher] callback update policy failed")
		}
	}
}

// SetUpdateCallback 设置回调函数，当其他实例修改了数据库中的策略时会调用该回调
// 经典的回调是 Enforcer.LoadPolicy()
func (w *Watcher) SetUpdateCallback(callback func(string)) error {
	w.Lock()
	defer w.Unlock()
	w.callback = callback
	return nil
}

// Update 调用其他实例的更新回调以同步它们的策略
// 通常在修改数据库中的策略后调用，如 Enforcer.SavePolicy()、Enforcer.AddPolicy()、Enforcer.RemovePolicy() 等
func (w *Watcher) Update() error {
	return w.notifyMessage(&MSG{
		Method: Update,
		ID:     w.GetLocalID(),
	})
}

// Close 停止并释放 watcher，回调函数将不再被调用
func (w *Watcher) Close() {
	// 通过取消 context 来关闭监听协程
	w.cancelFunc()
}

// UpdateForAddPolicy 调用其他实例的更新回调以同步它们的策略
// 在 Enforcer.AddPolicy() 后调用
func (w *Watcher) UpdateForAddPolicy(sec, ptype string, params ...string) error {
	return w.notifyMessage(&MSG{
		Method:   UpdateForAddPolicy,
		ID:       w.GetLocalID(),
		Sec:      sec,
		Ptype:    ptype,
		NewRules: [][]string{params},
	})
}

// UpdateForRemovePolicy 调用其他实例的更新回调以同步它们的策略
// 在 Enforcer.RemovePolicy() 后调用
func (w *Watcher) UpdateForRemovePolicy(sec, ptype string, params ...string) error {
	return w.notifyMessage(&MSG{
		Method:   UpdateForRemovePolicy,
		ID:       w.GetLocalID(),
		Sec:      sec,
		Ptype:    ptype,
		NewRules: [][]string{params},
	})
}

// UpdateForRemoveFilteredPolicy 调用其他实例的更新回调以同步它们的策略
// 在 Enforcer.RemoveFilteredNamedGroupingPolicy() 后调用
func (w *Watcher) UpdateForRemoveFilteredPolicy(sec, ptype string, fieldIndex int, fieldValues ...string) error {
	return w.notifyMessage(&MSG{
		Method:      UpdateForRemoveFilteredPolicy,
		ID:          w.GetLocalID(),
		Sec:         sec,
		Ptype:       ptype,
		FieldIndex:  fieldIndex,
		FieldValues: fieldValues,
	})
}

// UpdateForSavePolicy 调用其他实例的更新回调以同步它们的策略
// 在 Enforcer.SavePolicy() 后调用
func (w *Watcher) UpdateForSavePolicy(model model.Model) error {
	return w.notifyMessage(&MSG{
		Method: UpdateForSavePolicy,
		ID:     w.GetLocalID(),
	})
}

// UpdateForAddPolicies 调用其他实例的更新回调以同步它们的策略
// 在 Enforcer.AddPolicies() 后调用
func (w *Watcher) UpdateForAddPolicies(sec string, ptype string, rules ...[]string) error {
	return w.notifyMessage(&MSG{
		Method:   UpdateForAddPolicies,
		ID:       w.GetLocalID(),
		Sec:      sec,
		Ptype:    ptype,
		NewRules: rules,
	})
}

// UpdateForRemovePolicies 调用其他实例的更新回调以同步它们的策略
// 在 Enforcer.RemovePolicies() 后调用
func (w *Watcher) UpdateForRemovePolicies(sec string, ptype string, rules ...[]string) error {
	return w.notifyMessage(&MSG{
		Method:   UpdateForRemovePolicies,
		ID:       w.GetLocalID(),
		Sec:      sec,
		Ptype:    ptype,
		NewRules: rules,
	})
}

// UpdateForUpdatePolicy 调用其他实例的更新回调以同步它们的策略
// 在 Enforcer.UpdatePolicy() 后调用
func (w *Watcher) UpdateForUpdatePolicy(sec string, ptype string, oldRule, newRule []string) error {
	return w.notifyMessage(&MSG{
		Method:   UpdateForUpdatePolicy,
		ID:       w.GetLocalID(),
		Sec:      sec,
		Ptype:    ptype,
		OldRules: [][]string{oldRule},
		NewRules: [][]string{newRule},
	})
}

// UpdateForUpdatePolicies 调用其他实例的更新回调以同步它们的策略
// 在 Enforcer.UpdatePolicies() 后调用
func (w *Watcher) UpdateForUpdatePolicies(sec string, ptype string, oldRules, newRules [][]string) error {
	return w.notifyMessage(&MSG{
		Method:   UpdateForUpdatePolicies,
		ID:       w.GetLocalID(),
		Sec:      sec,
		Ptype:    ptype,
		OldRules: oldRules,
		NewRules: newRules,
	})
}

// notifyMessage 发送通知消息到 PostgreSQL 通道
// 采用三级策略处理大载荷：
// 0. 原始载荷 > 160000 字节：发送 LoadPolicy 命
// 1. 原始载荷 < 8000 字节：直接发送
// 2. 压缩后 < 8000 字节：发送压缩版本
// 3. 压缩后仍 >= 8000 字节：发送 LoadPolicy 命令
func (w *Watcher) notifyMessage(m *MSG) error {
	// 序列化原始消息
	originalPayload, err := json.Marshal(m)
	if err != nil {
		return fmt.Errorf("failed to marshal %+v: %v", m, err)
	}

	payloadSize := len(originalPayload)

	// 定义压缩结果结构
	type compressResult struct {
		compressedPayload []byte
		err               error
	}

	// 并发启动压缩操作
	compressChan := make(chan compressResult, 1)
	go func() {
		compressed, err := compressPayload(originalPayload)

		var compressedPayload []byte
		if err == nil {
			// 构建压缩消息
			compressedMsg := &MSG{
				Method:     m.Method,
				ID:         m.ID,
				Compressed: true,
				Payload:    compressed,
			}
			compressedPayload, err = json.Marshal(compressedMsg)
		}

		compressChan <- compressResult{
			compressedPayload: compressedPayload,
			err:               err,
		}
	}()

	var payloadToSend []byte

	// 策略1: 如果原始载荷 < 8000 字节，直接发送
	if payloadSize < payloadLimit {
		payloadToSend = originalPayload

		if w.GetVerbose() {
			log.Printf("[psqlwatcher] 策略1: 发送原始载荷 | 大小: %d 字节\n", payloadSize)
		}
	} else if payloadSize > maxEstimateLimit {
		// 策略0: 载荷过大，直接发送 LoadPolicy 命令，不等待压缩
		if w.GetVerbose() {
			log.Printf("[psqlwatcher] 策略0: 载荷超大 | 原始: %d 字节 | 直接发送 LoadPolicy 命令\n", payloadSize)
		}

		loadPolicyMsg := &MSG{
			Method: UpdateForLoadPolicy,
			ID:     w.GetLocalID(),
		}
		payloadToSend, _ = json.Marshal(loadPolicyMsg)
	} else {
		// 等待压缩结果
		result := <-compressChan

		if result.err != nil {
			// 压缩失败，降级为 LoadPolicy
			if w.GetVerbose() {
				log.Printf("[psqlwatcher] 压缩失败: %v, 降级为 LoadPolicy\n", result.err)
			}

			loadPolicyMsg := &MSG{
				Method: UpdateForLoadPolicy,
				ID:     w.GetLocalID(),
			}
			payloadToSend, _ = json.Marshal(loadPolicyMsg)
		} else {
			compressedSize := len(result.compressedPayload)

			// 策略2: 压缩后 < 8000 字节，发送压缩版本
			if compressedSize < payloadLimit {
				payloadToSend = result.compressedPayload

				if w.GetVerbose() {
					log.Printf("[psqlwatcher] 策略2: 发送压缩载荷 | 原始: %d 字节 | 压缩: %d 字节 (%.2f%%)\n",
						payloadSize, compressedSize, float64(compressedSize)*100/float64(payloadSize))
				}
			} else {
				// 策略3: 压缩后仍 >= 8000 字节，发送 LoadPolicy 命令
				if w.GetVerbose() {
					log.Printf("[psqlwatcher] 策略3: 载荷过大 | 原始: %d 字节 | 压缩: %d 字节 | 发送 LoadPolicy 命令\n",
						payloadSize, compressedSize)
				}

				loadPolicyMsg := &MSG{
					Method: UpdateForLoadPolicy,
					ID:     w.GetLocalID(),
				}
				payloadToSend, _ = json.Marshal(loadPolicyMsg)
			}
		}
	}

	// 发送到 PostgreSQL 通道
	cmd := fmt.Sprintf("select pg_notify('%s', $1)", w.GetChannel())
	if _, err := w.pool.Exec(context.Background(), cmd, string(payloadToSend)); err != nil {
		return fmt.Errorf("failed to notify %s: %v", string(payloadToSend), err)
	}

	if w.GetVerbose() {
		log.Printf("[psqlwatcher] 消息已发送到通道: %s\n", w.GetChannel())
	}

	return nil
}

// listenMessage 监听 PostgreSQL 通道并处理接收到的消息
func (w *Watcher) listenMessage(ctx context.Context) error {
	// 获取用于监听的 PostgreSQL 连接
	conn, err := w.pool.Acquire(ctx)
	if err != nil {
		return fmt.Errorf("failed to acquire psql connection: %v", err)
	}
	defer conn.Release()

	// 监听 PostgreSQL 通道
	cmd := fmt.Sprintf("listen %s", w.GetChannel())
	if _, err = conn.Exec(ctx, cmd); err != nil {
		return fmt.Errorf("failed to listen %s: %v", w.GetChannel(), err)
	}

	// 等待 PostgreSQL 通知
	for {
		notification, err := conn.Conn().WaitForNotification(ctx)
		if err == context.Canceled {
			return err
		} else if err != nil {
			return fmt.Errorf("failed to wait for notification: %v", err)
		}

		// 打印调试信息
		if w.GetVerbose() {
			log.Printf("[psqlwatcher] 收到消息: %s | 通道: %s | 本地ID: %s",
				notification.Payload, w.GetChannel(), w.GetLocalID())
		}

		// 反序列化载荷为 MSG
		var m MSG
		if err := json.Unmarshal([]byte(notification.Payload), &m); err != nil {
			log.Printf("[psqlwatcher] 反序列化失败 %s: %v\n", notification.Payload, err)
			continue
		}

		// 检查消息 ID 是否是自己发送的
		// 如果启用了 NotifySelf，即使 ID 相同也会触发回调
		w.RLock()
		if m.ID != w.GetLocalID() || w.GetNotifySelf() {
			w.callback(notification.Payload)
		}
		w.RUnlock()
	}
}
