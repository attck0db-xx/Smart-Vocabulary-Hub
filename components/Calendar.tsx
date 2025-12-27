
import React, { useState } from 'react';
import { WordRecord, Dialogue, ReviewStatus } from '../types';

interface CalendarProps {
  records: WordRecord[];
  dialogues: Dialogue[];
  reviewStatus: ReviewStatus;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

const Calendar: React.FC<CalendarProps> = ({ records, dialogues, reviewStatus, selectedDate, onSelectDate }) => {
  const [viewDate, setViewDate] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));

  const changeMonth = (offset: number) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1));
  };

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysCount = daysInMonth(year, month);
  const firstDay = firstDayOfMonth(year, month);

  const isSameDay = (d1: Date, d2: Date) => 
    d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();

  const getStatsForDay = (day: number) => {
    const d = new Date(year, month, day);
    const startOfDay = d.getTime();
    const endOfDay = startOfDay + 86400000;
    const dayWords = records.filter(r => r.timestamp >= startOfDay && r.timestamp < endOfDay).length;
    const dayDialogues = dialogues.filter(dlg => dlg.timestamp >= startOfDay && dlg.timestamp < endOfDay).length;
    
    const dateKey = `${year}-${month + 1}-${day}`;
    const status = reviewStatus[dateKey] || { wordsReviewed: false, dialoguesReviewed: false };
    const isReviewed = status.wordsReviewed && status.dialoguesReviewed;

    return { dayWords, dayDialogues, isReviewed };
  };

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <div className="bg-white border border-slate-100 rounded-[40px] p-8 shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <h4 className="text-2xl font-black text-slate-900">
            {viewDate.getFullYear()}年 {viewDate.getMonth() + 1}月
          </h4>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-full border border-slate-100">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">学习活跃度</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => changeMonth(-1)} className="p-2.5 rounded-2xl hover:bg-slate-50 border border-slate-100 transition-all text-slate-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeWidth="2.5"/></svg>
          </button>
          <button onClick={() => setViewDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1))} className="px-4 py-2.5 rounded-2xl bg-slate-50 text-[11px] font-black text-slate-600 hover:bg-slate-100 border border-slate-100 transition-all">回到今天</button>
          <button onClick={() => changeMonth(1)} className="p-2.5 rounded-2xl hover:bg-slate-50 border border-slate-100 transition-all text-slate-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeWidth="2.5"/></svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-3">
        {weekDays.map(wd => (
          <div key={wd} className="text-center text-[11px] font-black text-slate-300 py-2">
            {wd}
          </div>
        ))}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="h-20 lg:h-24"></div>
        ))}
        {Array.from({ length: daysCount }).map((_, i) => {
          const day = i + 1;
          const { dayWords, dayDialogues, isReviewed } = getStatsForDay(day);
          const currentDayDate = new Date(year, month, day);
          const isSelected = isSameDay(currentDayDate, selectedDate);
          const isToday = isSameDay(currentDayDate, new Date());

          return (
            <button
              key={day}
              onClick={() => onSelectDate(currentDayDate)}
              className={`h-20 lg:h-24 p-2 rounded-3xl border transition-all flex flex-col relative group overflow-hidden ${
                isSelected 
                  ? 'bg-slate-900 border-slate-900 text-white shadow-xl scale-105 z-10' 
                  : isToday 
                    ? 'bg-white border-blue-100 text-slate-900 hover:border-blue-400' 
                    : 'bg-slate-50/20 border-slate-50 hover:bg-white hover:border-slate-200'
              }`}
            >
              <span className={`text-sm font-black mb-1 ${isSelected ? 'text-white' : isToday ? 'text-blue-500 underline underline-offset-4 decoration-2' : 'text-slate-700'}`}>
                {day}
              </span>
              
              <div className="flex-1 flex flex-col gap-1 justify-center">
                {dayWords > 0 && (
                  <div className="flex items-center gap-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-blue-400' : 'bg-blue-500'}`}></div>
                    <span className={`text-[9px] font-bold ${isSelected ? 'text-blue-200' : 'text-slate-400'}`}>{dayWords}词</span>
                  </div>
                )}
                {dayDialogues > 0 && (
                  <div className="flex items-center gap-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-emerald-400' : 'bg-emerald-500'}`}></div>
                    <span className={`text-[9px] font-bold ${isSelected ? 'text-emerald-200' : 'text-slate-400'}`}>{dayDialogues}景</span>
                  </div>
                )}
              </div>

              {isReviewed && (
                <div className="absolute top-2 right-2">
                  <div className={`p-0.5 rounded-full ${isSelected ? 'bg-blue-400' : 'bg-green-500'}`}>
                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
      
      <div className="mt-8 flex flex-wrap gap-6 px-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          <span className="text-[10px] font-bold text-slate-400">已学单词</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          <span className="text-[10px] font-bold text-slate-400">已学场景</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-1.5 h-1.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeWidth="4"/></svg>
          </div>
          <span className="text-[10px] font-bold text-slate-400">复习已打卡</span>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
