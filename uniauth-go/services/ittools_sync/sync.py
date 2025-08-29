import asyncio
import json
import os
import re
from datetime import datetime
from typing import Any
from zoneinfo import ZoneInfo
import asyncpg
from aiohttp import ClientError, ClientSession

# --- 环境变量配置 ---
# PostgreSQL 连接信息
PGHOST = os.getenv("PGHOST")
PGUSER = os.getenv("PGUSER")
PGPASSWORD = os.getenv("PGPASSWORD")
PGNAME = os.getenv("PGNAME")
PGPORT = os.getenv("PGPORT", "5432")


def validate_pg_env() -> None:
    missing = []
    for name, value in [
        ("PGHOST", PGHOST),
        ("PGUSER", PGUSER),
        ("PGPASSWORD", PGPASSWORD),
        ("PGNAME", PGNAME),
    ]:
        if not value:
            missing.append(name)
    if missing:
        print(f"错误：缺少必需的PostgreSQL环境变量：{', '.join(missing)}")
        raise SystemExit(1)


# AD/ITTools API 配置
QUERY_API_KEYS = json.loads(os.getenv("QUERY_API_KEYS", "[]"))
USER_QUERY_URL = os.getenv("USER_QUERY_URL")
ENCRYPT_PASSWORD = os.getenv("ENCRYPT_PASSWORD")


async def fetch_ad_users() -> list[dict[str, Any]]:
    """从 ITTools API 获取 AD 用户数据"""
    print("（1/3）获取AD数据...")
    data = {"OperateName": "GetAD-gitea", "EncryptPassword": ENCRYPT_PASSWORD}

    async def fetch_one(session: ClientSession, api_key: str) -> dict[str, Any] | None:
        headers = {"x-api-key": api_key, "Content-Type": "application/json"}
        try:
            async with session.post(
                USER_QUERY_URL, headers=headers, json=data
            ) as response:
                response.raise_for_status()
                return await response.json()
        except ClientError as e:
            print(f"错误：ITTools API请求失败 (key: ...{api_key[-4:]}): {e}")
            return None

    async with ClientSession() as session:
        tasks = [fetch_one(session, key) for key in QUERY_API_KEYS]
        responses = await asyncio.gather(*tasks)

    print("（2/3）AD数据获取成功，正在解析数据...")
    result: list[dict[str, Any]] = []
    for res in responses:
        if res and "data" in res:
            result.extend(res["data"])

    return result


async def sync_to_postgres(users: list[dict[str, Any]]) -> None:
    """将用户数据同步到 PostgreSQL"""
    print("\n--- 开始同步到 PostgreSQL ---")
    try:
        conn = await asyncpg.connect(
            host=PGHOST,
            port=int(PGPORT),
            user=PGUSER,
            password=PGPASSWORD,
            database=PGNAME,
        )
        print("PostgreSQL连接成功。")

        async with conn.transaction():
            print("(3/3) 正在写入数据到PostgreSQL...")
            for user in users:
                now = datetime.now(ZoneInfo("Asia/Shanghai"))
                upn = user.get("userPrincipalName")
                if not upn:
                    # 缺少主键 UPN，跳过该记录
                    continue
                await conn.execute(
                    """
                      INSERT INTO user_infos (
                          upn, email, display_name, unique_name, sam_account_name, school_status, identity_type, employee_id,
                          name, department, title, office, office_phone, employee_type,
                          funding_type_or_admission_year, student_category_primary,
                          student_category_detail, student_nationality_type, residential_college,
                          staff_role, mail_nickname, tags,
                          created_at, updated_at
                      ) VALUES (
                          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
                          $15, $16, $17, $18, $19, $20, $21, $22, $23, $24
                      ) ON CONFLICT (upn) DO UPDATE SET
                          email = EXCLUDED.email,
                          display_name = EXCLUDED.display_name,
                          unique_name = EXCLUDED.unique_name,
                          sam_account_name = EXCLUDED.sam_account_name,
                          school_status = EXCLUDED.school_status,
                          identity_type = EXCLUDED.identity_type,
                          employee_id = EXCLUDED.employee_id,
                          name = EXCLUDED.name,
                          department = EXCLUDED.department,
                          title = EXCLUDED.title,
                          office = EXCLUDED.office,
                          office_phone = EXCLUDED.office_phone,
                          employee_type = EXCLUDED.employee_type,
                          funding_type_or_admission_year = EXCLUDED.funding_type_or_admission_year,
                          student_category_primary = EXCLUDED.student_category_primary,
                          student_category_detail = EXCLUDED.student_category_detail,
                          student_nationality_type = EXCLUDED.student_nationality_type,
                          residential_college = EXCLUDED.residential_college,
                          staff_role = EXCLUDED.staff_role,
                          mail_nickname = EXCLUDED.mail_nickname,
                          tags = EXCLUDED.tags,
                          updated_at = EXCLUDED.updated_at
                    """,
                    user.get("userPrincipalName"),
                    user.get("mail"),
                    user.get("displayName"),
                    user.get("name"),
                    user.get("samaccountname"),
                    user.get("extensionattribute5"),
                    user.get("extensionattribute7"),
                    user.get("EmployeeID"),
                    user.get("name"),
                    user.get("department"),
                    user.get("title"),
                    user.get("office"),
                    user.get("officephone"),
                    user.get("employeeType"),
                    user.get("extensionattribute1"),
                    user.get("extensionattribute2"),
                    user.get("extensionattribute3"),
                    user.get("extensionattribute4"),
                    user.get("extensionattribute6"),
                    user.get("extensionattribute10"),
                    user.get("mailnickname"),
                    re.findall(r"CN=([^,]+)", user.get("memberof", "")),
                    now,
                    now,
                )
        print("数据写入PostgreSQL成功。")

        print("清理PostgreSQL过期数据...")
        result = await conn.execute(
            "DELETE FROM user_infos WHERE updated_at < NOW() - INTERVAL '7 days'"
        )
        deleted_count_str = result.split(" ")[-1]
        deleted_count = int(deleted_count_str) if deleted_count_str.isdigit() else 0
        print(f"已从PostgreSQL清理 {deleted_count} 条过期记录")

        await conn.close()
    except Exception as e:
        print(f"同步到PostgreSQL时出错: {e}")


async def main() -> None:
    """主同步流程"""
    try:
        validate_pg_env()
        users = await fetch_ad_users()
        await sync_to_postgres(users)
    except Exception as e:
        print(f"同步过程中发生严重错误: {e}")


if __name__ == "__main__":
    print("--- 开始AD数据同步任务 ---")
    asyncio.run(main())
    print("\n--- AD数据同步任务完成 ---")
