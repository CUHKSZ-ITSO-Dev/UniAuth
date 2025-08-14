import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  UsersIcon,
  ShieldCheckIcon,
  RectangleStackIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { api } from '../api/client';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const StatCard: React.FC<{ title: string; value: number; icon: React.ElementType }> = ({ title, value, icon: Icon }) => (
  <div className="bg-white rounded-xl shadow-sm p-6 flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-3xl font-semibold text-gray-900">{value}</p>
    </div>
    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
      <Icon className="w-6 h-6 text-primary-600" />
    </div>
  </div>
);

export const Dashboard: React.FC = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: api.getStats,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const groupData = {
    labels: stats ? Object.keys(stats.groupDistribution) : [],
    datasets: [
      {
        label: '用户数',
        data: stats ? Object.values(stats.groupDistribution) : [],
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
    ],
  };

  const activityData = {
    labels: stats ? stats.recentActivity.map(d => format(new Date(d.timestamp), 'M月d日', { locale: zhCN })) : [],
    datasets: [
      {
        label: '权限变更次数',
        data: stats ? stats.recentActivity.map(d => d.count) : [],
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  };
  
  const cardStats = [
    { title: '总用户数', value: stats?.totalUsers || 0, icon: UsersIcon },
    { title: '活跃用户数', value: stats?.activeUsers || 0, icon: ArrowTrendingUpIcon },
    { title: '总权限数', value: stats?.totalPermissions || 0, icon: ShieldCheckIcon },
    { title: '抽象组数', value: stats?.abstractGroups || 0, icon: RectangleStackIcon },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">系统概览</h1>

        {/* 统计卡片 */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1,
              },
            },
          }}
        >
          {cardStats.map((stat, index) => (
            <motion.div key={index} variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}>
              <StatCard {...stat} />
            </motion.div>
          ))}
        </motion.div>

        {/* 图表 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 用户组分布 */}
          <motion.div
            className="bg-white rounded-xl shadow-sm p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">用户组分布</h3>
            <Bar data={groupData} />
          </motion.div>

          {/* 活动趋势 */}
          <motion.div
            className="bg-white rounded-xl shadow-sm p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">权限变更趋势 (近7天)</h3>
            <Line data={activityData} />
          </motion.div>
        </div>
      </div>
    </div>
  );
};
