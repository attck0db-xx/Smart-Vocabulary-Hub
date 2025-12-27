
import React from 'react';
import { WordRecord } from '../types';

interface CalendarProps {
  records: WordRecord[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

const Calendar: React.FC<CalendarProps> = ({ records, selectedDate, onSelectDate }) => {
  const today = new Date();
  
  // Get last 14 days for a compact view
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
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-8 overflow-x-auto shadow-sm">
      <div className="flex gap-2 min-w-max pb-2">
        {days.map((day, idx) => {
          const count = getCountForDate(day);
          const isSelected = isSameDay(day, selectedDate);
          return (
            <button
              key={idx}
              onClick={() => onSelectDate(day)}
              className={`flex flex-col items-center justify-center min-w-[50px] p-2 rounded-md transition-all border ${
                isSelected ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-100' : 'bg-transparent border-transparent hover:bg-gray-50'
              }`}
            >
              <span className="text-[10px] text-gray-400 uppercase font-semibold">
                {day.toLocaleDateString('en-US', { weekday: 'short' })}
              </span>
              <span className={`text-sm font-medium ${isSelected ? 'text-blue-600' : 'text-gray-700'}`}>
                {day.getDate()}
              </span>
              <div className={`w-1.5 h-1.5 rounded-full mt-1 ${count > 0 ? 'bg-blue-400' : 'bg-gray-100'}`}></div>
              {count > 0 && <span className="text-[9px] text-blue-500 font-bold mt-0.5">{count}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;
