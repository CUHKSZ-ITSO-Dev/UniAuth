import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { api } from '../../api/client';
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/solid';
import { AbstractGroup } from '../../types/abstractGroup';

interface Props {
  group: AbstractGroup | null;
  onClose: () => void;
}

const GroupPermissionsModal: React.FC<Props> = ({ group, onClose }) => {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [newRule, setNewRule] = useState({ domain: '', object: '', action: '', effect: 'allow' });

  const loadRules = async () => {
    if (!group) return;
    setLoading(true);
    try {
      const { rules: fetchedRules } = await api.getRulesForSubject(group.name);
      setRules(fetchedRules || []);
    } catch (error) {
      toast.error('获取权限列表失败');
      setRules([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, [group]);

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!group) return;

    try {
      await api.addRule({
        type: 'policy',
        subject: group.name,
        ...newRule
      });
      toast.success('权限添加成功');
      setNewRule({ domain: '', object: '', action: '', effect: 'allow' }); // Reset form
      loadRules(); // Refresh list
    } catch (error) {
      toast.error('添加权限失败');
    }
  };

  const handleDeleteRule = async (rule: any) => {
    if (!window.confirm("确定要删除这条权限吗？")) return;
    try {
      // 确保将完整的规则（包括effect）传递给API
      await api.deleteRule({
        type: 'policy',
        subject: group?.name,
        domain: rule.domain,
        object: rule.object,
        action: rule.action,
        effect: rule.effect,
      });
      toast.success('权限已删除');
      loadRules();
    } catch (error) {
      console.error("Delete rule error:", error)
      toast.error('删除权限失败');
    }
  };

  if (!group) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full flex flex-col max-h-[90vh]">
        <div className="p-6 pb-4 flex-shrink-0 border-b">
          <h2 className="text-xl font-bold">管理权限: <span className="text-blue-600">{group.name}</span></h2>
          <p className="text-sm text-gray-500">为这个抽象组直接添加或移除权限规则 (p)</p>
        </div>

        <div className="flex-grow overflow-y-auto p-6 space-y-6">
          {/* 添加新规则的表单 */}
          <form onSubmit={handleAddRule} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end p-4 bg-gray-50 rounded-lg">
              <input type="text" value={group.name} className="px-3 py-2 bg-gray-200 border border-gray-300 rounded-lg w-full" disabled />
              <input type="text" placeholder="资源域 (domain)" value={newRule.domain} onChange={e => setNewRule({...newRule, domain: e.target.value})} className="px-3 py-2 border border-gray-300 rounded-lg w-full" required />
              <input type="text" placeholder="资源对象 (object)" value={newRule.object} onChange={e => setNewRule({...newRule, object: e.target.value})} className="px-3 py-2 border border-gray-300 rounded-lg w-full" required />
              <input type="text" placeholder="动作 (action)" value={newRule.action} onChange={e => setNewRule({...newRule, action: e.target.value})} className="px-3 py-2 border border-gray-300 rounded-lg w-full" required />
              <select value={newRule.effect} onChange={e => setNewRule({...newRule, effect: e.target.value})} className="px-3 py-2 border border-gray-300 rounded-lg w-full h-full">
                <option value="allow">允许 (allow)</option>
                <option value="deny">拒绝 (deny)</option>
              </select>
              <button type="submit" className="flex justify-center items-center gap-2 h-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <PlusIcon className="h-5 w-5" /> 添加
              </button>
          </form>

          {/* 现有规则列表 */}
          <div>
            <h3 className="text-lg font-medium mb-2">现有权限</h3>
            <div className="bg-white rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">资源域</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">资源对象</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">动作</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">效果</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase"></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? <tr><td colSpan={5} className="p-4 text-center">加载中...</td></tr> :
                        rules.map(rule => (
                            <tr key={rule.id}>
                                <td className="px-4 py-2 whitespace-nowrap">{rule.domain}</td>
                                <td className="px-4 py-2 whitespace-nowrap">{rule.object}</td>
                                <td className="px-4 py-2 whitespace-nowrap">{rule.action}</td>
                                <td className="px-4 py-2 whitespace-nowrap">{rule.effect}</td>
                                <td className="text-right px-4 py-2">
                                  <button onClick={() => handleDeleteRule(rule)} className="text-red-500 hover:text-red-700 p-1"><XMarkIcon className="h-5 w-5" /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>
        </div>

        <div className="p-6 pt-4 flex-shrink-0 border-t flex justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">关闭</button>
        </div>
      </div>
    </div>
  );
};

export default GroupPermissionsModal;
