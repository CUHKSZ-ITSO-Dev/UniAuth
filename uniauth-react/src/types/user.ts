import type { PermissionNode } from './permissions';

export interface User {
  upn: string;
  displayName: string;
  email: string;
  name: string;
  department: string;
  primaryGroup: string;
  groups: string[];
  isActive: boolean;
}

export interface UserPermissionView {
  upn: string;
  displayName: string;
  email: string;
  primaryGroup: string;
  groups: string[];
  roles: string[];
  internalPermissions: string[];
  lastSync: string;
  permissionTree: PermissionNode[];
  totalPermissions: number;
}
