import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import {
  HomeIcon,
  UsersIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  CogIcon,
  Cog6ToothIcon,
  SquaresPlusIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

import { Dashboard } from './pages/Dashboard';
import { UserDetail } from './pages/UserDetail';
import { UserList } from './pages/UserList';
import { AuditLog } from './pages/AuditLog';
import { Settings } from './pages/Settings';
import RuleManagement from './pages/RuleManagement';
import AbstractGroupListPage from './pages/AbstractGroups/AbstractGroupListPage';

// 创建 QueryClient 实例
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5分钟
      retry: 2,
    },
  },
});

const navigation = [
  { name: '控制台', href: '/', icon: HomeIcon },
  { name: '用户管理', href: '/users', icon: UsersIcon },
  { name: '规则管理', href: '/rules', icon: Cog6ToothIcon },
  { name: '抽象组管理', href: '/abstract-groups', icon: SquaresPlusIcon },
  { name: '审计日志', href: '/audit', icon: DocumentTextIcon },
  { name: '系统设置', href: '/settings', icon: CogIcon },
];

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* 侧边栏 */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow pt-5 bg-gray-900 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <div className="flex items-center">
              <ShieldCheckIcon className="w-8 h-8 text-white" />
              <span className="ml-2 text-xl font-semibold text-white">UniAuth</span>
            </div>
          </div>
          <div className="mt-8 flex-grow flex flex-col">
            <nav className="flex-1 px-2 space-y-1">
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    clsx(
                      isActive
                        ? 'bg-gray-800 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                      'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors'
                    )
                  }
                >
                  <item.icon
                    className="mr-3 flex-shrink-0 h-6 w-6"
                    aria-hidden="true"
                  />
                  {item.name}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex-shrink-0 flex bg-gray-700 p-4">
            <div className="flex items-center">
              <div>
                <img
                  className="inline-block h-9 w-9 rounded-full"
                  src="https://ui-avatars.com/api/?name=Admin&background=3b82f6&color=fff"
                  alt="Admin"
                />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">系统管理员</p>
                <p className="text-xs font-medium text-gray-300">admin@uniauth.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* 移动端顶部栏 */}
        <div className="md:hidden">
          <div className="bg-gray-900 pt-2 pb-3 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <ShieldCheckIcon className="w-8 h-8 text-white" />
                <span className="ml-2 text-xl font-semibold text-white">UniAuth</span>
              </div>
            </div>
          </div>
        </div>

        {/* 页面内容 */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/users" element={<UserList />} />
            <Route path="/users/:upn" element={<UserDetail />} />
            <Route path="/rules" element={<RuleManagement />} />
            <Route path="/abstract-groups" element={<AbstractGroupListPage />} />
            <Route path="/audit" element={<AuditLog />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </Router>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            style: {
              background: '#10B981',
            },
          },
          error: {
            style: {
              background: '#EF4444',
            },
          },
        }}
      />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
