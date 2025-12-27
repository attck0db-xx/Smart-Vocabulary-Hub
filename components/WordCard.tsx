
import React from 'react';
import { WordRecord } from '../types';

interface WordCardProps {
  record: WordRecord;
  onPlay: (text: string) => void;
  onDelete: (id: string) => void;
  minimal?: boolean;
}

const WordCard: React.FC<WordCardProps> = ({ record, onPlay, onDelete, minimal = false }) => {
  return (
    <div className={`bg-white border-b border-gray-200 py-6 px-4 hover:bg-gray-50 transition-colors group relative ${minimal ? 'rounded-lg border shadow-sm my-2' : ''}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="text-xl font-medium text-gray-900 capitalize">{record.word}</h3>
            <button 
              onClick={() => onPlay(record.word)}
              className="p-1.5 rounded-full hover:bg-gray-200 text-blue-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
              </svg>
            </button>
            {!minimal && <span className="text-sm font-medium text-gray-400">{record.wordTranslation}</span>}
          </div>
          
          {!minimal && (
            <>
              <p className="text-sm font-mono text-gray-500 mb-3">{record.phonetic}</p>
              <div className="flex items-start gap-2 group/sentence">
                <p className="text-gray-700 italic border-l-2 border-gray-100 pl-3 flex-1">
                  "{record.sentence}"
                  <span className="block text-sm text-gray-400 not-italic mt-1">{record.sentenceTranslation}</span>
                </p>
                <button 
                  onClick={() => onPlay(record.sentence)}
                  className="p-1 rounded-full hover:bg-gray-200 text-gray-400 hover:text-blue-600 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>
        <button 
          onClick={() => onDelete(record.id)}
          className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default WordCard;
