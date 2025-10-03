// 验证六字段的cron表达式
export const validateFiveFieldCron = (cronExpression: string): boolean => {
  if (!cronExpression || typeof cronExpression !== "string") {
    return false;
  }
  const fields = cronExpression.trim().split(/\s+/);
  return fields.length === 5;
};
