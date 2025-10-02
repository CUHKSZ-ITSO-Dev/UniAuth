# 配额池过滤和批量修改 API 使用说明

## 1. 筛选配额池接口 (FilterQuotaPool)

### 接口路径

`POST /quotaPool/filter`

### 功能特性

- 支持复杂的过滤条件查询
- 支持多字段排序
- 支持分页或查询全部数据
- **兼容单个配额池查询**

### 请求参数示例

#### 1.1 单个配额池精确查询

```json
{
  "quotaPoolName": "student_pool",
  "pagination": {
    "page": 1,
    "pageSize": 20
  }
}
```

#### 1.2 复杂条件筛选

```json
{
  "filter": {
    "logic": "and",
    "conditions": [
      {
        "field": "disabled",
        "op": "eq",
        "value": false
      },
      {
        "field": "personal",
        "op": "eq",
        "value": false
      }
    ],
    "groups": [
      {
        "logic": "or",
        "conditions": [
          {
            "field": "quotaPoolName",
            "op": "contains",
            "value": "student"
          },
          {
            "field": "quotaPoolName",
            "op": "contains",
            "value": "teacher"
          }
        ]
      }
    ]
  },
  "sort": [
    {
      "field": "createdAt",
      "order": "desc"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 50
  }
}
```

#### 1.3 查询全部数据

```json
{
  "filter": {
    "logic": "and",
    "conditions": [
      {
        "field": "disabled",
        "op": "eq",
        "value": false
      }
    ]
  },
  "pagination": {
    "all": true
  }
}
```

### 支持的字段

- `quotaPoolName`: 配额池名称
- `cronCycle`: 刷新周期
- `regularQuota`: 定期配额
- `remainingQuota`: 剩余配额
- `lastResetAt`: 上次刷新时间
- `extraQuota`: 加油包
- `personal`: 是否个人配额池
- `disabled`: 是否禁用
- `userinfosRules`: ITTools 规则
- `createdAt`: 创建时间
- `updatedAt`: 修改时间

### 支持的操作符

- `eq`: 等于
- `neq`: 不等于
- `gt`: 大于
- `gte`: 大于等于
- `lt`: 小于
- `lte`: 小于等于
- `like`: 模糊匹配
- `ilike`: 不区分大小写模糊匹配
- `in`: 包含
- `notin`: 不包含
- `contains`: 包含子串
- `notcontains`: 不包含子串
- `startswith`: 以...开头
- `endswith`: 以...结尾
- `isnull`: 为空
- `isnotnull`: 不为空

## 2. 批量修改配额池接口 (BatchModifyQuotaPool)

### 接口路径

`POST /quotaPool/admin/batchModify`

### 功能特性

- 基于过滤条件批量修改
- 支持预览模式，避免误操作
- 事务保护，确保数据一致性

### 请求参数示例

#### 2.1 预览模式（不执行修改）

```json
{
  "filter": {
    "logic": "and",
    "conditions": [
      {
        "field": "quotaPoolName",
        "op": "contains",
        "value": "test"
      }
    ]
  },
  "field": "disabled",
  "value": true,
  "preview": true
}
```

#### 2.2 执行修改

```json
{
  "filter": {
    "logic": "and",
    "conditions": [
      {
        "field": "personal",
        "op": "eq",
        "value": false
      },
      {
        "field": "createdAt",
        "op": "lt",
        "value": "2024-01-01"
      }
    ]
  },
  "field": "disabled",
  "value": true,
  "preview": false
}
```

### 支持修改的字段

- `disabled`: 是否禁用（布尔值）
- `personal`: 是否个人配额池（布尔值）

### 响应结果

```json
{
  "ok": true,
  "affectedCount": 5,
  "affectedPoolNames": [
    "old_pool_1",
    "old_pool_2",
    "old_pool_3",
    "old_pool_4",
    "old_pool_5"
  ]
}
```

## 3. 获取单个配额池接口 (GetQuotaPool)

### 接口路径

`GET /quotaPool/`

### 说明

此接口保持不变，用于快速获取单个配额池的详细信息。

### 请求参数

```json
{
  "quotaPoolName": "student_pool"
}
```

## 4. 使用建议

### 4.1 兼容性迁移

- 原有的单个配额池查询可以迁移到 FilterQuotaPool 接口
- 通过设置`quotaPoolName`参数实现精确查询
- 或使用 filter 条件：`{"field": "quotaPoolName", "op": "eq", "value": "pool_name"}`

### 4.2 批量修改最佳实践

1. 先使用预览模式（`preview: true`）查看受影响的记录
2. 确认无误后，设置`preview: false`执行修改
3. 使用精确的过滤条件，避免误修改

### 4.3 性能优化

- 对于大量数据查询，使用分页而非`all: true`
- 过滤条件尽量使用有索引的字段
- 排序字段建议使用：quotaPoolName、createdAt、updatedAt 等有索引的字段
