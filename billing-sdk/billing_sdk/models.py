"""
Pydantic models for billing SDK
"""

from datetime import datetime
from decimal import Decimal
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field, field_validator


class BillingRecordRequest(BaseModel):
    """Request model for billing record API"""
    upn: str = Field(..., description="User Principal Name")
    service: str = Field(..., description="Service name")
    product: str = Field(..., description="Product name")
    plan: str = Field(..., description="Billing plan")
    source: str = Field(..., description="Source quota pool")
    cny_cost: Optional[Decimal] = Field(None, description="Cost in CNY")
    usd_cost: Optional[Decimal] = Field(None, description="Cost in USD")
    detail: Optional[Dict[str, Any]] = Field(None, description="Detailed billing information")

    @field_validator('plan')
    @classmethod
    def validate_plan(cls, v):
        allowed_plans = ["Included", "Quota Pool"]
        if v not in allowed_plans:
            raise ValueError(f"Plan must be one of {allowed_plans}")
        return v


class BillingRecordResponse(BaseModel):
    """Response model for billing record API"""
    ok: bool = Field(..., description="Success status")


class CheckBalanceRequest(BaseModel):
    """Request model for check balance API"""
    quota_pool: str = Field(..., description="Quota pool name")


class CheckBalanceResponse(BaseModel):
    """Response model for check balance API"""
    ok: bool = Field(..., description="Balance availability status")
    percentage: str = Field(..., description="Remaining balance percentage")
    next_reset_at: datetime = Field(..., description="Next reset time")


class CheckTokensUsageRequest(BaseModel):
    """Request model for check tokens usage API"""
    upn: str = Field(..., description="User Principal Name")
    quota_pool: str = Field(..., description="Quota pool name")
    n_days: int = Field(7, description="Number of days to check")

    @field_validator('n_days')
    @classmethod
    def validate_n_days(cls, v):
        if v <= 0:
            raise ValueError("n_days must be positive")
        return v


class CheckTokensUsageResponse(BaseModel):
    """Response model for check tokens usage API"""
    tokens_usage: Dict[str, Any] = Field(..., description="Tokens usage data")


class ExportBillRecordRequest(BaseModel):
    """Request model for export bill record API"""
    quota_pool: str = Field(..., description="Quota pool name")
    svc: Optional[List[str]] = Field(None, description="Service filters")
    product: Optional[List[str]] = Field(None, description="Product filters")
    start_time: str = Field(..., description="Start time (ISO format)")
    end_time: str = Field(..., description="End time (ISO format)")
    export_type: str = Field(..., description="Export format")

    @field_validator('export_type')
    @classmethod
    def validate_export_type(cls, v):
        allowed_types = ["pdf", "xlsx"]
        if v not in allowed_types:
            raise ValueError(f"export_type must be one of {allowed_types}")
        return v


class ExportBillRecordResponse(BaseModel):
    """Response model for export bill record API"""
    file: bytes = Field(..., description="Binary file content")


class GetBillRecordRequest(BaseModel):
    """Request model for get bill record API"""
    quota_pool: str = Field(..., description="Quota pool name")
    svc: Optional[List[str]] = Field(None, description="Service filters")
    product: Optional[List[str]] = Field(None, description="Product filters")
    start_time: str = Field(..., description="Start time (ISO format)")
    end_time: str = Field(..., description="End time (ISO format)")


class GetBillRecordResponse(BaseModel):
    """Response model for get bill record API"""
    records: List[Dict[str, Any]] = Field(..., description="Billing records")