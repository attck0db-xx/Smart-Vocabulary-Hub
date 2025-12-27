
import React from 'react';
import { StudyStats } from '../types';

interface DashboardProps {
  stats: StudyStats;
}

const Dashboard: React.FC<DashboardProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="bg-white p-8 border border-slate-100 rounded-[32px] shadow-sm relative overflow-hidden group hover:shadow-lg transition-all">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full -mr-10 -mt-10 transition-transform duration-700 group-hover:scale-125"></div>
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 relative z-10">今日目标</p>
        <div className="flex items-baseline gap-2 relative z-10">
          <span className="text-5xl font-black text-slate-900 tracking-tighter">{stats.todayCount}</span>
          <span className="text-[11px] font-black text-slate-400">个单词</span>
        </div>
        <div className="mt-6 w-full h-1 bg-slate-50 rounded-full overflow-hidden relative z-10">
          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, stats.todayCount * 5)}%` }}></div>
        </div>
      </div>
      
      <div className="bg-white p-8 border border-slate-100 rounded-[32px] shadow-sm relative overflow-hidden group hover:shadow-lg transition-all">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full -mr-10 -mt-10 transition-transform duration-700 group-hover:scale-125"></div>
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 relative z-10">本月累计</p>
        <div className="flex items-baseline gap-2 relative z-10">
          <span className="text-5xl font-black text-slate-900 tracking-tighter">{stats.monthCount}</span>
          <span className="text-[11px] font-black text-slate-400">总学词</span>
        </div>
        <div className="mt-6 w-full h-1 bg-slate-50 rounded-full overflow-hidden relative z-10">
          <div className="h-full bg-indigo-400 rounded-full" style={{ width: '100%' }}></div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
