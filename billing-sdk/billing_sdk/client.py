"""
Async HTTP client for billing API
"""

from typing import Optional, Dict
from datetime import datetime
import httpx
from .models import (
    BillingRecordRequest, BillingRecordResponse,
    CheckBalanceRequest, CheckBalanceResponse,
    CheckTokensUsageRequest, CheckTokensUsageResponse,
    ExportBillRecordRequest, ExportBillRecordResponse,
    GetBillRecordRequest, GetBillRecordResponse
)


class BillingClient:
    """Async client for UniAuth billing API"""
    
    def __init__(self, base_url: str, api_key: Optional[str] = None, timeout: int = 30):
        """
        Initialize billing client
        
        Args:
            base_url: Base URL of the billing API
            api_key: Optional API key for authentication
            timeout: Request timeout in seconds
        """
        self.base_url = base_url.rstrip('/')
        self.api_key = api_key
        self.timeout = timeout
        
        self._client = httpx.AsyncClient(
            base_url=self.base_url,
            timeout=timeout,
            headers=self._build_headers()
        )
    
    def _build_headers(self) -> Dict[str, str]:
        """Build request headers"""
        headers = {
            "Content-Type": "application/json",
            "User-Agent": "UniAuth-Billing-SDK/0.1.0"
        }
        
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
            
        return headers
    
    async def __aenter__(self):
        """Async context manager entry"""
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        await self.close()
    
    async def close(self):
        """Close the HTTP client"""
        await self._client.aclose()
    
    async def billing_record(self, request: BillingRecordRequest) -> BillingRecordResponse:
        """
        Submit billing record
        
        Args:
            request: Billing record request
            
        Returns:
            Billing record response
        """
        response = await self._client.post(
            "/billing/record",
            json=request.model_dump(exclude_none=True)
        )
        response.raise_for_status()
        return BillingRecordResponse(**response.json())
    
    async def check_balance(self, request: CheckBalanceRequest) -> CheckBalanceResponse:
        """
        Check quota pool balance
        
        Args:
            request: Check balance request
            
        Returns:
            Check balance response
        """
        response = await self._client.post(
            "/billing/check",
            json=request.model_dump(exclude_none=True)
        )
        response.raise_for_status()
        data = response.json()
        
        # Parse datetime string
        if 'next_reset_at' in data:
            data['next_reset_at'] = datetime.fromisoformat(data['next_reset_at'].replace('Z', '+00:00'))
        
        return CheckBalanceResponse(**data)
    
    async def check_tokens_usage(self, request: CheckTokensUsageRequest) -> CheckTokensUsageResponse:
        """
        Check tokens usage statistics
        
        Args:
            request: Check tokens usage request
            
        Returns:
            Check tokens usage response
        """
        response = await self._client.post(
            "/billing/checkTokensUsage",
            json=request.model_dump(exclude_none=True)
        )
        response.raise_for_status()
        return CheckTokensUsageResponse(**response.json())
    
    async def export_bill_record(self, request: ExportBillRecordRequest) -> ExportBillRecordResponse:
        """
        Export billing records
        
        Args:
            request: Export bill record request
            
        Returns:
            Export bill record response with file content
        """
        response = await self._client.post(
            "/billing/admin/export",
            json=request.model_dump(exclude_none=True)
        )
        response.raise_for_status()
        return ExportBillRecordResponse(file=response.content)
    
    async def get_bill_record(self, request: GetBillRecordRequest) -> GetBillRecordResponse:
        """
        Get billing records
        
        Args:
            request: Get bill record request
            
        Returns:
            Get bill record response
        """
        response = await self._client.post(
            "/billing/admin/get",
            json=request.model_dump(exclude_none=True)
        )
        response.raise_for_status()
        return GetBillRecordResponse(**response.json())
    
    async def health_check(self) -> bool:
        """
        Simple health check
        
        Returns:
            True if API is healthy
        """
        try:
            response = await self._client.get("/health")
            return response.status_code == 200
        except Exception:
            return False
