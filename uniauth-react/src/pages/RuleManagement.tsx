import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { api } from '../api/client';
import { CloudArrowUpIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface Rule {
  id: string;
  type: 'policy' | 'role';
  subject: string;
  domain?: string;
  object?: string;
  action?: string;
  effect?: string;
  role?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  source: string;
}

interface RuleFormData {
  type: 'policy' | 'role';
  subject: string;
  domain: string;
  object: string;
  action: string;
  effect: string;
  role: string;
}

// =========== 导入模态框组件 ===========
const ImportRulesModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ isOpen, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [textContent, setTextContent] = useState('');
  const [replace, setReplace] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    const content = activeTab === 'upload' ? file : textContent;
    if (!content) {
      toast.error('请提供要导入的内容');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.importRules(content, replace);
      toast.success('规则导入成功！');
      onSuccess();
      onClose();
    } catch (error: any) {
      const details = error.response?.data?.details || '未知错误';
      toast.error(<div><p className="font-bold">导入失败</p><p className="text-sm">{details}</p></div>, { duration: 6000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">导入规则</h2>
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button onClick={() => setActiveTab('upload')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'upload' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>上传文件</button>
              <button onClick={() => setActiveTab('paste')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'paste' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>粘贴文本</button>
            </nav>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'upload' ? (
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                    <span>选择一个文件</span>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".csv, .txt" />
                  </label>
                  <p className="pl-1">或拖拽到此处</p>
                </div>
                {file ? <p className="text-sm text-green-500 flex items-center justify-center"><CheckCircleIcon className="h-4 w-4 mr-1"/>{file.name}</p> : <p className="text-xs text-gray-500">CSV, TXT 文件</p>}
              </div>
            </div>
          ) : (
            <textarea
              rows={10}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
              placeholder="p, sub, obj, act, eft&#10;g, user, group"
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
            />
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-between items-center">
          <div className="flex items-center">
            <input id="replace" name="replace" type="checkbox" checked={replace} onChange={(e) => setReplace(e.target.checked)} className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
            <label htmlFor="replace" className="ml-2 block text-sm text-gray-900">替换所有现有规则</label>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">取消</button>
            <button onClick={handleSubmit} disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300">{isSubmitting ? '正在导入...' : '确认导入'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const RuleManagement: React.FC = () => {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'policy' | 'role'>('all');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedRules, setSelectedRules] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [formData, setFormData] = useState<RuleFormData>({
    type: 'policy',
    subject: '',
    domain: '',
    object: '',
    action: '',
    effect: 'allow',
    role: '',
  });
  const [showImportModal, setShowImportModal] = useState(false);

  // 加载规则列表
  const loadRules = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        pageSize,
        search: searchQuery || undefined,
        type: filterType === 'all' ? undefined : filterType,
      };
      const response = await api.getAllRules(params);
      setRules(response.rules);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch (error) {
      toast.error('加载规则失败');
      console.error('Error loading rules:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, [page, searchQuery, filterType]);

  // 重置表单
  const resetForm = () => {
    setFormData({
      type: 'policy',
      subject: '',
      domain: '',
      object: '',
      action: '',
      effect: 'allow',
      role: '',
    });
    setEditingRule(null);
    setShowAddModal(false);
  };

  // 处理添加规则
  const handleAddRule = async () => {
    try {
      const ruleData = formData.type === 'policy'
        ? {
            type: formData.type,
            subject: formData.subject,
            domain: formData.domain,
            object: formData.object,
            action: formData.action,
            effect: formData.effect,
          }
        : {
            type: formData.type,
            subject: formData.subject,
            role: formData.role,
          };

      await api.addRule(ruleData);
      toast.success('规则添加成功');
      resetForm();
      loadRules();
    } catch (error) {
      toast.error('添加规则失败');
      console.error('Error adding rule:', error);
    }
  };

  // 处理编辑规则
  const handleEditRule = async () => {
    if (!editingRule) return;

    try {
      const ruleData = formData.type === 'policy'
        ? {
            type: formData.type,
            subject: formData.subject,
            domain: formData.domain,
            object: formData.object,
            action: formData.action,
            effect: formData.effect,
          }
        : {
            type: formData.type,
            subject: formData.subject,
            role: formData.role,
          };

      await api.updateRule(editingRule.id, ruleData);
      toast.success('规则更新成功');
      resetForm();
      loadRules();
    } catch (error) {
      toast.error('更新规则失败');
      console.error('Error updating rule:', error);
    }
  };

  // 处理删除规则
  const handleDeleteRule = async (id: string) => {
    if (!confirm('确定要删除这条规则吗？')) return;

    try {
      await api.deleteRule(id);
      toast.success('规则删除成功');
      loadRules();
    } catch (error) {
      toast.error('删除规则失败');
      console.error('Error deleting rule:', error);
    }
  };

  // 批量操作
  const handleBatchOperation = async (operation: 'delete' | 'disable' | 'enable') => {
    if (selectedRules.length === 0) {
      toast.error('请选择要操作的规则');
      return;
    }

    if (operation === 'delete' && !confirm(`确定要删除 ${selectedRules.length} 条规则吗？`)) {
      return;
    }

    try {
      const result = await api.batchRuleOperation({
        operation,
        ruleIds: selectedRules,
      });

      if (result.errors.length > 0) {
        toast.error(`操作完成，成功 ${result.successCount}/${result.totalCount}，有错误发生`);
        console.error('Batch operation errors:', result.errors);
      } else {
        toast.success(`批量${operation === 'delete' ? '删除' : operation === 'disable' ? '禁用' : '启用'}成功`);
      }

      setSelectedRules([]);
      loadRules();
    } catch (error) {
      toast.error('批量操作失败');
      console.error('Error in batch operation:', error);
    }
  };

  // 开始编辑规则
  const startEditRule = (rule: Rule) => {
    setEditingRule(rule);
    setFormData({
      type: rule.type,
      subject: rule.subject,
      domain: rule.domain || '',
      object: rule.object || '',
      action: rule.action || '',
      effect: rule.effect || 'allow',
      role: rule.role || '',
    });
    setShowAddModal(true);
  };

  const handleImportSuccess = () => {
    loadRules(); // 重新加载规则列表
  };

  // 导出所有规则
  const handleExportAllRules = async () => {
    const toastId = toast.loading('正在生成导出文件...');
    try {
      const response = await api.exportAllRules();

      // 从 Content-Disposition 头获取文件名
      const contentDisposition = response.headers['content-disposition'];
      let fileName = 'uniauth_rules_export.csv';
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (fileNameMatch && fileNameMatch.length > 1) {
          fileName = fileNameMatch[1];
        }
      }

      // 创建 Blob URL 并触发下载
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('文件已开始下载', { id: toastId });
    } catch (error) {
      toast.error('导出失败', { id: toastId });
      console.error('Error exporting all rules:', error);
    }
  };

  // 切换选择
  const toggleSelectRule = (ruleId: string) => {
    setSelectedRules(prev =>
      prev.includes(ruleId)
        ? prev.filter(id => id !== ruleId)
        : [...prev, ruleId]
    );
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    setSelectedRules(
      selectedRules.length === rules.length
        ? []
        : rules.map(rule => rule.id)
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">规则管理</h1>
        <p className="text-gray-600">管理系统中的所有权限规则和角色分配</p>
      </div>

      {/* 工具栏 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            {/* 搜索框 */}
            <div className="relative">
              <input
                type="text"
                placeholder="搜索规则..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* 类型过滤 */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'all' | 'policy' | 'role')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">所有类型</option>
              <option value="policy">策略规则</option>
              <option value="role">角色分配</option>
            </select>
          </div>

          <div className="flex gap-2">
            {/* 批量操作 */}
            {selectedRules.length > 0 && (
              <>
                <button
                  onClick={() => handleBatchOperation('delete')}
                  className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  批量删除 ({selectedRules.length})
                </button>
              </>
            )}

            {/* 导入导出 */}
            <button onClick={() => setShowImportModal(true)} className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">导入规则</button>
            <button onClick={handleExportAllRules} className="px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors">全部导出</button>

            {/* 添加规则 */}
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              添加规则
            </button>
          </div>
        </div>
      </div>

      {/* 规则列表 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={rules.length > 0 && selectedRules.length === rules.length}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">主体</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">详情</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">效果</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">来源</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    加载中...
                  </td>
                </tr>
              ) : rules.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    没有找到规则
                  </td>
                </tr>
              ) : (
                rules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedRules.includes(rule.id)}
                        onChange={() => toggleSelectRule(rule.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        rule.type === 'policy'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {rule.type === 'policy' ? '策略' : '角色'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {rule.subject}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {rule.type === 'policy' ? (
                        `${rule.domain} → ${rule.object} (${rule.action})`
                      ) : (
                        `→ ${rule.role}`
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {rule.type === 'policy' && (
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          rule.effect === 'allow'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {rule.effect === 'allow' ? '允许' : '拒绝'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        rule.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {rule.isActive ? '启用' : '禁用'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {rule.source === 'database' ? '数据库' : 'CSV'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => startEditRule(rule)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        删除
                      </button>
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
              共 {total} 条记录
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                上一页
              </button>
              <span className="px-3 py-1 text-sm text-gray-700">
                第 {page} / {totalPages} 页
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 添加/编辑模态框 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">
              {editingRule ? '编辑规则' : '添加规则'}
            </h2>

            <form onSubmit={(e) => {
              e.preventDefault();
              editingRule ? handleEditRule() : handleAddRule();
            }}>
              {/* 规则类型 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  规则类型
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'policy' | 'role' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="policy">策略规则</option>
                  <option value="role">角色分配</option>
                </select>
              </div>

              {/* 主体 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  主体（用户/组）
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="例如：user@example.com 或 group-name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* 策略规则字段 */}
              {formData.type === 'policy' && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      资源域
                    </label>
                    <input
                      type="text"
                      value={formData.domain}
                      onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                      placeholder="例如：models, services, kb"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      资源对象
                    </label>
                    <input
                      type="text"
                      value={formData.object}
                      onChange={(e) => setFormData({ ...formData, object: e.target.value })}
                      placeholder="例如：gpt-4, aigc, * (所有)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      动作
                    </label>
                    <input
                      type="text"
                      value={formData.action}
                      onChange={(e) => setFormData({ ...formData, action: e.target.value })}
                      placeholder="例如：access, read, write"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      效果
                    </label>
                    <select
                      value={formData.effect}
                      onChange={(e) => setFormData({ ...formData, effect: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="allow">允许</option>
                      <option value="deny">拒绝</option>
                    </select>
                  </div>
                </>
              )}

              {/* 角色分配字段 */}
              {formData.type === 'role' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    角色/组
                  </label>
                  <input
                    type="text"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="例如：group-student, group-staff"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              )}

              {/* 按钮 */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingRule ? '更新规则' : '添加规则'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 导入模态框 */}
      <ImportRulesModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={handleImportSuccess}
      />
    </div>
  );
};

export default RuleManagement;
