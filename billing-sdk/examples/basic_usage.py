"""
Basic usage example for billing SDK
"""

import asyncio
from datetime import datetime, timedelta
from decimal import Decimal

import httpx

from billing_sdk import BillingClient
from billing_sdk.models import (
    BillingRecordRequest, CheckBalanceRequest, CheckTokensUsageRequest,
    ExportBillRecordRequest, GetBillRecordRequest
)


async def basic_usage_example():
    """Basic usage example of the billing SDK"""
    
    # Initialize client
    async with BillingClient(
        base_url="https://your-uniauth-api.com",
        api_key="your-api-key-here"
    ) as client:
        
        # 1. Submit a billing record
        billing_req = BillingRecordRequest(
            upn="user@example.com",
            service="ai-service",
            product="gpt-4",
            plan="Quota Pool",
            source="default-pool",
            cny_cost=Decimal("0.15"),
            usd_cost=Decimal("0.02"),
            detail={
                "tokens": 1500,
                "model": "gpt-4",
                "duration_ms": 2500
            }
        )
        
        try:
            result = await client.billing_record(billing_req)
            print(f"✓ Billing record submitted: {result.ok}")
        except Exception as e:
            print(f"✗ Billing record failed: {e}")
        
        # 2. Check balance
        balance_req = CheckBalanceRequest(quota_pool="default-pool")
        try:
            balance = await client.check_balance(balance_req)
            print(f"✓ Balance: {balance.percentage}%")
            print(f"  Next reset: {balance.next_reset_at}")
        except Exception as e:
            print(f"✗ Balance check failed: {e}")
        
        # 3. Check tokens usage
        tokens_req = CheckTokensUsageRequest(
            upn="user@example.com",
            quota_pool="default-pool",
            n_days=7
        )
        try:
            tokens_usage = await client.check_tokens_usage(tokens_req)
            print(f"✓ Tokens usage data: {len(tokens_usage.tokens_usage)} records")
        except Exception as e:
            print(f"✗ Tokens usage check failed: {e}")


async def admin_example():
    """Admin functions example"""
    
    async with BillingClient(
        base_url="https://your-uniauth-api.com",
        api_key="admin-api-key"
    ) as client:
        
        # Calculate date range (last 30 days)
        end_time = datetime.now()
        start_time = end_time - timedelta(days=30)
        
        # 1. Get billing records
        get_req = GetBillRecordRequest(
            quota_pool="default-pool",
            svc=["ai-service", "ml-service"],
            product=["gpt-5", "image-generation"],
            start_time=start_time.isoformat(),
            end_time=end_time.isoformat()
        )
        
        try:
            records = await client.get_bill_record(get_req)
            print(f"✓ Found {len(records.records)} billing records")
        except Exception as e:
            print(f"✗ Get records failed: {e}")
        
        # 2. Export billing records to PDF
        export_req = ExportBillRecordRequest(
            quota_pool="default-pool",
            svc=["ai-service"],
            product=["gpt-5", "image-generation"],
            start_time=start_time.isoformat(),
            end_time=end_time.isoformat(),
            export_type="pdf"
        )
        
        try:
            export_result = await client.export_bill_record(export_req)
            with open("billing_report.pdf", "wb") as f:
                f.write(export_result.file)
            print("✓ PDF report exported successfully")
        except Exception as e:
            print(f"✗ Export failed: {e}")


async def error_handling_example():
    """Demonstrate error handling"""
    
    async with BillingClient(
        base_url="https://your-uniauth-api.com",
        api_key="invalid-key"
    ) as client:
        
        try:
            # This should fail with invalid auth
            balance_req = CheckBalanceRequest(quota_pool="default-pool")
            await client.check_balance(balance_req)
        except httpx.HTTPStatusError as e:
            print(f"HTTP Error {e.response.status_code}: {e.response.text}")
        except httpx.RequestError as e:
            print(f"Request Error: {e}")
        except Exception as e:
            print(f"Unexpected Error: {e}")


if __name__ == "__main__":
    print("=== Basic Usage Example ===")
    asyncio.run(basic_usage_example())
    
    print("\n=== Admin Functions Example ===")
    asyncio.run(admin_example())
    
    print("\n=== Error Handling Example ===")
    asyncio.run(error_handling_example())