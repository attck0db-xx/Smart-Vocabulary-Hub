
import React from 'react';
import { StudyStats } from '../types';

interface DashboardProps {
  stats: StudyStats;
}

const Dashboard: React.FC<DashboardProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 gap-4 mb-8">
      <div className="bg-white p-6 border border-gray-200 rounded-lg shadow-sm">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Today's Progress</p>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-gray-900">{stats.todayCount}</span>
          <span className="text-sm text-gray-500">words</span>
        </div>
      </div>
      <div className="bg-white p-6 border border-gray-200 rounded-lg shadow-sm">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Monthly Total</p>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-gray-900">{stats.monthCount}</span>
          <span className="text-sm text-gray-500">words</span>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
