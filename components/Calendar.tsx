
import React from 'react';
import { WordRecord } from '../types';

interface CalendarProps {
  records: WordRecord[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

const Calendar: React.FC<CalendarProps> = ({ records, selectedDate, onSelectDate }) => {
  const today = new Date();
  
  const days = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setDate(today.getDate() - (13 - i));
    return d;
  });

  const getCountForDate = (date: Date) => {
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const endOfDay = startOfDay + 86400000;
    return records.filter(r => r.timestamp >= startOfDay && r.timestamp < endOfDay).length;
  };

  const isSameDay = (d1: Date, d2: Date) => 
    d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 mb-10 overflow-hidden shadow-sm">
      <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
        {days.map((day, idx) => {
          const count = getCountForDate(day);
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, today);
          
          return (
            <button
              key={idx}
              onClick={() => onSelectDate(day)}
              className={`flex flex-col items-center justify-center min-w-[58px] py-4 rounded-2xl transition-all border shrink-0 ${
                isSelected 
                  ? 'bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-200 scale-105' 
                  : 'bg-white border-slate-50 hover:border-slate-200 text-slate-400'
              }`}
            >
              <span className={`text-[9px] uppercase font-black tracking-widest mb-1 ${isSelected ? 'text-slate-400' : 'text-slate-300'}`}>
                {day.toLocaleDateString('en-US', { weekday: 'short' })}
              </span>
              <span className={`text-base font-black ${isSelected ? 'text-white' : isToday ? 'text-blue-500' : 'text-slate-700'}`}>
                {day.getDate()}
              </span>
              <div className="mt-2 flex flex-col items-center gap-1">
                <div className={`w-1.5 h-1.5 rounded-full ${count > 0 ? (isSelected ? 'bg-blue-400' : 'bg-blue-500') : (isSelected ? 'bg-slate-700' : 'bg-slate-100')}`}></div>
                {count > 0 && <span className={`text-[9px] font-bold ${isSelected ? 'text-blue-300' : 'text-blue-500'}`}>{count}</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;
