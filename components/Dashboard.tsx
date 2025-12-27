
import React from 'react';
import { StudyStats } from '../types';

interface DashboardProps {
  stats: StudyStats;
}

const Dashboard: React.FC<DashboardProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 gap-5 mb-10">
      <div className="bg-white p-7 border border-slate-200 rounded-3xl shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 relative z-10">Today's Progress</p>
        <div className="flex items-baseline gap-2 relative z-10">
          <span className="text-4xl font-black text-slate-900 tracking-tighter">{stats.todayCount}</span>
          <span className="text-xs font-bold text-slate-400">words</span>
        </div>
      </div>
      <div className="bg-white p-7 border border-slate-200 rounded-3xl shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 relative z-10">Monthly Total</p>
        <div className="flex items-baseline gap-2 relative z-10">
          <span className="text-4xl font-black text-slate-900 tracking-tighter">{stats.monthCount}</span>
          <span className="text-xs font-bold text-slate-400">words</span>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
