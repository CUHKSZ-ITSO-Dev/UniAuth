import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { AbstractGroup, ChatCategory } from '../../types/abstractGroup';
import { getAllAbstractGroups, deleteAbstractGroup, syncAbstractGroup, updateChatCategory, resetBalance } from '../../api/abstractGroups';
import { SquaresPlusIcon, ShieldCheckIcon, PencilIcon, TrashIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline';
import { Dialog, Switch, Transition } from '@headlessui/react';
import { Fragment } from 'react';

import CreateAbstractGroupModal from './CreateAbstractGroupModal';
import GroupPermissionsModal from './GroupPermissionsModal';

// New modal for abstract group actions
const AbstractGroupActionsModal: React.FC<{
    group: AbstractGroup;
    onClose: () => void;
    onEdit: () => void;
    onPermissions: () => void;
    onDelete: () => void;
}> = ({ group, onClose, onEdit, onPermissions, onDelete }) => {
    return (
        <Transition appear show as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black bg-opacity-25" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-sm transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 mb-4">
                                    操作: <span className="font-bold">{group.name}</span>
                                </Dialog.Title>
                                <div className="mt-4 space-y-2">
                                    <button onClick={onEdit} className="group flex w-full items-center rounded-md px-3 py-3 text-sm text-gray-900 hover:bg-gray-100 focus:outline-none">
                                        <PencilIcon className="mr-3 h-5 w-5 text-gray-500" aria-hidden="true" /> 编辑抽象组
                                    </button>
                                    <button onClick={onPermissions} className="group flex w-full items-center rounded-md px-3 py-3 text-sm text-gray-900 hover:bg-gray-100 focus:outline-none">
                                        <ShieldCheckIcon className="mr-3 h-5 w-5 text-gray-500" aria-hidden="true" /> 管理权限
                                    </button>
                                    <div className="my-1 h-px bg-gray-200" />
                                    <button onClick={onDelete} className="group flex w-full items-center rounded-md px-3 py-3 text-sm text-red-700 hover:bg-red-100 focus:outline-none">
                                        <TrashIcon className="mr-3 h-5 w-5 text-gray-500" aria-hidden="true" /> 删除
                                    </button>
                                </div>
                                <div className="mt-6 flex justify-end">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                    >
                                        关闭
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

// User Group Edit Modal
const EditUserGroupModal: React.FC<{ category: ChatCategory | null; abstractGroup: AbstractGroup | null; onClose: () => void; onSave: () => void; }> = ({ category, abstractGroup, onClose, onSave }) => {
    if (!category) return null;

    const [formData, setFormData] = useState({
        name: category.name || '',
        defaultQuota: category.defaultQuota || 0,
        resetCircle: category.resetCircle || 30,
        priority: category.priority || 1
    });
    const [useBudgetPool, setUseBudgetPool] = useState<boolean>(!!category.quotaPool);
    // 预算池的额度，与用户组自身的默认配额分开
    const [poolQuota, setPoolQuota] = useState<number>(category.quotaPool?.defaultQuota || 0);
    const [isResetting, setIsResetting] = useState<boolean>(false);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const categoryData: Partial<ChatCategory> = {
            name: formData.name,
            defaultQuota: Number(formData.defaultQuota),
            resetCircle: Number(formData.resetCircle),
            priority: Number(formData.priority),
        };

        if (useBudgetPool) {
            categoryData.quotaPool = {
                ID: category.quotaPool?.ID, // 传递ID以供更新
                name: formData.name, // 预算池名称与用户组名称同步
                defaultQuota: Number(poolQuota),
                balance: category.quotaPool?.balance || 0,
                lastResetTime: category.quotaPool?.lastResetTime || new Date().toISOString(),
            };
        } else {
            //设置为0，让gorm清除关联
            categoryData.chatQuotaPoolId = 0;
        }

        try {
            await updateChatCategory(category.ID, categoryData);
            toast.success('用户组信息已更新');
            onSave();
        } catch (err) {
            toast.error(`更新失败: ${err instanceof Error ? err.message : '未知错误'}`);
        }
    };

    const handleResetBalance = async () => {
        if (!abstractGroup) {
            toast.error('无法获取抽象组信息');
            return;
        }

        const resetType = category?.quotaPool ? '预算池余额' : '用户余额';
        const confirmMessage = `确定要重置 "${category?.name}" 的${resetType}吗？此操作不可撤销。`;

        if (!window.confirm(confirmMessage)) {
            return;
        }

        setIsResetting(true);
        try {
            if (abstractGroup.type === 'manual' && abstractGroup.rule.manual?.upns) {
                // 手动组，重置指定用户的余额
                const resetPromises = abstractGroup.rule.manual.upns.map(upn =>
                    resetBalance(upn, true)
                );
                await Promise.all(resetPromises);

                if (category?.quotaPool) {
                    toast.success(`已重置预算池 "${category.name}" 的余额`);
                } else {
                    toast.success(`已重置 ${abstractGroup.rule.manual.upns.length} 个用户的余额`);
                }
            } else {
                // IT Tools 规则组，由于无法直接获取用户列表，提示用户先同步
                toast.error('IT Tools 规则组需要先同步用户，然后手动重置。或者联系管理员添加批量重置功能。');
                return;
            }
            onSave(); // 刷新数据
        } catch (err) {
            toast.error(`重置失败: ${err instanceof Error ? err.message : '未知错误'}`);
        } finally {
            setIsResetting(false);
        }
    };

    return (
        <Transition appear show as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black bg-opacity-25" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 mb-4">
                                    编辑用户组信息
                                </Dialog.Title>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                用户组名称
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                默认配额 (独立)
                                            </label>
                                            <input
                                                type="number"
                                                value={formData.defaultQuota}
                                                onChange={(e) => setFormData({ ...formData, defaultQuota: Number(e.target.value) })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                min="0"
                                                required
                                                disabled={useBudgetPool}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                重置周期 (天)
                                            </label>
                                            <input
                                                type="number"
                                                value={formData.resetCircle}
                                                onChange={(e) => setFormData({ ...formData, resetCircle: Number(e.target.value) })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                min="1"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                优先级
                                            </label>
                                            <input
                                                type="number"
                                                value={formData.priority}
                                                onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                min="1"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="border-t border-gray-200 pt-6 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-900">启用预算池</span>
                                            <Switch
                                                checked={useBudgetPool}
                                                onChange={setUseBudgetPool}
                                                className={`${useBudgetPool ? 'bg-blue-600' : 'bg-gray-200'}
                                                  relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2  focus-visible:ring-white focus-visible:ring-opacity-75`}
                                            >
                                                <span
                                                    aria-hidden="true"
                                                    className={`${useBudgetPool ? 'translate-x-5' : 'translate-x-0'}
                                                    pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out`}
                                                />
                                            </Switch>
                                        </div>

                                        {useBudgetPool && (
                                            <>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        预算池周期额度
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={poolQuota}
                                                        onChange={(e) => setPoolQuota(Number(e.target.value))}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        min="0"
                                                        required
                                                    />
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    <div className="flex justify-between items-center pt-4">
                                        <button
                                            type="button"
                                            onClick={handleResetBalance}
                                            disabled={isResetting}
                                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isResetting ? '重置中...' : `重置${category?.quotaPool ? '预算池' : '用户'}余额`}
                                        </button>
                                        <div className="flex space-x-3">
                                            <button
                                                type="button"
                                                onClick={onClose}
                                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                            >
                                                取消
                                            </button>
                                            <button
                                                type="submit"
                                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                            >
                                                保存
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};


const AbstractGroupListPage: React.FC = () => {
    const [groups, setGroups] = useState<AbstractGroup[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isPermsModalOpen, setIsPermsModalOpen] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<AbstractGroup | null>(null);

    // State for the new User Group modal
    const [isUserGroupModalOpen, setIsUserGroupModalOpen] = useState(false);
    const [selectedChatCategory, setSelectedChatCategory] = useState<ChatCategory | null>(null);
    const [isAbstractGroupMenuModalOpen, setIsAbstractGroupMenuModalOpen] = useState(false);


    const fetchGroups = async () => {
        try {
            setLoading(true);
            const data = await getAllAbstractGroups();
            setGroups(data);
        } catch (err) {
            toast.error('获取抽象组列表失败');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGroups();
    }, []);

    const handleDelete = async (id: string, name: string) => {
        if (window.confirm(`确定要删除抽象组 "${name}" 吗？这将会移除所有与该组相关的用户。`)) {
            try {
                await deleteAbstractGroup(id);
                toast.success(`抽象组 "${name}" 已删除`);
                fetchGroups(); // Refresh list after delete
            } catch (err) {
                toast.error('删除抽象组失败');
            }
        }
    };

    const handleSync = async (id: string, name: string) => {
        const toastId = toast.loading(`正在同步抽象组 "${name}"...`);
        try {
            const result = await syncAbstractGroup(id);
            toast.success(`同步成功！同步了 ${result.synced_users} 个用户。`, { id: toastId });
            fetchGroups();
        } catch (err) {
            toast.error(`同步失败: ${err instanceof Error ? err.message : '未知错误'}`, { id: toastId });
        }
    };

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">抽象组管理</h1>
                <p className="text-gray-600">通过规则动态管理用户组，或手动维护静态用户组。</p>
            </div>

            {/* 工具栏 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                <div className="flex justify-end">
                    <button
                        onClick={() => { setSelectedGroup(null); setIsCreateModalOpen(true); }}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <SquaresPlusIcon className="h-5 w-5" />
                        新建抽象组
                    </button>
                </div>
            </div>

            {/* 列表 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr className="border-b border-gray-200">
                                <th colSpan={4} className="px-6 py-2 text-left text-sm font-semibold text-gray-800 bg-gray-100 rounded-tl-lg">抽象组</th>
                                <th colSpan={4} className="px-6 py-2 text-left text-sm font-semibold text-gray-800 bg-gray-100 border-l border-gray-200">用户组</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tr-lg border-l border-gray-200">同步</th>
                            </tr>
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider align-middle">组名称</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider align-middle">描述</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider align-middle">类型</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider align-middle">创建时间</th>

                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-l border-gray-200 align-middle">用户组名称</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider align-middle">配额详情</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider align-middle">重置周期 (天)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider align-middle">优先级</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-4 text-center text-gray-500">加载中...</td>
                                </tr>
                            ) : groups.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-4 text-center text-gray-500">没有找到抽象组</td>
                                </tr>
                            ) : (
                                groups.map((group) => (
                                    <tr key={group.id} className="hover:bg-gray-50">
                                        <td colSpan={4} className="p-0">
                                            <div
                                                className="flex items-center w-full h-full cursor-pointer hover:bg-gray-100 text-left px-6 py-4 space-x-6"
                                                onClick={() => {
                                                    setSelectedGroup(group);
                                                    setIsAbstractGroupMenuModalOpen(true);
                                                }}
                                            >
                                                <div className="w-1/4 text-sm font-medium text-gray-900">{group.name}</div>
                                                <div className="w-1/4 text-sm text-gray-500" title={group.description}>{group.description || '-'}</div>
                                                <div className="w-1/4 flex items-center">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${group.type === 'ittools' ? 'bg-purple-100 text-purple-800' : 'bg-indigo-100 text-indigo-800'}`}>
                                                        {group.type === 'ittools' ? 'IT Tools 规则' : '手动添加'}
                                                    </span>
                                                </div>
                                                <div className="w-1/4 text-sm text-gray-500">{new Date(group.createdAt).toLocaleString()}</div>
                                            </div>
                                        </td>

                                        <td colSpan={4} className="p-0 border-l border-gray-200">
                                            <div className="flex items-center w-full h-full cursor-pointer hover:bg-gray-100" onClick={() => { if (group.chatCategory) { setSelectedGroup(group); setSelectedChatCategory(group.chatCategory); setIsUserGroupModalOpen(true); } else { toast.error('该抽象组没有关联的用户组'); } }}>
                                                <div className="px-6 py-4 text-sm text-gray-700 w-1/4">{group.chatCategory?.name || '-'}</div>
                                                <div className="px-6 py-4 text-sm text-gray-500 w-1/2">
                                                    {group.chatCategory ? (group.chatCategory.quotaPool ? (<div className="text-xs"> <p className="font-semibold text-gray-800">{group.chatCategory.quotaPool.name} (预算池)</p> <p>余额: <span className="font-mono">{group.chatCategory.quotaPool.balance}</span></p> <p>周期额度: <span className="font-mono">{group.chatCategory.quotaPool.defaultQuota}</span></p> <p>上次重置: {new Date(group.chatCategory.quotaPool.lastResetTime).toLocaleDateString()}</p> </div>) : (<span className="font-mono">{group.chatCategory.defaultQuota}</span>)) : ('-')}
                                                </div>
                                                <div className="px-6 py-4 text-sm text-gray-500 w-1/8 flex items-center">{group.chatCategory?.resetCircle ?? '-'}</div>
                                                <div className="px-6 py-4 text-sm text-gray-500 w-1/8 flex items-center">{group.chatCategory?.priority ?? '-'}</div>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium align-middle">
                                            <button onClick={() => handleSync(group.id, group.name)} className="text-yellow-600 hover:text-yellow-900" title="同步用户">
                                                <ArrowsRightLeftIcon className="h-5 w-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {/* TODO: 分页组件 */}
            </div>

            {isCreateModalOpen && (
                <CreateAbstractGroupModal
                    group={selectedGroup}
                    onClose={() => setIsCreateModalOpen(false)}
                    onSave={() => {
                        setIsCreateModalOpen(false);
                        fetchGroups();
                    }}
                />
            )}

            {isPermsModalOpen && (
                <GroupPermissionsModal
                    group={selectedGroup}
                    onClose={() => setIsPermsModalOpen(false)}
                />
            )}

            {isUserGroupModalOpen && (
                <EditUserGroupModal
                    category={selectedChatCategory}
                    abstractGroup={selectedGroup}
                    onClose={() => setIsUserGroupModalOpen(false)}
                    onSave={() => {
                        setIsUserGroupModalOpen(false);
                        fetchGroups();
                    }}
                />
            )}

            {isAbstractGroupMenuModalOpen && selectedGroup && (
                <AbstractGroupActionsModal
                    group={selectedGroup}
                    onClose={() => setIsAbstractGroupMenuModalOpen(false)}
                    onEdit={() => {
                        setIsAbstractGroupMenuModalOpen(false);
                        setIsCreateModalOpen(true); // selectedGroup is already set
                    }}
                    onPermissions={() => {
                        setIsAbstractGroupMenuModalOpen(false);
                        setIsPermsModalOpen(true); // selectedGroup is already set
                    }}
                    onDelete={() => {
                        setIsAbstractGroupMenuModalOpen(false);
                        handleDelete(selectedGroup.id, selectedGroup.name);
                    }}
                />
            )}
        </div>
    );
};

export default AbstractGroupListPage;