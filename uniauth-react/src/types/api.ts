export interface PermissionCheckRequest {
  upn: string;
  context: Record<string, any>;
  resource: string;
  action: string;
}

export interface BatchOperationRequest {
  upns: string[];
  operation: 'add' | 'remove' | 'addToGroup' | 'removeFromGroup';
  resource?: string;
  resourceId?: string;
  action?: string;
  groupName?: string;
  effect?: 'allow' | 'deny';
}

export interface SyncResult {
  status: string;
  source: string;
  timestamp: Date;
  message: string;
}

export interface AuditReport {
  highRiskUsers: any[];
  recommendations: any[];
}
