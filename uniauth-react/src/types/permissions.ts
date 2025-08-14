export interface PermissionNode {
  id: string;
  type: 'module' | 'resource' | 'action' | 'services';
  name: string;
  permission?: 'none' | 'access' | 'read' | 'write' | 'search' | 'admin' | 'use';
  isDenied?: boolean;
  canModify?: boolean;
  children?: PermissionNode[];
  denyReason?: string;
  source?: string;
  sourceName?: string;
}

export interface Explanation {
  allowed: boolean;
  reason: string;
  matchedRules: string[];
}
