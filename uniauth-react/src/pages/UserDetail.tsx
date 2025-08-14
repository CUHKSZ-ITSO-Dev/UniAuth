import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog } from '@headlessui/react';
import {
  ArrowLeftIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  CogIcon,
  XMarkIcon,
  CurrencyDollarIcon,
  KeyIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

import api from '../api/client';
import { PermissionTree } from '../components/PermissionTree';
import type { PermissionNode, Explanation } from '../types';

export const UserDetail: React.FC = () => {
  const { upn } = useParams<{ upn: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedNode, setSelectedNode] = useState<PermissionNode | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [explanations, setExplanations] = useState<Record<string, Explanation>>({});
  const [activeTab, setActiveTab] = useState<'permissions' | 'costRecords'>('permissions');
  const [costRecordsPage, setCostRecordsPage] = useState(1);

  const { data: userPermission, isLoading } = useQuery({
    queryKey: ['userPermission', upn],
    queryFn: () => api.getUserPermissionTree(upn!),
    enabled: !!upn,
  });

  const { data: costRecordsData, isLoading: isLoadingCostRecords } = useQuery({
    queryKey: ['userCostRecords', upn, costRecordsPage],
    queryFn: () => api.getUserCostRecords(upn!, { page: costRecordsPage, pageSize: 20 }),
    enabled: !!upn && activeTab === 'costRecords',
  });

  const togglePermissionMutation = useMutation({
    mutationFn: ({ node, enable }: { node: PermissionNode; enable: boolean }) =>
      api.togglePermission(upn!, 'models', node.id, 'access', enable),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPermission', upn] });
      toast.success('权限已更新');
    },
    onError: () => {
      toast.error('权限更新失败');
    },
  });

  const explainPermissionMutation = useMutation({
    mutationFn: (node: PermissionNode) => {
      const module = userPermission?.permissionTree.find(m =>
        m.children?.some(c => c.id === node.id)
      );
      const domain = module?.id || (node.type === 'services' ? 'services' : 'models');

      return api.explainPermission(upn!, domain, node.id, 'access');
    },
    onSuccess: (data, node) => {
      setExplanations(prev => ({
        ...prev,
        [node.id]: data,
      }));
    },
    onError: () => {
      toast.error('获取权限来源失败');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!userPermission) {
    return <div>用户不存在</div>;
  }

  // 确保所有数组字段都有默认值
  const groups = userPermission.groups || [];
  const internalPermissions = userPermission.internalPermissions || [];
  const primaryGroup = userPermission.primaryGroup || '';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/users')}
                className="mr-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">用户权限管理</h1>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsTemplateModalOpen(true)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
              >
                <CogIcon className="w-5 h-5" />
                应用模板
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm p-6 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 基本信息 */}
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-600 font-semibold text-lg">
                  {userPermission.displayName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{userPermission.displayName}</h2>
                <p className="text-xs text-gray-400 mt-1">
                  最后同步: {format(new Date(userPermission.lastSync), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                </p>
              </div>
            </div>

            {/* 抽象组信息 */}
            <div>
              <div className="flex items-center mb-2">
                <UserGroupIcon className="w-5 h-5 text-gray-400 mr-2" />
                <span className="text-sm font-medium text-gray-700">抽象组</span>
              </div>
              <div className="space-y-1">
                {/* 显示所有抽象组，主要组加黑加粗加星星 */}
                {groups.length > 0 ? (
                  groups.map((group) => (
                    <span
                      key={group}
                      className={clsx(
                        'inline-flex items-center px-2 py-1 rounded-md text-xs font-medium',
                        group === primaryGroup
                          ? 'bg-yellow-100 text-black font-extrabold border border-yellow-300 text-sm'
                          : 'bg-gray-100 text-gray-800'
                      )}
                    >
                      {group}
                      {group === primaryGroup && (
                        <span className="text-yellow-500 ml-1 text-base">★</span>
                      )}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500 text-xs">暂无抽象组</span>
                )}
              </div>
            </div>

            {/* 内部权限信息 */}
            {internalPermissions.length > 0 && (
              <div>
                <div className="flex items-center mb-2">
                  <ShieldCheckIcon className="w-5 h-5 text-gray-400 mr-2" />
                  <span className="text-sm font-medium text-gray-700">内部权限</span>
                </div>
                <div className="space-y-1">
                  {internalPermissions.map((permission) => (
                    <span
                      key={permission}
                      className="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 text-blue-800 text-xs font-medium"
                    >
                      {permission}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 统计信息 */}
          <div className="mt-6 pt-6 border-t grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-2xl font-semibold text-gray-900">{userPermission.totalPermissions}</p>
              <p className="text-sm text-gray-500">总权限数</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold text-green-600">
                {groups.length + internalPermissions.length}
              </p>
              <p className="text-sm text-gray-500">权限组数</p>
            </div>
          </div>
        </motion.div>

        {/* Tab标签页 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm"
        >
          {/* Tab导航 */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('permissions')}
                className={clsx(
                  'py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2',
                  activeTab === 'permissions'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                <KeyIcon className="w-5 h-5" />
                权限管理
              </button>
              <button
                onClick={() => setActiveTab('costRecords')}
                className={clsx(
                  'py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2',
                  activeTab === 'costRecords'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                <CurrencyDollarIcon className="w-5 h-5" />
                消费记录
              </button>
            </nav>
          </div>

          {/* Tab内容 */}
          <div className="p-6">
            {activeTab === 'permissions' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">权限详情</h3>
                <PermissionTree
                  nodes={userPermission.permissionTree}
                  onTogglePermission={(node, enable) => togglePermissionMutation.mutate({ node, enable })}
                  onEditNode={(node) => {
                    setSelectedNode(node);
                    setIsEditModalOpen(true);
                  }}
                  onExplainPermission={(node) => {
                    explainPermissionMutation.mutate(node);
                  }}
                  explanations={explanations}
                  isExplaining={explainPermissionMutation.isPending}
                />
              </div>
            )}

            {activeTab === 'costRecords' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">消费记录</h3>
                {isLoadingCostRecords ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  </div>
                ) : costRecordsData && costRecordsData.costRecords.length > 0 ? (
                  <div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              User
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Kind
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Model
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Tokens
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Cost
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {costRecordsData.costRecords.map((record) => (
                            <tr key={record.ID} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {format(new Date(record.CreatedAt), 'MMM dd, h:mm a', { locale: zhCN })}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {(record.kind || 'self') === 'self' ? 'You' : (record.source || 'Unknown')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {(record.kind || 'self') === 'self' ? 'Usage-based' : 'Pool-based'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                                {record.model || 'No'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                                {(record.tokens || 0).toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                                ${(parseFloat(record.cost || '0') || 0).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* 分页 */}
                    {costRecordsData.totalPages > 1 && (
                      <div className="flex items-center justify-between mt-6">
                        <div className="text-sm text-gray-700">
                          显示第 {(costRecordsData.page - 1) * costRecordsData.pageSize + 1} - {Math.min(costRecordsData.page * costRecordsData.pageSize, costRecordsData.total)} 条，
                          共 {costRecordsData.total} 条记录
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setCostRecordsPage(costRecordsData.page - 1)}
                            disabled={!costRecordsData.hasPrevious}
                            className={clsx(
                              'px-3 py-2 text-sm font-medium rounded-md',
                              costRecordsData.hasPrevious
                                ? 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            )}
                          >
                            上一页
                          </button>
                          <button
                            onClick={() => setCostRecordsPage(costRecordsData.page + 1)}
                            disabled={!costRecordsData.hasNext}
                            className={clsx(
                              'px-3 py-2 text-sm font-medium rounded-md',
                              costRecordsData.hasNext
                                ? 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            )}
                          >
                            下一页
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CurrencyDollarIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">暂无消费记录</h3>
                    <p className="mt-1 text-sm text-gray-500">该用户还没有任何消费记录。</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <Dialog
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-lg font-semibold text-gray-900">
                编辑权限
              </Dialog.Title>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {selectedNode && (
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  正在编辑: {selectedNode.name}
                </p>
                {/* 这里可以添加具体的编辑表单 */}
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    取消
                  </button>
                  <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                    保存
                  </button>
                </div>
              </div>
            )}
          </Dialog.Panel>
        </div>
      </Dialog>

      <Dialog
        open={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-lg font-semibold text-gray-900">
                选择权限模板
              </Dialog.Title>
              <button
                onClick={() => setIsTemplateModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-gray-500 text-center py-4">权限模板功能即将推出</p>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
};
