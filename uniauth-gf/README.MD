# 设计文档

## ITTools -> userinfos

- 指定 upn，查询用户详情
- filter，根据指定规则，过滤出符合规则的所有用户的 upn/详细信息。
- 同步。sync.py CronJob

- uniauth 前端页面：
  - 用户列表页面（表格形式呈现，过滤搜索）
  - 用户详情页面，点击某个页面的详情后，可以查看用户详细的内容

## quota pool：配额池管理

- 只有配额池的概念
- 配额池 Quota Pool 有 刷新周期、定期配额、剩余配额、上次刷新时间、加油包。还有一个动态计算的：余额=剩余配额+加油包。（约定，刷新周期 < 0 时不刷新）
- 个人余额取消，每个人拥有自己的一个 quota pool
- 字段：disabled。例如学生自己的配额池，开启 disabled。
- 字段：personal 用来记录是否是用户默认自带的、自己的配额池（区别去手动创建的配额池）
- userinfos 规则需要在配额池里面声明。
- quota pool 对应的 casbin 里面的角色声明可以使用的功能。
- **每次用户登录的时候，检查有没有自己的 quota_pool，没有则新建一个 quota pool，从 config 里面那默认配置。如果有，比对有无变化，有变化立即修改自己的 quota_pool 的除余额、加油包之外的参数。调用 CheckPersonalQuotaPool**覆盖
- 每次请求前 check balance 时，查看选择的 quota_pool 是否需要重置。
- 创建 quota pool 流程：

  1. 每个人自带一个自己的 quota pool，为自动创建
  2. 需要有批量操作 quota pool 属性的接口和界面
  3. 其他配额池、科研组申请的配额池，为手动创建 quota pool，并配置配额池的 userinfos 规则，滤出对应的 upn，并在 casbin 中新建角色，并完成 g，upn，quota_pool 的角色继承设置。

- uniauth 前端页面：
  - 配额池列表页面（表格呈现、过滤搜索、添加新配额池、删除配额池、详情页面）
  - 配额池详情页面（可修改，还要呈现账单细则，IT 管理员可以导出账单，出单需给出选择（选择哪些内容出具报表））

## Casbin Auth 模块，管理鉴权

g, upn, student-pool

- 接口：动态获取用户属于哪些用户组，可以用什么模型。 ok
- 接口：查询一个配额池有哪些用户， ok
- 接口：一个配额池可以用什么模型。 ok
- 接口：基础权限查询。r = sub, dom, obj, act OK
- 接口：权限查询解释。用于管理。 OK
- 接口、权限：一键关闭一些权限 policy（关小黑屋） OK
- 对话前端：更改用户组的时候，需要请求获取配额池可用的模型。 已完成

- uniauth 前端页面设计：
  1. 一个 policy 筛选页面，可以手动添加 policy 快速将用户关小黑屋，接口是增/减 policy 的接口。
  2. 一个筛选配额池的页面，点击后的二级页面一个展示配额池权限的页面

g, 122@link.cuhk.edu.cn, student_pool 是通过创建配额池是配置的 userinfos 规则，同步完成添加
p, production, student_pool, platform, entry 这个是创建配置池时配置的配额池的权限

p, production, 122@link.cuhk.edu.cn, platform, entry, deny 这个必须要手动添加，是一个弹窗，需要一个接口

- uniauth 前后端的权限管理
  p, sub, dom, obj, act
  p, my upn, 'dom', uniauth/bill/quota_pool_name, read // 可以有查看 quota_pool_name 配额池的消费记录
  obj 里面有 uniauth 的，有权限的，则可以进入平台

## Config 配置中心，动态增减模型，动态 i18n

- 动态模型配置。前端需要一个编辑界面来完成。后端也要接口。
- i18n 配置。前端需要一个编辑界面来完成。后端也要接口。
- Quota Pools **自动**个人池新建时的默认配置。

- uniauth 前端设计：
  1. 模型配置列表，CRUD
  2. i18n 配置，CRUD，参考 xxx 网址。
  3. 配额池自动创建默认配置修改页面

## Billing 计费。账单导出

- Check Balance 接口。后端扣费时检验用户和配额池关系，再检查配额池情况。如果没有配额池，直接报错（返回不存在）。
  1. 先看看是否要刷新，懒刷新。
  2. 如果有配额池，但是对应的钱没有了，返回 token not enough。
  3. 需要返回 o 不 ok。返回这个钱包的余额百分比。返回报错原因/报错码
  4. 这个接口用于： 对话后端查询能不能用这个模型。
  5. 需要传递：upn，approach_id, quota_pool
  6. 对话前端：所有人的剩余用量的进度条删除。
- 对话前端界面：Check Tokens Usage，还是传游戏币，根据真的 cost 来。
- 计费接口

- 出单功能：

  1. 出单指 配额池 的出单。
  2. 出单时 可以选择特定的一些条目出单。svc=chat product=approach_id 时间区间。可以多选。出 PDF 或者 Excel。
     - remark：字段放每次 approach_id 对应的详细的模型调用、tool call、chat_session_id、msg_idx 等详细信息。JSON 格式，任意内容。可以选择要不要出详情。
     - 放在 PDF 里面：remark 放在文件的末尾作为备注。
     - 放在 Excel 里面：remark 直接放在最右边一列。
  3. 必须是 IT 出单。

- uniauth 前端页面：
  <!-- - 能够让配额池管理员等查看特定配额池的消费记录。可以自己增减团队成员。不可以出账。 -->
  - 目前不需要额外页面，相关页面内容请查看配额池管理部分
