
import React, { useState } from 'react';
import { WordRecord } from '../types';

interface WordCardProps {
  record: WordRecord;
  onPlay: (text: string) => void;
  onDelete: (id: string) => void;
  minimal?: boolean;
}

const WordCard: React.FC<WordCardProps> = ({ record, onPlay, onDelete, minimal = false }) => {
  const [showMeaning, setShowMeaning] = useState(false);

  return (
    <div className={`bg-white transition-all group relative overflow-hidden flex flex-col h-full ${
      minimal 
        ? 'rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:shadow-slate-100 hover:border-slate-200' 
        : 'border border-slate-100 rounded-[32px] p-8 shadow-sm hover:shadow-2xl hover:shadow-blue-50 transition-all duration-500'
    }`}>
      {!minimal && <div className="absolute top-0 left-0 w-2 h-full bg-slate-50 group-hover:bg-blue-500 transition-all duration-500"></div>}
      
      <div className="flex justify-between items-start mb-6">
        <div className="flex-1">
          <div className="flex items-center flex-wrap gap-4">
            <h3 className={`font-black text-slate-900 tracking-tight ${minimal ? 'text-2xl' : 'text-4xl'}`}>{record.word}</h3>
            <button 
              onClick={() => onPlay(record.word)}
              className="p-2 rounded-full hover:bg-blue-50 text-blue-400 hover:text-blue-600 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
              </svg>
            </button>
            {!minimal && <span className="text-sm font-black text-blue-600 bg-blue-50/50 px-4 py-1.5 rounded-xl uppercase tracking-wider">{record.wordTranslation}</span>}
          </div>
          <p className={`text-xs font-mono text-slate-300 mt-2 italic ${minimal ? 'mb-4' : 'mb-8'}`}>{record.phonetic}</p>
        </div>
        
        <button 
          onClick={() => onDelete(record.id)}
          className={`p-2 text-slate-100 hover:text-red-500 transition-all rounded-full hover:bg-red-50 ${minimal ? '' : 'md:opacity-0 md:group-hover:opacity-100'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div className="flex-1">
        {!minimal && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
            <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-50 group-hover:bg-white transition-colors group-hover:shadow-inner">
              <div className="flex items-start gap-4">
                <p className="text-slate-800 font-medium text-lg md:text-2xl leading-relaxed flex-1 italic">
                  <span className="text-blue-200 text-3xl font-serif">“</span>
                  {record.sentence}
                  <span className="text-blue-200 text-3xl font-serif">”</span>
                </p>
                <button 
                  onClick={() => onPlay(record.sentence)}
                  className="p-2 rounded-xl hover:bg-slate-100 text-slate-300 hover:text-blue-500 transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                  </svg>
                </button>
              </div>
              <div className="mt-6 pt-5 border-t border-slate-100/50">
                <p className="text-base text-slate-400 font-bold tracking-tight">{record.sentenceTranslation}</p>
              </div>
            </div>
          </div>
        )}

        {minimal && (
          <div className="mt-auto">
            {showMeaning ? (
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
                 <p className="text-lg font-black text-slate-800">{record.wordTranslation}</p>
                 <button 
                  onClick={() => setShowMeaning(false)}
                  className="mt-4 text-xs text-slate-400 hover:text-slate-600 font-bold uppercase tracking-widest block"
                 >
                   隐藏释义
                 </button>
              </div>
            ) : (
              <button 
                onClick={() => setShowMeaning(true)}
                className="w-full text-xs font-black text-blue-600 bg-blue-50 px-5 py-4 rounded-2xl hover:bg-blue-600 hover:text-white transition-all border border-blue-100/30 uppercase tracking-[0.2em] shadow-sm active:scale-95"
              >
                显示释义
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WordCard;
