export interface Condition {
  field: string;
  operator: string;
  value: string;
}

export interface IttoolsRule {
  logical_operator: 'AND' | 'OR';
  conditions: Condition[];
}

export interface ManualRule {
    upns: string[];
}

export interface AbstractGroupRule {
    ittools?: IttoolsRule;
    manual?: ManualRule;
}

export interface AbstractGroup {
  id: string;
  name: string;
  description: string;
  type: 'ittools' | 'manual';
  rule: AbstractGroupRule;
  creatorUpn: string;
  createdAt: string;
  updatedAt: string;
  chatCategory?: ChatCategory;
}

export interface ChatCategory {
  ID: number;
  name: string;
  defaultQuota: number;
  resetCircle: number;
  priority: number;
  quotaPool?: QuotaPool;
  chatQuotaPoolId?: number;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface QuotaPool {
  ID?: number;
  name: string;
  balance: number;
  defaultQuota: number;
  lastResetTime: string;
}
