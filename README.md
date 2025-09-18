
   __  __      _ ___         __  __  
  ╱ ╱ ╱ ╱___  (_)   │ __  __╱ ╱_╱ ╱_ 
 ╱ ╱ ╱ ╱ __ ╲╱ ╱ ╱│ │╱ ╱ ╱ ╱ __╱ __ ╲
╱ ╱_╱ ╱ ╱ ╱ ╱ ╱ ___ ╱ ╱_╱ ╱ ╱_╱ ╱ ╱ ╱
╲____╱_╱ ╱_╱_╱_╱  │_╲__,_╱╲__╱_╱ ╱_╱ 


UniAuth Automated System
Copyright 2025 The Chinese University of Hong Kong, Shenzhen

---
# Auth / Casbin 规则标准

```
[request_definition]
r = sub, obj, act

[policy_definition]
p = sub, obj, act, eft

[role_definition]
g = _, _

[policy_effect]
e = some(where (p.eft == allow)) && !some(where (p.eft == deny))

[matchers]
m = g(r.sub, p.sub) && keyMatch2(r.obj == p.obj) && r.act == p.act
```
---
示例：基础用法
p, student_pool, chat/common,  entry, allow
g, 122020255@link.cuhk.edu.cn, student_pool
g, 124090000@link.cuhk.edu.cn, student_pool
g, 888888888@link.cuhk.edu.cn, student_pool
p, 888888888@link.cuhk.edu.cn, svc/chat, entry, deny

以上代码完成了:
UPN=122020255@link.cuhk.edu.cn, 124090000@link.cuhk.edu.cn, 888888888@link.cuhk.edu.cn 属于 student_pool 组

student_pool 有 chat/common, act=entry 的权限

根据权限继承关系，122020255@link.cuhk.edu.cn, 124090000@link.cuhk.edu.cn, 888888888@link.cuhk.edu.cn  也会有 chat/common, entry 的权限。

**但注意最后配置了一条p, 888888888@link.cuhk.edu.cn, svc/chat, entry, deny。意味着这个人888888888@link.cuhk.edu.cn 会立即失去chat/common, entry 的权限。因为deny的优先级更高。为什么，请看 policy_effect 的条件。**

检查方法： r = 122020255@link.cuhk.edu.cn, chat/common, entry，返回allow

---
示例：通配符
p, student_pool, chat/approach/<approach_id>, access, allow

注意act设置什么没有固定要求，只要微服务和鉴权约定好用这个动作就可以，比如这里就用access 表示某人可以用approach_id的approach。

- p, student_pool, chat/approach/*, access, allow
这条规则可以匹配任意approach，也就是说，当查询： r = student_pool, chat/approach/1234, access， 返回的结果是允许

---
# 机要文件 Git-Crypt GnuPG 加密方案

## 普通成员
1. 软件安装
git-crypt 仓库地址：https://github.com/AGWA/git-crypt

2. 生成本机 GPG 秘钥
  - 终端运行，或者Git Bash（Windows）
      ```
      gpg --full-generate-key
      ```
  - 输出：
     ```
        $ gpg --full-generate-key
        gpg (GnuPG) 2.4.7-unknown; Copyright (C) 2024 g10 Code GmbH
        This is free software: you are free to change and redistribute it.
        There is NO WARRANTY, to the extent permitted by law.
        
        Please select what kind of key you want:
           (1) RSA and RSA
           (2) DSA and Elgamal
           (3) DSA (sign only)
           (4) RSA (sign only)
           (9) ECC (sign and encrypt) *default*
          (10) ECC (sign only)
          (14) Existing key from card
        Your selection?
     ```
        选 9 椭圆曲线加密算法。
  - 接下来
      ```
      Please select which elliptic curve you want:
         (1) Curve 25519 *default*
         (4) NIST P-384
         (6) Brainpool P-256
      Your selection? 
      ```
      选 1 ，Curve 25519 曲线。
  - 失效日期：
      ```
      Please specify how long the key should be valid.
               0 = key does not expire
            <n>  = key expires in n days
            <n>w = key expires in n weeks
            <n>m = key expires in n months
            <n>y = key expires in n years
      Key is valid for? (0)
      ```
      可以写1y，也可以直接0，看你个人选择
  - 输入名字，必须是你的 git 提交姓名 user.name 。可以使用 git config查看
  - 输入邮箱，必须是你的 git 提交邮箱 user.email。可以使用git config查看
  - 输入备注，看着写吧
  - 确认没问题，按o生成。
  - 然后需要配置一个密码，来保护你的秘钥。这个密码需要你自己记住
  - **设置完密码之后，会开始生成随机数。请根据要求，做一些随机操作。**
    ```
      We need to generate a lot of random bytes. It is a good idea to perform
    some other action (type on the keyboard, move the mouse, utilize the
    disks) during the prime generation; this gives the random number
    generator a better chance to gain enough entropy.
    ```

3. 导出公钥
```
使用账号
gpg --export --armor <name> > pub.asc

使用邮箱
gpg --export --armor <email> > pub.asc
```
例如 gpg --export --armor "Yechi Yang" > d:/yechi-pub.asc

4. 把这个pub.asc发到群里，或者私聊，或者直接下面跟帖都可以。因为这是公钥，**随便泄漏都没问题。** 最好粘贴文件。
---
如何使用？
1. 仓库克隆到本地以后使用 git-crypt unlock 即可。会提示你输入你设置的密码。输入后文件就解锁。

---
## 管理员/已授权人员需要加新人
gpg --import my-public-key.asc

cd /your/repository

git-crypt add-gpg-user name
或者
git-crypt add-gpg-user member.email@example.com

git push

不能直接add-gpg-user，否则会报错，要加一个参数 --trusted
```
报错：
$ gpg --import d:/pub.asc
gpg: key 03CBA28F0E387A7D: "Zitong Wu <mr.tom_123@outlook.com>" not changed
gpg: Total number processed: 1
gpg:              unchanged: 1

$ git-crypt add-gpg-user "Zitong Wu"
gpg: 969AE8D8D79E7C53: There is no assurance this key belongs to the named user
gpg: [stdin]: encryption failed: Unusable public key
git-crypt: GPG error: Failed to encrypt

工具命令：
$ git-crypt add-gpg-user 
Error: no GPG user ID specified
Usage: git-crypt add-gpg-user [OPTIONS] GPG_USER_ID ...

    -k, --key-name KEYNAME      Add GPG user to given key, instead of default
    -n, --no-commit             Don't automatically commit
    --trusted                   Assume the GPG user IDs are trusted

例如：
$ git-crypt add-gpg-user --trusted "Zitong Wu" 
[add-wzt-yang 53d16ac] Add 1 git-crypt collaborator
 1 file changed, 0 insertions(+), 0 deletions(-)
 create mode 100644 .git-crypt/keys/default/0/B188CD449CEA5DD65DB3B86D03CBA28F0E387A7D.gpg
```
通知该成员权限已添加，可以执行 git pull 和 git-crypt unlock 来解锁仓库了。

---

（可选）撤销成员权限：
很遗憾，经过搜索，git-crypt不支持撤销。
相关issue：https://github.com/AGWA/git-crypt/issues/47
因此处理步骤可以是撤销该成员对 GitHub 仓库的访问权限。

---
## 管理员初始化
和对话服务一样，先init。然后配置 .gitattributes， 然后 git-crypt status -f 加密就是。


---

# UniAuth GF 后端一键启动方法

1. 下载从我的数据库里导出的SQL：
[backup.sql](https://github.com/user-attachments/files/22319903/backup.sql)

2. 运行 Docker 命令创建 PostgresSQL 容器
```
docker run --env=POSTGRES_USER=uniauth --env=POSTGRES_PASSWORD=It@73333! --env=POSTGRES_DB=uniauth --env=PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/lib/postgresql/17/bin --env=GOSU_VERSION=1.17 --env=LANG=en_US.utf8 --env=PG_MAJOR=17 --env=PG_VERSION=17.6-1.pgdg13+1 --env=PGDATA=/var/lib/postgresql/data --volume=/var/lib/postgresql/data --network=bridge -p 5432:5432 --restart=no --runtime=runc -d postgres:latest
```
如果遇到拉不了镜像，自己想办法挂代理或者怎么办。

实在不行直接去官网下载pg数据库也行，不用docker了。然后创建的时候账号密码和数据库写这个（等号后面的）：
POSTGRES_USER=uniauth 
POSTGRES_PASSWORD=It@73333! 
POSTGRES_DB=uniauth

3. 运行命令

mac 和 Linux 系统：
```
cat backup.sql | docker exec -i <你启动的数据库容器名称> psql -U uniauth
```
windows 系统：
```
docker exec -i  <你启动的数据库容器名称> psql -U uniauth < backup.sql
```
容器名称可以用 `docker ps`查看，或者用 docker desktop 看。

5. 下载构建好的可执行文件
<img width="3024" height="1748" alt="image" src="https://github.com/user-attachments/assets/b25c18b3-57a1-4dcd-887e-57bb7f078913" />

选择你的系统版本，点击右边下载：
<img width="3024" height="1748" alt="image" src="https://github.com/user-attachments/assets/c5db6ece-2336-4712-82ae-f05f72c441a5" />

6. 本地启动。双击启动就可以。端口为8000。
<img width="1320" height="912" alt="image" src="https://github.com/user-attachments/assets/53ff90be-c1f6-450e-8a58-9c356cbe078b" />

---
备注：
Mac出现这个错误需要在隐私里面允许一下：
<img width="1702" height="1708" alt="image" src="https://github.com/user-attachments/assets/c5ed3ad0-9e4c-4598-a9d0-5afacbb004b8" />


 

