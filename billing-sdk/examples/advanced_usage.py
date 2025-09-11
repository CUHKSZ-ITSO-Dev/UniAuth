"""
Advanced usage patterns for billing SDK
"""

import asyncio
from decimal import Decimal
from typing import List, Dict, Any

from billing_sdk import BillingClient
from billing_sdk.models import (
    BillingRecordRequest, CheckBalanceRequest, CheckTokensUsageRequest,
    ExportBillRecordRequest
)


class BillingService:
    """High-level service wrapper for common billing operations"""
    
    def __init__(self, client: BillingClient):
        self.client = client
    
    async def submit_multiple_records(self, records: List[Dict[str, Any]]) -> List[bool]:
        """Submit multiple billing records concurrently"""
        
        async def submit_single(record_data: Dict[str, Any]) -> bool:
            request = BillingRecordRequest(**record_data)
            try:
                result = await self.client.billing_record(request)
                return result.ok
            except Exception:
                return False
        
        # Submit all records concurrently
        tasks = [submit_single(record) for record in records]
        return await asyncio.gather(*tasks)
    
    async def monitor_balance(self, quota_pool: str, threshold_percent: float = 20.0) -> bool:
        """Monitor balance and alert if below threshold"""
        
        request = CheckBalanceRequest(quota_pool=quota_pool)
        balance = await self.client.check_balance(request)
        
        percentage = float(balance.percentage.strip('%'))
        if percentage < threshold_percent:
            print(f"⚠️  Low balance alert: {percentage}% remaining")
            return False
        
        print(f"✓ Balance healthy: {percentage}%")
        return True
    
    async def get_usage_summary(self, upn: str, quota_pool: str, days: int = 30) -> Dict[str, Any]:
        """Get comprehensive usage summary"""
        
        # Get tokens usage
        tokens_req = CheckTokensUsageRequest(upn=upn, quota_pool=quota_pool, n_days=days)
        tokens_data = await self.client.check_tokens_usage(tokens_req)
        
        return {
            "upn": upn,
            "quota_pool": quota_pool,
            "days_analyzed": days,
            "tokens_usage": tokens_data.tokens_usage,
            "total_cost": self._calculate_total_cost(tokens_data.tokens_usage)
        }
    
    def _calculate_total_cost(self, tokens_usage: Dict[str, Any]) -> Decimal:
        """Calculate total cost from usage data"""
        # Implementation depends on the actual structure of tokens_usage
        return Decimal("0.00")  # Placeholder


async def batch_processing_example():
    """Example of batch processing billing records"""
    
    # Sample billing data
    billing_records = [
        {
            "upn": "user1@example.com",
            "service": "ai-service",
            "product": "gpt-4",
            "plan": "Quota Pool",
            "source": "default-pool",
            "cny_cost": Decimal("0.10"),
            "detail": {"tokens": 1000}
        },
        {
            "upn": "user2@example.com",
            "service": "ai-service", 
            "product": "gpt-3.5",
            "plan": "Included",
            "source": "default-pool",
            "cny_cost": Decimal("0.05"),
            "detail": {"tokens": 500}
        },
        {
            "upn": "user3@example.com",
            "service": "ml-service",
            "product": "image-generation",
            "plan": "Quota Pool", 
            "source": "default-pool",
            "cny_cost": Decimal("0.20"),
            "detail": {"images": 10}
        }
    ]
    
    async with BillingClient(
        base_url="https://your-uniauth-api.com",
        api_key="your-api-key"
    ) as client:
        
        service = BillingService(client)
        
        # Submit all records concurrently
        print("Submitting billing records...")
        results = await service.submit_multiple_records(billing_records)
        
        success_count = sum(results)
        print(f"✓ {success_count}/{len(results)} records submitted successfully")
        
        # Monitor balance
        print("Checking balance...")
        is_healthy = await service.monitor_balance("default-pool", threshold_percent=30.0)
        
        if is_healthy:
            print("✓ Billing system is healthy")
        else:
            print("⚠️  Consider adding more quota")


async def monitoring_example():
    """Example of continuous monitoring"""
    
    async with BillingClient(
        base_url="https://your-uniauth-api.com",
        api_key="your-api-key"
    ) as client:
        
        service = BillingService(client)
        
        # Monitor multiple quota pools
        quota_pools = ["default-pool", "premium-pool", "enterprise-pool"]
        
        print("Starting balance monitoring...")
        for pool in quota_pools:
            try:
                await service.monitor_balance(pool, threshold_percent=25.0)
            except Exception as e:
                print(f"✗ Failed to monitor {pool}: {e}")


async def reporting_example():
    """Example of generating comprehensive reports"""
    
    async with BillingClient(
        base_url="https://your-uniauth-api.com",
        api_key="admin-api-key"
    ) as client:
        
        service = BillingService(client)
        
        # Generate usage summary for a user
        summary = await service.get_usage_summary(
            upn="user@example.com",
            quota_pool="default-pool", 
            days=30
        )
        
        print(f"Usage Summary for {summary['upn']}:")
        print(f"  Quota Pool: {summary['quota_pool']}")
        print(f"  Days Analyzed: {summary['days_analyzed']}")
        print(f"  Total Cost: {summary['total_cost']}")
        
        # Export detailed report
        from datetime import datetime, timedelta
        
        end_time = datetime.now()
        start_time = end_time - timedelta(days=30)
        
        export_req = ExportBillRecordRequest(
            quota_pool="default-pool",
            svc=["ai-service", "ml-service"],
            product=["gpt-5", "image-generation"],
            start_time=start_time.isoformat(),
            end_time=end_time.isoformat(),
            export_type="xlsx"
        )
        
        try:
            export_result = await client.export_bill_record(export_req)
            filename = f"billing_report_{datetime.now().strftime('%Y%m%d')}.xlsx"
            with open(filename, "wb") as f:
                f.write(export_result.file)
            print(f"✓ Detailed report exported: {filename}")
        except Exception as e:
            print(f"✗ Report export failed: {e}")


if __name__ == "__main__":
    print("=== Batch Processing Example ===")
    asyncio.run(batch_processing_example())
    
    print("\n=== Monitoring Example ===")
    asyncio.run(monitoring_example())
    
    print("\n=== Reporting Example ===")
    asyncio.run(reporting_example())