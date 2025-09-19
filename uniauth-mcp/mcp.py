from fastmcp import FastMCP
import aiohttp
import logging

logger = logging.getLogger(__name__)

mcp = FastMCP("UniAuth")


@mcp.tool
def add(a: int, b: int) -> int:
    """简单的加法运算
    
    Args:
        a (int): 第一个数字
        b (int): 第二个数字
        
    Returns:
        int: 两个数字的和
    """
    return a + b

# @mcp.tool(
#     name = "Search ITTools Infomation",
#     description="""
#     获取用户SSO信息
    
#     根据用户的UPN (User Principal Name) 查询并返回该用户的完整身份信息，
#     包括基本信息、身份状态、员工/学生信息、工作信息等。
    
#     Args:
#         upn (str): 用户主体名称，格式为 用户名@cuhk.edu.cn 或 学号@link.cuhk.edu.cn
        
#     Returns:
#         dict: 包含用户完整信息的字典，包括：
#             - upn: 用户主体名称
#             - email: 邮箱地址
#             - displayName: 显示名称
#             - name: 用户全名
#             - schoolStatus: 在校状态 (Employed/Dimission/In-School/Graduation/Withdraw/Emeritus)
#             - identityType: 身份类型 (Fulltime/CO/Student/Parttime)
#             - employeeId: 员工编号或学号
#             - department: 部门信息
#             - title: 职务名称
#             - 以及其他相关字段...
            
#     Raises:
#         返回包含error字段的字典，如果请求失败
#     """
# )
# async def oneSSOInfo(upn: str) -> dict:
   
#     try:
#         async with httpx.AsyncClient() as client:
#             response = await client.get(f"http://localhost:8000/userinfos?upn={upn}")
#             response.raise_for_status()
#             return response.json()
#     except httpx.HTTPError as e:
#         return {"error": f"HTTP错误: {str(e)}"}
#     except Exception as e:
#         return {"error": f"请求失败: {str(e)}"}


@mcp.tool(
    name="Get Bill Record",
    description="""
    查询账单
    
    查询账单，根据一定的条件。有两个类型的账单：
    1. 配额池出账（可以传Array），每个配额池的账单会在不同的工作表里面；
    2. 个人出账（可以传Array），每个人的消费记录会在不同的工作表里面。
    QuotaPool 数组和 UPN 数组只能同时传一个。
    
    Args:
        upns (list[str], optional): UPN列表，格式为 ['122020255@link.cuhk.edu.cn']
        quota_pools (list[str], optional): 配额池列表，格式为 ['student_pool']
        svc (list[str], optional): 微服务列表，格式为 ['chat', 'voice']
        product (list[str], optional): 产品列表，格式为 ['deep-research', 'qwen3-235b-a22b-instruct-2507'] 等
        start_time (str): 开始时间，格式为 '2024-01-01'
        end_time (str): 结束时间，格式为 '2024-01-01'
        
    Returns:
        dict: 包含账单记录的字典
        
    Raises:
        返回包含error字段的字典，如果请求失败
    """
)
async def getBillRecord(
    start_time: str,
    end_time: str,
    upns: list[str] = None,
    quota_pools: list[str] = None,
    svc: list[str] = None,
    product: list[str] = None
) -> dict:
    """
    查询账单记录
    """
    try:
        # 构建请求体
        request_body = {
            "startTime": start_time,
            "endTime": end_time
        }
        
        # 添加可选参数
        if upns is not None:
            request_body["upns"] = upns
        if quota_pools is not None:
            request_body["quotaPools"] = quota_pools
        if svc is not None:
            request_body["svc"] = svc
        if product is not None:
            request_body["product"] = product
        
        timeout = aiohttp.ClientTimeout(total=60)
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.post(
                "http://localhost:8000/billing/admin/get",
                json=request_body,
                headers={"Content-Type": "application/json"}
            ) as response:
                # response.raise_for_status()
                return await response.json()
    except aiohttp.ClientError as e:
        logger.exception("错误")
        return {"error": f"HTTP错误: {str(e)}"}
    except Exception as e:
        return {"error": f"请求失败: {str(e)}"}
    
if __name__ == "__main__":
    mcp.run()
