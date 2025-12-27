
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
    <div className={`bg-white transition-all group relative overflow-hidden ${
      minimal 
        ? 'rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-slate-300' 
        : 'border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-lg mb-4'
    }`}>
      {!minimal && <div className="absolute top-0 left-0 w-1 h-full bg-slate-100 group-hover:bg-blue-400 transition-colors"></div>}
      
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-2">
            <h3 className={`font-bold text-slate-900 capitalize ${minimal ? 'text-lg' : 'text-2xl'}`}>{record.word}</h3>
            <button 
              onClick={() => onPlay(record.word)}
              className="p-2 rounded-full hover:bg-blue-50 text-blue-500 transition-all border border-transparent hover:border-blue-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
              </svg>
            </button>
            {!minimal && <span className="text-sm font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full">{record.wordTranslation}</span>}
          </div>
          
          {!minimal && (
            <div className="animate-in fade-in slide-in-from-left-2">
              <p className="text-xs font-mono text-slate-400 mb-5 bg-slate-50 w-fit px-2 py-0.5 rounded italic">{record.phonetic}</p>
              <div className="flex items-start gap-4 group/sentence bg-slate-50/50 p-4 rounded-xl border border-slate-50">
                <p className="text-slate-700 italic flex-1 text-sm leading-relaxed">
                  <span className="text-blue-300 font-serif mr-1 text-lg">“</span>
                  {record.sentence}
                  <span className="text-blue-300 font-serif ml-1 text-lg">”</span>
                  <span className="block text-xs text-slate-400 not-italic mt-2 font-medium bg-white w-fit px-2 py-1 rounded border border-slate-100">{record.sentenceTranslation}</span>
                </p>
                <button 
                  onClick={() => onPlay(record.sentence)}
                  className="p-1.5 rounded-lg hover:bg-white text-slate-300 hover:text-blue-500 transition-all border border-transparent hover:border-slate-100"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                  </svg>
                </button>
              </div>
            </div>
          )}

          {minimal && (
            <div className="mt-3">
              {showMeaning ? (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 animate-in zoom-in-95 duration-200">
                   <p className="text-xs font-bold text-slate-700">{record.wordTranslation}</p>
                   <p className="text-[10px] text-slate-400 font-mono mt-1">{record.phonetic}</p>
                   <button 
                    onClick={() => setShowMeaning(false)}
                    className="mt-2 text-[10px] text-slate-400 hover:text-slate-600 underline"
                   >
                     收起
                   </button>
                </div>
              ) : (
                <button 
                  onClick={() => setShowMeaning(true)}
                  className="text-[10px] font-bold text-blue-500 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-all border border-blue-100/50"
                >
                  Show Meaning
                </button>
              )}
            </div>
          )}
        </div>
        
        <button 
          onClick={() => onDelete(record.id)}
          className={`p-2 text-slate-300 hover:text-red-500 transition-all rounded-full hover:bg-red-50 ${minimal ? '' : 'opacity-0 group-hover:opacity-100'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default WordCard;
