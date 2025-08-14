import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

export const Settings: React.FC = () => {
  const [syncInterval, setSyncInterval] = useState('30');
  const [apiUrl, setApiUrl] = useState('http://localhost:8080/api/v1');
  const [ldapServer, setLdapServer] = useState('ldap://ad.link.cuhk.edu.cn');

  const handleSave = () => {
    // 这里应该调用 API 保存设置
    toast.success('设置已保存');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">系统设置</h1>

        <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
          {/* 同步设置 */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">同步设置</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  自动同步间隔（分钟）
                </label>
                <input
                  type="number"
                  value={syncInterval}
                  onChange={(e) => setSyncInterval(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  LDAP 服务器地址
                </label>
                <input
                  type="text"
                  value={ldapServer}
                  onChange={(e) => setLdapServer(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>

          {/* API 设置 */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">API 设置</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                UniAuth API 地址
              </label>
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              保存设置
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
