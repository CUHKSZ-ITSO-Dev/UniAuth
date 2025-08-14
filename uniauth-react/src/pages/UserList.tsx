import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog } from '@headlessui/react';
import {
  MagnifyingGlassIcon,
  UserPlusIcon,
  XMarkIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import clsx from 'clsx';

import api from '../api/client';
import type { BatchOperationRequest } from '../types';

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export const UserList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [filterGroup, setFilterGroup] = useState<string>('all');
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchOperation, setBatchOperation] = useState<'addToGroup' | 'removeFromGroup' | 'delete'>('addToGroup');
  const [targetGroup, setTargetGroup] = useState('group-staff');

  // Debounce the search query
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // 获取用户列表 - now uses the debounced search query
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users', debouncedSearchQuery],
    queryFn: () => api.searchUsers(debouncedSearchQuery),
  });

  // 批量操作
  const batchMutation = useMutation({
    mutationFn: (request: BatchOperationRequest) => api.batchOperation(request),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(`成功处理 ${data.successCount}/${data.totalCount} 个用户`);
      setSelectedUsers(new Set());
      setIsBatchModalOpen(false);
    },
    onError: () => {
      toast.error('批量操作失败');
    },
  });

  // 过滤和搜索用户 - a lot of this logic is now handled by the backend
  const filteredUsers = useMemo(() => {
    let filtered = users;

    // 组过滤 (仍保留在前端，因为后端不支持)
    if (filterGroup !== 'all') {
      filtered = filtered.filter(user => user.groups.includes(filterGroup));
    }

    return filtered;
  }, [users, filterGroup]);

  // 处理全选/取消全选
  const handleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map((u) => u.upn)));
    }
  };

  // 处理单个选择
  const handleSelectUser = (upn: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(upn)) {
      newSelected.delete(upn);
    } else {
      newSelected.add(upn);
    }
    setSelectedUsers(newSelected);
  };

  // 执行批量操作
  const handleBatchOperation = () => {
    const upns = Array.from(selectedUsers);

    if (batchOperation === 'addToGroup' || batchOperation === 'removeFromGroup') {
      batchMutation.mutate({
        upns,
        operation: batchOperation,
        groupName: targetGroup,
      });
    } else if (batchOperation === 'delete') {
      // 删除操作需要额外确认
      if (window.confirm(`确定要删除 ${upns.length} 个用户吗？此操作不可恢复。`)) {
        batchMutation.mutate({
          upns,
          operation: 'remove',
        });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* 页面头部 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">用户管理</h1>
          <p className="text-gray-600 mt-2">管理系统中的所有用户及其权限</p>
        </div>

        {/* 操作栏 */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* 搜索框 */}
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索用户名、邮箱或显示名..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* 过滤器 */}
            <div className="flex gap-2">
              <select
                value={filterGroup}
                onChange={(e) => setFilterGroup(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">所有组</option>
                <option value="group-student">学生</option>
                <option value="group-staff">员工</option>
                <option value="group-unlimited">无限制</option>
                <option value="group-guest">访客</option>
              </select>

              {selectedUsers.size > 0 && (
                <button
                  onClick={() => setIsBatchModalOpen(true)}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
                >
                  <UserPlusIcon className="w-5 h-5" />
                  批量操作 ({selectedUsers.size})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 用户列表 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[25%]">
                  用户
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[20%]">
                  用户唯一标识
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[15%]">
                  部门
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  组
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <AnimatePresence>
                {filteredUsers.map((user) => (
                  <motion.tr
                    key={user.upn}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.has(user.upn)}
                        onChange={() => handleSelectUser(user.upn)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <img
                            className="h-10 w-10 rounded-full"
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=3b82f6&color=fff`}
                            alt={user.name}
                            loading="lazy"
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 break-all">{user.name}</div>
                          <div className="text-sm text-gray-500 break-all">{user.displayName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 break-all">{user.upn}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 break-words">{user.department || '-'}</div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div>
                        {(user.groups || [])
                          .filter(group => {
                            // 过滤掉内部权限，只显示抽象组
                            // 内部权限通常包含特殊字符如冒号等
                            return !group.includes(':') && !group.includes('role:');
                          })
                          .map((group) => (
                          <div key={group} className="mb-1">
                            <span className={clsx(
                              group === user.primaryGroup
                                ? 'text-base font-extrabold text-black bg-yellow-50 px-2 py-1 rounded border border-yellow-200'
                                : 'font-medium text-gray-700'
                            )}>
                              {group}
                              {group === user.primaryGroup && (
                                <span className="text-yellow-500 ml-1 text-lg">★</span>
                              )}
                        </span>
                      </div>
                        ))}
                        {(!user.groups || user.groups.length === 0) && (
                          <span className="text-gray-500 text-xs">暂无抽象组</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={clsx(
                        'px-2 inline-flex text-xs leading-5 font-semibold rounded-full whitespace-nowrap',
                        user.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      )}>
                        {user.isActive ? '活跃' : '已禁用'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <button
                        onClick={() => navigate(`/users/${user.upn}`)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        查看详情
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">没有找到匹配的用户</p>
            </div>
          )}
        </div>

        {/* 批量操作模态框 */}
        <Dialog
          open={isBatchModalOpen}
          onClose={() => setIsBatchModalOpen(false)}
          className="relative z-50"
        >
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <Dialog.Title className="text-lg font-semibold text-gray-900">
                  批量操作 - 已选择 {selectedUsers.size} 个用户
                </Dialog.Title>
                <button
                  onClick={() => setIsBatchModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    选择操作
                  </label>
                  <select
                    value={batchOperation}
                    onChange={(e) => setBatchOperation(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="addToGroup">添加到组</option>
                    <option value="removeFromGroup">从组中移除</option>
                    <option value="delete">删除用户</option>
                  </select>
                </div>

                {(batchOperation === 'addToGroup' || batchOperation === 'removeFromGroup') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      选择组
                    </label>
                    <select
                      value={targetGroup}
                      onChange={(e) => setTargetGroup(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="group-student">学生组</option>
                      <option value="group-staff">员工组</option>
                      <option value="group-unlimited">无限制组</option>
                      <option value="group-guest">访客组</option>
                    </select>
                  </div>
                )}

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setIsBatchModalOpen(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleBatchOperation}
                    disabled={batchMutation.isPending}
                    className={clsx(
                      'px-4 py-2 rounded-lg transition-colors flex items-center gap-2',
                      batchOperation === 'delete'
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-primary-600 text-white hover:bg-primary-700'
                    )}
                  >
                    {batchMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        处理中...
                      </>
                    ) : (
                      <>
                        <CheckIcon className="w-4 h-4" />
                        确认
                      </>
                    )}
                  </button>
                </div>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      </div>
    </div>
  );
};
