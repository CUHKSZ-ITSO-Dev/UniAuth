/*
基于 IguteChung/casbin-psql-watcher 的二开版本。
原项目 MIT 协议，地址：https://github.com/IguteChung/casbin-psql-watcher。

针对 PostgreSQL NOTIFY payload 的大小限制是 8000 字节，
改造了 notifyMessage() 和 DefaultCallback() 函数，使其能够处理更大的消息。
核心逻辑是：
1. 先尝试使用 flate 压缩 + base64 编码二进制，看是否超过 8000 payloadLimit 的限制。
2. 如果超过了，则把 base64 数据分 chunk 发送。defaultCallback 函数中自动等待所有 chunk 接收完毕后同步 Casbin。
*/

package psqlwatcher

import (
	"bytes"
	"compress/flate"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"sync"
	"time"

	"github.com/casbin/casbin/v2"
	"github.com/casbin/casbin/v2/model"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

const (
	// pg_notify payload limit is 8000 bytes.
	payloadLimit = 8000
)

// TransmittedMSG is the envelope for messages sent over pg_notify.
// It supports chunking for large payloads.
type TransmittedMSG struct {
	IsChunked  bool   `json:"is_chunked"`
	ChunkID    string `json:"chunk_id,omitempty"`    // A unique ID for all chunks of a single message
	ChunkNum   int    `json:"chunk_num,omitempty"`   // The sequence number of this chunk (e.g., 1, 2, 3...)
	ChunkTotal int    `json:"chunk_total,omitempty"` // Total number of chunks
	Data       *MSG   `json:"data"`
}

// reassemblyBuffer for chunked messages
type reassemblyBuffer struct {
	chunks   map[int]*MSG
	total    int
	lastSeen time.Time
}

// Watcher implements casbin Watcher and WatcherEX to sync multiple casbin enforcer.
type Watcher struct {
	sync.RWMutex

	opt        Option
	pool       *pgxpool.Pool
	callback   func(string)
	cancelFunc func()

	// for chunking
	reassemblyCache map[string]*reassemblyBuffer // key is ChunkID
	cacheLock       sync.Mutex
}

// UpdateType defines the type of update operation.
type UpdateType string

// all types of Update.
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
)

// MSG defines the payload for message.
type MSG struct {
	Method      UpdateType `json:"method"`
	ID          string     `json:"id"`
	Sec         string     `json:"sec,omitempty"`
	Ptype       string     `json:"ptype,omitempty"`
	OldRules    [][]string `json:"old_rules,omitempty"`
	NewRules    [][]string `json:"new_rules,omitempty"`
	FieldIndex  int        `json:"field_index,omitempty"`
	FieldValues []string   `json:"field_values,omitempty"`
}

// NewWatcherWithConnString creates a Watcher with pgx connection string.
func NewWatcherWithConnString(ctx context.Context, connString string, opt Option) (*Watcher, error) {
	// new the pgx pool by conn string.
	pool, err := pgxpool.New(ctx, connString)
	if err != nil {
		return nil, fmt.Errorf("failed to new pgx pool with %s: %v", connString, err)
	}

	return NewWatcherWithPool(ctx, pool, opt)
}

// NewWatcherWithPool creates a Watcher with pgx pool.
func NewWatcherWithPool(ctx context.Context, pool *pgxpool.Pool, opt Option) (*Watcher, error) {
	if err := pool.Ping(ctx); err != nil {
		return nil, fmt.Errorf("failed to ping pool: %v", err)
	}

	// prepare the watcher.
	listenerCtx, cancel := context.WithCancel(context.Background())
	w := &Watcher{
		opt:             opt,
		pool:            pool,
		cancelFunc:      cancel,
		reassemblyCache: make(map[string]*reassemblyBuffer),
	}

	// start the chunk cleanup goroutine.
	go w.cleanupExpiredChunks()

	// start listen.
	go func() {
		if err := w.listenMessage(listenerCtx); err == context.Canceled {
			log.Println("[psqlwatcher] watcher closed")
		} else if err != nil {
			log.Printf("[psqlwatcher] failed to listen message: %v\n", err)
		}
	}()

	return w, nil
}

// DefaultCallback defines the generic implementation for WatcherEX interface.
func DefaultCallback(e casbin.IEnforcer) func(string) {
	return func(s string) {
		// parse the msg.
		var m MSG
		if err := json.Unmarshal([]byte(s), &m); err != nil {
			log.Printf("[psqlwatcher] unable to unmarshal %s: %v\n", s, err)
			return
		}

		var res bool
		var err error
		switch m.Method {
		case Update, UpdateForSavePolicy:
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

// SetUpdateCallback sets the callback function that the watcher will call
// when the policy in DB has been changed by other instances.
// A classic callback is Enforcer.LoadPolicy().
func (w *Watcher) SetUpdateCallback(callback func(string)) error {
	w.Lock()
	defer w.Unlock()
	w.callback = callback
	return nil
}

// Update calls the update callback of other instances to synchronize their policy.
// It is usually called after changing the policy in DB, like Enforcer.SavePolicy(),
// Enforcer.AddPolicy(), Enforcer.RemovePolicy(), etc.
func (w *Watcher) Update() error {
	return w.notifyMessage(&MSG{
		Method: Update,
		ID:     w.GetLocalID(),
	})
}

// Close stops and releases the watcher, the callback function will not be called any more.
func (w *Watcher) Close() {
	// close the listen routine by cancel the context.
	w.cancelFunc()
}

// UpdateForAddPolicy calls the update callback of other instances to synchronize their policy.
// It is called after Enforcer.AddPolicy()
func (w *Watcher) UpdateForAddPolicy(sec, ptype string, params ...string) error {
	return w.notifyMessage(&MSG{
		Method:   UpdateForAddPolicy,
		ID:       w.GetLocalID(),
		Sec:      sec,
		Ptype:    ptype,
		NewRules: [][]string{params},
	})
}

// UpdateForRemovePolicy calls the update callback of other instances to synchronize their policy.
// It is called after Enforcer.RemovePolicy()
func (w *Watcher) UpdateForRemovePolicy(sec, ptype string, params ...string) error {
	return w.notifyMessage(&MSG{
		Method:   UpdateForRemovePolicy,
		ID:       w.GetLocalID(),
		Sec:      sec,
		Ptype:    ptype,
		NewRules: [][]string{params},
	})
}

// UpdateForRemoveFilteredPolicy calls the update callback of other instances to synchronize their policy.
// It is called after Enforcer.RemoveFilteredNamedGroupingPolicy()
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

// UpdateForSavePolicy calls the update callback of other instances to synchronize their policy.
// It is called after Enforcer.RemoveFilteredNamedGroupingPolicy()
func (w *Watcher) UpdateForSavePolicy(model model.Model) error {
	return w.notifyMessage(&MSG{
		Method: UpdateForSavePolicy,
		ID:     w.GetLocalID(),
	})
}

// UpdateForAddPolicies calls the update callback of other instances to synchronize their policy.
// It is called after Enforcer.AddPolicies()
func (w *Watcher) UpdateForAddPolicies(sec string, ptype string, rules ...[]string) error {
	return w.notifyMessage(&MSG{
		Method:   UpdateForAddPolicies,
		ID:       w.GetLocalID(),
		Sec:      sec,
		Ptype:    ptype,
		NewRules: rules,
	})
}

// UpdateForRemovePolicies calls the update callback of other instances to synchronize their policy.
// It is called after Enforcer.RemovePolicies()
func (w *Watcher) UpdateForRemovePolicies(sec string, ptype string, rules ...[]string) error {
	return w.notifyMessage(&MSG{
		Method:   UpdateForRemovePolicies,
		ID:       w.GetLocalID(),
		Sec:      sec,
		Ptype:    ptype,
		NewRules: rules,
	})
}

// UpdateForUpdatePolicy calls the update callback of other instances to synchronize their policy.
// It is called after Enforcer.UpdatePolicy()
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

// UpdateForUpdatePolicies calls the update callback of other instances to synchronize their policy.
// It is called after Enforcer.UpdatePolicies()
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

func (w *Watcher) notifyMessage(m *MSG) error {
	// 1. try to send as a single message.
	payload, err := w.createPayload(&TransmittedMSG{IsChunked: false, Data: m})
	if err != nil {
		return fmt.Errorf("failed to create payload: %v", err)
	}

	if len(payload) <= payloadLimit {
		return w.sendPayload(payload)
	}

	// 2. if payload is too large, chunk it.
	numRules := max(len(m.OldRules), len(m.NewRules))

	if numRules == 0 {
		return fmt.Errorf("message without rules is too large: %d bytes", len(payload))
	}

	// For UpdatePolicies, old and new rules should have a 1-to-1 correspondence.
	hasOldRules := len(m.OldRules) > 0
	hasNewRules := len(m.NewRules) > 0
	if hasOldRules && hasNewRules && len(m.OldRules) != len(m.NewRules) {
		return fmt.Errorf("cannot chunk policies with mismatched old and new rule counts")
	}

	chunkID := uuid.New().String()
	var chunks []*TransmittedMSG
	currentChunkData := *m
	currentChunkData.OldRules = make([][]string, 0)
	currentChunkData.NewRules = make([][]string, 0)

	// Iteratively build chunks to ensure each fits within the payload limit.
	for i := range numRules {
		// Create a temporary chunk data to test its size.
		testChunkData := currentChunkData
		if hasOldRules {
			testChunkData.OldRules = append(testChunkData.OldRules, m.OldRules[i])
		}
		if hasNewRules {
			testChunkData.NewRules = append(testChunkData.NewRules, m.NewRules[i])
		}

		// Check if the new rule makes the chunk too large.
		p, err := w.createPayload(&TransmittedMSG{Data: &testChunkData})
		if err != nil {
			return fmt.Errorf("failed to create test payload for chunking: %v", err)
		}

		if len(p) > payloadLimit && (len(currentChunkData.OldRules) > 0 || len(currentChunkData.NewRules) > 0) {
			// Current chunk is full. Finalize and append it.
			chunks = append(chunks, &TransmittedMSG{
				IsChunked: true,
				ChunkID:   chunkID,
				Data:      &currentChunkData,
			})

			// Start a new chunk with the current rule.
			currentChunkData = *m
			currentChunkData.OldRules = make([][]string, 0)
			currentChunkData.NewRules = make([][]string, 0)
			if hasOldRules {
				currentChunkData.OldRules = append(currentChunkData.OldRules, m.OldRules[i])
			}
			if hasNewRules {
				currentChunkData.NewRules = append(currentChunkData.NewRules, m.NewRules[i])
			}
		} else {
			// The rule fits. Add it to the current chunk.
			currentChunkData = testChunkData
		}
	}

	// Add the last chunk.
	chunks = append(chunks, &TransmittedMSG{
		IsChunked: true,
		ChunkID:   chunkID,
		Data:      &currentChunkData,
	})

	// Send all chunks with the correct metadata.
	totalChunks := len(chunks)
	for i, chunk := range chunks {
		chunk.ChunkNum = i + 1
		chunk.ChunkTotal = totalChunks

		finalPayload, err := w.createPayload(chunk)
		if err != nil {
			log.Printf("[psqlwatcher] failed to create final payload for chunk %d/%d of %s: %v", i+1, totalChunks, chunkID, err)
			continue
		}
		if len(finalPayload) > payloadLimit {
			log.Printf("[psqlwatcher] error: chunk %d/%d of %s is still too large after final creation (%d bytes)", i+1, totalChunks, chunkID, len(finalPayload))
			continue
		}
if err := w.sendPayload(finalPayload); err != nil {
			return fmt.Errorf("[psqlwatcher] failed to send chunk %d/%d of %s: %v", i+1, totalChunks, chunkID, err)
		}
	}

	return nil
}

// createPayload marshals, compresses, and base64-encodes the message.
func (w *Watcher) createPayload(tm *TransmittedMSG) (string, error) {
	b, err := json.Marshal(tm)
	if err != nil {
		return "", fmt.Errorf("failed to marshal %+v: %v", tm, err)
	}

	// compress with flate.
	var buf bytes.Buffer
	writer, err := flate.NewWriter(&buf, flate.BestCompression)
	if err != nil {
		return "", fmt.Errorf("failed to new flate writer: %v", err)
	}
	if _, err := writer.Write(b); err != nil {
		return "", fmt.Errorf("failed to write to flate writer: %v", err)
	}
	if err := writer.Close(); err != nil {
		return "", fmt.Errorf("failed to close flate writer: %v", err)
	}
	return base64.StdEncoding.EncodeToString(buf.Bytes()), nil
}

// sendPayload sends the payload to the PostgreSQL channel.
func (w *Watcher) sendPayload(payload string) error {
	cmd := fmt.Sprintf("select pg_notify('%s', $1)", w.GetChannel())

	// send to psql channel.
	if _, err := w.pool.Exec(context.Background(), cmd, payload); err != nil {
		return fmt.Errorf("failed to notify with payload size %d: %v", len(payload), err)
	}

	if w.GetVerbose() {
		log.Printf("[psqlwatcher] send message with payload size %d to channel %s\n", len(payload), w.GetChannel())
	}

	return nil
}

func (w *Watcher) listenMessage(ctx context.Context) error {
	// acquire the psql connection for listening.
	conn, err := w.pool.Acquire(ctx)
	if err != nil {
		return fmt.Errorf("failed to acquire psql connection: %v", err)
	}
	defer conn.Release()

	// listen to the psql channel.
	cmd := fmt.Sprintf("listen %s", w.GetChannel())
	if _, err = conn.Exec(ctx, cmd); err != nil {
		return fmt.Errorf("failed to listen %s: %v", w.GetChannel(), err)
	}

	// wait for psql notification.
	for {
		notification, err := conn.Conn().WaitForNotification(ctx)
		if err == context.Canceled {
			return err
		} else if err != nil {
			return fmt.Errorf("failed to wait for notification: %v", err)
		}

		// print debug message.
		if w.GetVerbose() {
			log.Printf("[psqlwatcher] received message: %s from channel %s with local ID %s", notification.Payload, w.GetChannel(), w.GetLocalID())
		}

		// base64 decode the payload.
		compressedBytes, err := base64.StdEncoding.DecodeString(notification.Payload)
		if err != nil {
			log.Printf("failed to base64 decode %s: %v\n", notification.Payload, err)
			continue
		}

		// decompress the payload.
		reader := flate.NewReader(bytes.NewReader(compressedBytes))
		decompressedBytes, err := io.ReadAll(reader)
		if err != nil {
			log.Printf("failed to decompress %s: %v\n", notification.Payload, err)
			continue
		}
		if err := reader.Close(); err != nil {
			log.Printf("failed to close flate reader: %v\n", err)
			continue
		}

		// unmarshal the payload to TransmittedMSG.
		var tm TransmittedMSG
		if err := json.Unmarshal(decompressedBytes, &tm); err != nil {
			log.Printf("failed to unmarshal to transmitted message %s: %v\n", string(decompressedBytes), err)
			continue
		}

		// if it is self message, ignore it.
		w.RLock()
		if tm.Data.ID == w.GetLocalID() && !w.GetNotifySelf() {
			w.RUnlock()
			continue
		}
		w.RUnlock()

		if !tm.IsChunked {
			// Not a chunked message, process directly.
			finalPayload, err := json.Marshal(tm.Data)
			if err != nil {
				log.Printf("failed to marshal final payload: %v", err)
				continue
			}
			w.callback(string(finalPayload))
			continue
		}

		// Is a chunked message, process it.
		w.cacheLock.Lock()

		buffer, exists := w.reassemblyCache[tm.ChunkID]
		// The first chunk for new ChunkID. Build a buffer to receive it.
		if !exists {
			buffer = &reassemblyBuffer{
				chunks: make(map[int]*MSG),
				total:  tm.ChunkTotal,
			}
			w.reassemblyCache[tm.ChunkID] = buffer
		}

		buffer.chunks[tm.ChunkNum] = tm.Data
		buffer.lastSeen = time.Now()

		// check if all chunks are received.
		if len(buffer.chunks) == buffer.total {
			// reassemble the message.
			fullMsg := *buffer.chunks[1]
			fullMsg.OldRules = make([][]string, 0)
			fullMsg.NewRules = make([][]string, 0)

			for i := 1; i <= buffer.total; i++ {
				chunk := buffer.chunks[i]
				if len(chunk.OldRules) > 0 {
					fullMsg.OldRules = append(fullMsg.OldRules, chunk.OldRules...)
				}
				if len(chunk.NewRules) > 0 {
					fullMsg.NewRules = append(fullMsg.NewRules, chunk.NewRules...)
				}
			}

			// remove from cache.
			delete(w.reassemblyCache, tm.ChunkID)

			w.cacheLock.Unlock() // unlock before callback.

			finalPayload, err := json.Marshal(&fullMsg)
			if err != nil {
				log.Printf("failed to marshal reassembled message: %v", err)
				continue
			}
			w.callback(string(finalPayload))
		} else {
			w.cacheLock.Unlock()
		}
	}
}

// cleanupExpiredChunks garbage collects incomplete chunks from the reassembly cache.
func (w *Watcher) cleanupExpiredChunks() {
	ticker := time.NewTicker(10 * time.Minute)
	defer ticker.Stop()

	for {
		<-ticker.C
		w.cacheLock.Lock()
		for chunkID, buffer := range w.reassemblyCache {
			if time.Since(buffer.lastSeen) > 15*time.Minute {
				log.Printf("[psqlwatcher] cleaning up expired chunks for chunkID %s", chunkID)
				delete(w.reassemblyCache, chunkID)
			}
		}
		w.cacheLock.Unlock()
	}
}
