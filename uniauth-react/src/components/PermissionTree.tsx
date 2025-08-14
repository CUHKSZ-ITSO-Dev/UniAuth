import React, { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import type { PermissionNode, Explanation } from '../types';

interface PermissionTreeProps {
  nodes: PermissionNode[];
  explanations: Record<string, Explanation>;
  isExplaining: boolean;
  onTogglePermission?: (node: PermissionNode, enable: boolean) => void;
  onEditNode?: (node: PermissionNode) => void;
  onExplainPermission?: (node: PermissionNode) => void;
}

const PermissionBadge: React.FC<{ permission?: string; isDenied?: boolean }> = ({ permission, isDenied }) => {
  const getPermissionStyle = () => {
    if (isDenied) return 'bg-red-100 text-red-800 line-through';

    switch (permission) {
      case 'none':
        return 'bg-gray-100 text-gray-600';
      case 'search':
        return 'bg-yellow-100 text-yellow-800';
      case 'read':
        return 'bg-blue-100 text-blue-800';
      case 'write':
        return 'bg-green-100 text-green-800';
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'access':
        return 'bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm';
      case 'use':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  if (!permission) return null;

  return (
    <span className={clsx(
      'px-2 py-1 text-xs font-medium rounded-md',
      getPermissionStyle()
    )}>
      {permission}
    </span>
  );
};

const TreeNode: React.FC<{
  node: PermissionNode;
  level: number;
  explanation?: Explanation;
  isExplaining: boolean;
  explanations: Record<string, Explanation>;
  onTogglePermission?: (node: PermissionNode, enable: boolean) => void;
  onEditNode?: (node: PermissionNode) => void;
  onExplainPermission?: (node: PermissionNode) => void;
}> = ({ node, level, onTogglePermission, onEditNode, onExplainPermission, explanation, isExplaining, explanations }) => {
  const [isExpanded, setIsExpanded] = useState(level < 2);
  const [isExplanationVisible, setIsExplanationVisible] = useState(false);

  const handleExplainClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (explanation) {
      setIsExplanationVisible(!isExplanationVisible);
    } else {
      onExplainPermission?.(node);
      setIsExplanationVisible(true);
    }
  };

  const hasChildren = node.children && node.children.length > 0;
  const indent = level * 24;

  const getNodeIcon = () => {
    switch (node.type) {
      case 'module':
        // 为不同模块提供特定图标
        const moduleIcons: Record<string, string> = {
          'models': '🤖',
          'api': '🔑',
          'knowledgebase': '📚',
          'features': '⚙️'
        };
        const emoji = moduleIcons[node.id] || '📁';
        return (
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-200">
            <span className="text-lg">{emoji}</span>
          </div>
        );
      case 'resource':
      case 'services':
        // 为资源提供更具体的图标
        let resourceEmoji = '📄';
        if (node.id.startsWith('api:')) {
          resourceEmoji = '🔐';
        } else if (node.id.includes('gpt') || node.id.includes('claude') || node.id.includes('deepseek') || node.id.includes('qwen')) {
          resourceEmoji = '🤖';
        } else if (node.id.includes('kb-')) {
          resourceEmoji = '📖';
        } else if (node.type === 'services') {
          resourceEmoji = node.id === 'aigc' ? '🎨' : node.id === 'aippt' ? '📊' : '⚙️';
        }

        return (
          <div className="w-6 h-6 rounded bg-gray-50 flex items-center justify-center border border-gray-200">
            <span className="text-sm">{resourceEmoji}</span>
          </div>
        );
      default:
        return (
          <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
            <span className="text-gray-500 text-xs">•</span>
          </div>
        );
    }
  };

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2 }}
        className={clsx(
          'group flex items-center py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors',
          {
            'cursor-pointer': hasChildren,
            'border-l-2 border-gray-200': level > 0,
            'bg-blue-25': node.type === 'module',
            'ml-2': level > 0
          }
        )}
        style={{ paddingLeft: `${indent + 12}px` }}
        onClick={() => hasChildren && setIsExpanded(!isExpanded)}
      >
        {hasChildren ? (
          <button className="mr-2 p-1 hover:bg-blue-100 rounded transition-colors flex-shrink-0">
            {isExpanded ? (
              <ChevronDownIcon className="w-4 h-4 text-blue-600" />
            ) : (
              <ChevronRightIcon className="w-4 h-4 text-blue-600" />
            )}
          </button>
        ) : (
          <div className="w-6 mr-2 flex justify-center">
            <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
          </div>
        )}

        <div className="mr-3">{getNodeIcon()}</div>

        <div className="flex-1 flex items-center gap-3 min-w-0">
          <span className={clsx(
            'font-medium truncate',
            {
              'text-lg text-gray-800': node.type === 'module',
              'text-sm text-gray-700': node.type === 'resource' || node.type === 'services',
              'text-xs text-gray-600': node.type === 'action'
            }
          )}>
            {node.name}
          </span>

          <PermissionBadge permission={node.permission} isDenied={node.isDenied} />

          {(node.type === 'resource' || node.type === 'services') && node.permission && (
            <button
              onClick={handleExplainClick}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 ml-2"
              disabled={isExplaining}
            >
              <InformationCircleIcon className="w-4 h-4" />
              {explanation ? (isExplanationVisible ? '隐藏来源' : '显示来源') : '查看来源'}
            </button>
          )}

          {node.denyReason && (
            <div className="flex items-start gap-1">
              <InformationCircleIcon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${node.isDenied ? 'text-red-500' : 'text-blue-500'}`} />
              <span className={`text-xs break-words ${node.isDenied ? 'text-red-600' : 'text-blue-600'}`}>
                {node.denyReason}
              </span>
            </div>
          )}

          {node.source && (
            <span className="text-xs text-gray-500">
              来源: {node.sourceName || node.source}
            </span>
          )}
        </div>

        {node.canModify && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
            {node.isDenied && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePermission?.(node, true);
                }}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                解除禁用
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditNode?.(node);
              }}
              className="text-xs text-gray-600 hover:text-gray-800 font-medium"
            >
              编辑
            </button>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {isExplanationVisible && explanation && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ paddingLeft: `${indent + 48}px` }}
            className="pb-2"
          >
            <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r-lg">
              <h4 className="text-xs font-semibold text-blue-800 mb-1">权限来源分析</h4>
              <p className="text-sm text-blue-700 mb-2">
                <strong>原因:</strong> {explanation.reason}
              </p>
              {explanation.matchedRules.length > 0 && (
                <div>
                  <strong className="text-sm text-blue-700">匹配规则:</strong>
                  <div className="space-y-1 mt-1">
                    {explanation.matchedRules.map((rule, index) => (
                      <div key={index} className="text-xs font-mono bg-blue-100 text-blue-900 p-1 rounded">
                        {rule}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isExpanded && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {node.children!.map((child, index) => (
              <TreeNode
                key={`${child.id}-${index}`}
                node={child}
                level={level + 1}
                onTogglePermission={onTogglePermission}
                onEditNode={onEditNode}
                onExplainPermission={onExplainPermission}
                explanation={explanations[child.id]}
                isExplaining={isExplaining}
                explanations={explanations}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const PermissionTree: React.FC<PermissionTreeProps> = ({
  nodes,
  onTogglePermission,
  onEditNode,
  onExplainPermission,
  explanations,
  isExplaining
}) => {
  return (
    <div className="space-y-1">
      {nodes.map((node, index) => (
        <TreeNode
          key={`${node.id}-${index}`}
          node={node}
          level={0}
          onTogglePermission={onTogglePermission}
          onEditNode={onEditNode}
          onExplainPermission={onExplainPermission}
          explanation={explanations[node.id]}
          isExplaining={isExplaining}
          explanations={explanations}
        />
      ))}
    </div>
  );
};
