# UserInfo Filter API 使用示例

这个文档展示了如何使用新的结构化 Filter API 来查询用户信息。

## API 端点
```
POST /userinfo/filter
```

## 请求格式

### 基础结构
```json
{
  "filter": {
    "logic": "and",  // 或 "or"
    "conditions": [
      {
        "field": "字段名",
        "op": "操作符",
        "value": "值"
      }
    ],
    "groups": [
      // 嵌套的过滤组，支持复杂逻辑
    ]
  },
  "sort": [
    {
      "field": "字段名",
      "order": "asc"  // 或 "desc"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "all": false  // true: 返回全部数据, false: 按分页返回
  },
  "verbose": true  // true: 返回详细信息, false: 仅返回UPN列表
}
```

## 支持的字段

### 基本信息
- `upn` - 用户主体名
- `email` - 邮箱
- `displayName` - 显示名
- `name` - 全名
- `employeeId` - 员工/学号

### 组织信息
- `department` - 部门
- `title` - 职务
- `office` - 办公室
- `officePhone` - 办公电话

### 身份信息
- `schoolStatus` - 在校状态 (Employed, Dimission, In-School, Graduation, Withdraw, Emeritus)
- `identityType` - 身份类型 (Fulltime, CO, Student, Parttime)
- `employeeType` - 员工类型

### 学生信息
- `studentCategoryPrimary` - 学历大类 (Postgraduate, Undergraduate)
- `studentCategoryDetail` - 学历细类 (Master, Ph.D., Undergraduate)
- `studentNationalityType` - 学生类别 (Local, Exchange, International, CUCDMP, HMT)
- `residentialCollege` - 书院
- `fundingTypeOrAdmissionYear` - 经费类型/入学年份

### 其他
- `staffRole` - 教职员角色
- `samAccountName` - SAM账户名
- `mailNickname` - 邮件别名
- `tags` - 标签
- `createdAt` - 创建时间
- `updatedAt` - 更新时间

## 支持的操作符

- `eq` - 等于
- `neq` - 不等于
- `gt` - 大于
- `gte` - 大于等于
- `lt` - 小于
- `lte` - 小于等于
- `like` - 模糊匹配 (需要自己加%)
- `ilike` - 不区分大小写模糊匹配
- `contains` - 包含子串 (自动加%)
- `notcontains` - 不包含子串
- `startswith` - 以...开头
- `endswith` - 以...结尾
- `in` - 在列表中
- `notin` - 不在列表中
- `isnull` - 为空
- `isnotnull` - 不为空

## 使用示例

### 1. 简单查询 - 查找特定部门的员工
```json
{
  "filter": {
    "logic": "and",
    "conditions": [
      {
        "field": "department",
        "op": "eq",
        "value": "计算机学院"
      },
      {
        "field": "identityType",
        "op": "eq",
        "value": "Fulltime"
      }
    ]
  },
  "verbose": false
}
```

### 2. 模糊搜索 - 按姓名搜索
```json
{
  "filter": {
    "logic": "and",
    "conditions": [
      {
        "field": "name",
        "op": "contains",
        "value": "张"
      }
    ]
  },
  "sort": [
    {
      "field": "name",
      "order": "asc"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10
  },
  "verbose": true
}
```

### 3. 范围查询 - 查找特定入学年份的学生
```json
{
  "filter": {
    "logic": "and",
    "conditions": [
      {
        "field": "identityType",
        "op": "eq",
        "value": "Student"
      },
      {
        "field": "fundingTypeOrAdmissionYear",
        "op": "gte",
        "value": "2020"
      },
      {
        "field": "fundingTypeOrAdmissionYear",
        "op": "lte",
        "value": "2023"
      }
    ]
  },
  "verbose": true
}
```

### 4. IN 查询 - 查找多个部门的员工
```json
{
  "filter": {
    "logic": "and",
    "conditions": [
      {
        "field": "department",
        "op": "in",
        "value": ["计算机学院", "信息工程学院", "数学学院"]
      },
      {
        "field": "schoolStatus",
        "op": "eq",
        "value": "Employed"
      }
    ]
  },
  "verbose": false
}
```

### 5. 复杂嵌套查询 - (学生 AND 本科生) OR (员工 AND 教学岗)
```json
{
  "filter": {
    "logic": "or",
    "conditions": [],
    "groups": [
      {
        "logic": "and",
        "conditions": [
          {
            "field": "identityType",
            "op": "eq",
            "value": "Student"
          },
          {
            "field": "studentCategoryPrimary",
            "op": "eq",
            "value": "Undergraduate"
          }
        ]
      },
      {
        "logic": "and",
        "conditions": [
          {
            "field": "identityType",
            "op": "eq",
            "value": "Fulltime"
          },
          {
            "field": "staffRole",
            "op": "eq",
            "value": "Teaching"
          }
        ]
      }
    ]
  },
  "sort": [
    {
      "field": "department",
      "order": "asc"
    },
    {
      "field": "name",
      "order": "asc"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 50
  },
  "verbose": true
}
```

### 6. 标签查询 - 查找带有特定标签的用户
```json
{
  "filter": {
    "logic": "and",
    "conditions": [
      {
        "field": "tags",
        "op": "contains",
        "value": "VIP"
      }
    ]
  },
  "verbose": true
}
```

### 7. 空值查询 - 查找没有设置办公室的员工
```json
{
  "filter": {
    "logic": "and",
    "conditions": [
      {
        "field": "identityType",
        "op": "eq",
        "value": "Fulltime"
      },
      {
        "field": "office",
        "op": "isnull",
        "value": null
      }
    ]
  },
  "verbose": true
}
```

### 8. 全部数据查询 - 导出特定部门的所有员工（不分页）
```json
{
  "filter": {
    "logic": "and",
    "conditions": [
      {
        "field": "department",
        "op": "eq",
        "value": "计算机学院"
      },
      {
        "field": "identityType",
        "op": "eq",
        "value": "Fulltime"
      }
    ]
  },
  "sort": [
    {
      "field": "name",
      "order": "asc"
    }
  ],
  "pagination": {
    "all": true
  },
  "verbose": true
}
```

**注意**: 使用 `"all": true` 时，系统会有安全限制：
- 最大返回 10,000 条记录
- 如果查询结果超过限制，需要添加更精确的过滤条件
- 建议只在确实需要全部数据的场景使用（如导出功能）

## 响应格式

```json
{
  "userUpns": ["user1@cuhk.edu.cn", "user2@cuhk.edu.cn"],
  "userInfos": [
    // 详细用户信息（verbose=true时）
  ],
  "total": 150,
  "page": 1,
  "pageSize": 20,
  "totalPages": 8,
  "isAll": false  // true表示返回了全部数据，false表示分页数据
}
```

### 响应字段说明
- `userUpns`: 用户UPN列表，总是返回
- `userInfos`: 详细用户信息，仅在 `verbose=true` 时返回
- `total`: 符合条件的总记录数
- `page`: 当前页码（all=true时固定为1）
- `pageSize`: 每页条数（all=true时等于total）
- `totalPages`: 总页数（all=true时固定为1）
- `isAll`: 是否为全部数据查询

## 性能建议

1. **使用索引字段排序**: 优先使用 `upn`, `email`, `employeeId`, `name`, `department` 等有索引的字段进行排序。

2. **合理设置分页大小**: 建议 `pageSize` 不超过 100，默认为 20。最大限制为 1000。

3. **精确查询优于模糊查询**: 优先使用 `eq` 而不是 `like` 或 `contains`。

4. **善用字段过滤**: 当只需要 UPN 列表时，设置 `verbose: false` 可以显著提高性能。

5. **避免过度嵌套**: 虽然支持复杂嵌套查询，但过度嵌套可能影响性能，建议嵌套层数不超过 3 层。

6. **谨慎使用全部数据查询**: 
   - 仅在确实需要时使用 `"all": true`（如导出功能）
   - 系统限制最大返回 10,000 条记录
   - 如果数据量大，先用精确的过滤条件缩小结果集
   - 全部数据查询会消耗更多内存和网络带宽

## 安全特性

1. **字段白名单**: 只允许查询预定义的安全字段。
2. **SQL注入防护**: 所有查询参数都通过参数绑定，完全防止SQL注入。
3. **操作符限制**: 只支持预定义的安全操作符。
4. **数据校验**: 所有输入都经过严格的数据校验。

