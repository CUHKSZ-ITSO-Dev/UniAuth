import React, { useState, useEffect } from 'react';
import { AbstractGroup, IttoolsRule, Condition } from '../../types/abstractGroup';
import { createAbstractGroup, updateAbstractGroup } from '../../api/abstractGroups';
import { toast } from 'react-hot-toast';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/solid';

interface Props {
    group: AbstractGroup | null;
    onClose: () => void;
    onSave: () => void;
}

const initialCondition: Condition = { field: '', operator: 'equals', value: '' };

const CreateAbstractGroupModal: React.FC<Props> = ({ group, onClose, onSave }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState<'ittools' | 'manual'>('ittools');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // State for ittools rule
    const [ittoolsRule, setIttoolsRule] = useState<IttoolsRule>({
        logical_operator: 'AND',
        conditions: [{ ...initialCondition }]
    });

    // State for manual rule
    const [manualUpns, setManualUpns] = useState('');

    useEffect(() => {
        if (group) {
            setName(group.name);
            setDescription(group.description);
            setType(group.type);
            
            // Reset both rule states first to avoid stale state
            setIttoolsRule({ logical_operator: 'AND', conditions: [{ ...initialCondition }] });
            setManualUpns('');

            if (group.type === 'ittools' && group.rule.ittools) {
                // Handle both null and empty array for conditions, ensuring at least one line is visible
                const conditions = group.rule.ittools.conditions && group.rule.ittools.conditions.length > 0
                    ? group.rule.ittools.conditions
                    : [{ ...initialCondition }];
                setIttoolsRule({ ...group.rule.ittools, conditions });
            } else if (group.type === 'manual' && group.rule.manual) {
                const upns = group.rule.manual.upns || [];
                setManualUpns(upns.join('\\n'));
            }
        } else {
            // Reset to default for new group
            setName('');
            setDescription('');
            setType('ittools');
            setIttoolsRule({ logical_operator: 'AND', conditions: [{...initialCondition}]});
            setManualUpns('');
        }
    }, [group]);

    const handleConditionChange = (index: number, field: keyof Condition, value: string) => {
        const updatedConditions = [...ittoolsRule.conditions];
        updatedConditions[index] = { ...updatedConditions[index], [field]: value };
        setIttoolsRule({ ...ittoolsRule, conditions: updatedConditions });
    };

    const addCondition = () => {
        setIttoolsRule({ ...ittoolsRule, conditions: [...ittoolsRule.conditions, { ...initialCondition }] });
    };

    const removeCondition = (index: number) => {
        const updatedConditions = ittoolsRule.conditions.filter((_, i) => i !== index);
        setIttoolsRule({ ...ittoolsRule, conditions: updatedConditions });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const rule = type === 'manual'
            ? { manual: { upns: manualUpns.split(/[\n,]+/).map(u => u.trim()).filter(Boolean) } }
            : { ittools: ittoolsRule };

        const groupData = { name, description, type, rule };

        try {
            if (group) {
                await updateAbstractGroup(group.id, groupData);
                toast.success('抽象组更新成功');
            } else {
                await createAbstractGroup(groupData);
                toast.success('抽象组创建成功');
            }
            onSave();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : '操作失败');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full flex flex-col max-h-[90vh]">
                <div className="p-6 pb-4 flex-shrink-0">
                    <h2 className="text-xl font-bold">{group ? '编辑抽象组' : '新建抽象组'}</h2>
                </div>

                <form id="abstract-group-form" onSubmit={handleSubmit} className="flex-grow overflow-y-auto px-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">组名称</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" rows={2} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">组类型</label>
                        <select value={type} onChange={(e) => setType(e.target.value as 'ittools' | 'manual')} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                            <option value="ittools">IT Tools 规则</option>
                            <option value="manual">手动添加</option>
                        </select>
                    </div>

                    {type === 'ittools' && (
                        <div className="border-t pt-4">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-lg font-medium">规则定义</h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600">条件之间逻辑:</span>
                                    <select
                                        value={ittoolsRule.logical_operator}
                                        onChange={(e) => setIttoolsRule({ ...ittoolsRule, logical_operator: e.target.value as 'AND' | 'OR' })}
                                        className="px-2 py-1 border border-gray-300 rounded-lg text-sm"
                                    >
                                        <option value="AND">AND (所有条件都满足)</option>
                                        <option value="OR">OR (任一条件满足)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-3">
                                {ittoolsRule.conditions.map((cond, index) => (
                                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                                        <input type="text" placeholder="字段" value={cond.field} onChange={(e) => handleConditionChange(index, 'field', e.target.value)} className="w-1/3 px-2 py-1 border border-gray-300 rounded-lg" />
                                        <select value={cond.operator} onChange={(e) => handleConditionChange(index, 'operator', e.target.value)} className="w-1/4 px-2 py-1 border border-gray-300 rounded-lg">
                                            <option value="equals">等于</option>
                                            <option value="contains">包含</option>
                                            <option value="startsWith">开头为</option>
                                            <option value="endsWith">结尾为</option>
                                        </select>
                                        <input type="text" placeholder="值" value={cond.value} onChange={(e) => handleConditionChange(index, 'value', e.target.value)} className="flex-grow px-2 py-1 border border-gray-300 rounded-lg" />
                                        <button type="button" onClick={() => removeCondition(index)} className="text-red-500 hover:text-red-700 p-1">
                                            <XMarkIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <button type="button" onClick={addCondition} className="mt-3 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800">
                                <PlusIcon className="h-4 w-4" />
                                添加条件
                            </button>
                        </div>
                    )}

                    {type === 'manual' && (
                         <div className="border-t pt-4">
                             <h3 className="text-lg font-medium mb-2">手动添加用户 (UPN)</h3>
                             <p className="text-sm text-gray-500 mb-2">每行一个，或用逗号分隔。</p>
                            <textarea value={manualUpns} onChange={(e) => setManualUpns(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono" rows={6} placeholder="user1@example.com&#10;user2@example.com, user3@example.com" />
                        </div>
                    )}
                </form>

                <div className="p-6 pt-4 flex-shrink-0 border-t flex justify-end gap-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">取消</button>
                    <button form="abstract-group-form" type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300">{isSubmitting ? '正在保存...' : '保存'}</button>
                </div>
            </div>
        </div>
    );
};

export default CreateAbstractGroupModal;
