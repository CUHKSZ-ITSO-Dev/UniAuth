import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import api from '../api/client';

export const AuditLog: React.FC = () => {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [days, setDays] = useState(30);
  const [userFilter, setUserFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  // 获取审计日志
  const { data: auditData, isLoading } = useQuery({
    queryKey: ['auditLogs', page, pageSize, days, userFilter, actionFilter],
    queryFn: () => api.getAuditHistory({
      page,
      pageSize,
      days,
      user: userFilter || undefined,
      action: actionFilter || undefined,
    }),
  });

  // 获取审计统计
  const { data: auditStats } = useQuery({
    queryKey: ['auditStats', days],
    queryFn: () => api.getAuditStats(days),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const logs = auditData?.logs || [];
  const total = auditData?.total || 0;
  const totalPages = auditData?.totalPages || 0;

  // 安全地访问统计数据
  const dailyStats = auditStats?.dailyStats || [];
  const actionStats = auditStats?.actionStats || [];
  const userStats = auditStats?.userStats || [];

  // 获取操作类型的中文显示
  const getActionDisplay = (action: string) => {
    const actionMap: Record<string, string> = {
      'rule_added': '添加规则',
      'rule_updated': '更新规则',
      'rule_deleted': '删除规则',
      'batch_operation': '批量操作',
      'csv_import': 'CSV导入',
      'csv_export': 'CSV导出',
      'permission_change': '权限变更',
      'user_added_to_group': '添加到组',
      'user_removed_from_group': '从组移除',
      'template_applied': '应用模板',
    };
    return actionMap[action] || action;
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">审计日志</h1>
        <p className="text-gray-600">查看系统操作记录和统计信息</p>
      </div>

      {/* 统计卡片 */}
      {auditStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">每日操作统计</h3>
            <div className="space-y-2">
              {dailyStats.slice(0, 5).map((stat) => (
                <div key={stat.date} className="flex justify-between text-sm">
                  <span className="text-gray-600">{stat.date}</span>
                  <span className="font-medium">{stat.count} 次操作</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">操作类型统计</h3>
            <div className="space-y-2">
              {actionStats.slice(0, 5).map((stat) => (
                <div key={stat.action} className="flex justify-between text-sm">
                  <span className="text-gray-600">{getActionDisplay(stat.action)}</span>
                  <span className="font-medium">{stat.count} 次</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">活跃用户统计</h3>
            <div className="space-y-2">
              {userStats.slice(0, 5).map((stat) => (
                <div key={stat.user} className="flex justify-between text-sm">
                  <span className="text-gray-600 truncate" title={stat.user}>
                    {stat.user.length > 20 ? `${stat.user.substring(0, 20)}...` : stat.user}
                  </span>
                  <span className="font-medium">{stat.count} 次</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 过滤条件 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">时间范围</label>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={7}>最近7天</option>
              <option value={30}>最近30天</option>
              <option value={90}>最近90天</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">用户过滤</label>
            <input
              type="text"
              placeholder="输入用户名..."
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">操作类型</label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">所有操作</option>
              <option value="rule_added">添加规则</option>
              <option value="rule_updated">更新规则</option>
              <option value="rule_deleted">删除规则</option>
              <option value="batch_operation">批量操作</option>
              <option value="csv_import">CSV导入</option>
              <option value="csv_export">CSV导出</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setUserFilter('');
                setActionFilter('');
                setPage(1);
              }}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              清除过滤
            </button>
          </div>
        </div>
      </div>

      {/* 审计日志表格 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  用户
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  资源
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP地址
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  详情
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    暂无审计日志
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="max-w-xs truncate" title={log.user}>
                        {log.user || '系统'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {getActionDisplay(log.action)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.resource}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        log.success
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {log.success ? '成功' : '失败'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.ipAddress}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="max-w-xs truncate" title={log.details}>
                        {log.details}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              共 {total} 条记录，第 {page} / {totalPages} 页
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                上一页
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
