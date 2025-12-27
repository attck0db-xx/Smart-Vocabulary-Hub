
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { WordRecord, StudyStats, Dialogue, WordLookup } from './types';
import WordCard from './components/WordCard';
import Dashboard from './components/Dashboard';
import Calendar from './components/Calendar';
import { fetchWordData, fetchHighFreqWords, generateDialogue, lookupWord } from './services/geminiService';

const STORAGE_KEY = 'vocab_dashboard_records_v2';
const DIALOGUE_STORAGE_KEY = 'vocab_dashboard_dialogues_v1';

const App: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [records, setRecords] = useState<WordRecord[]>([]);
  const [savedDialogues, setSavedDialogues] = useState<Dialogue[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'normal' | 'review_words' | 'review_dialogues'>('normal');
  const [currentDialogue, setCurrentDialogue] = useState<Dialogue | null>(null);
  
  // Word lookup state
  const [lookup, setLookup] = useState<{data: WordLookup, x: number, y: number} | null>(null);
  const [revealedDialogueIds, setRevealedDialogueIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const savedDialogs = localStorage.getItem(DIALOGUE_STORAGE_KEY);
    if (saved) setRecords(JSON.parse(saved));
    if (savedDialogs) setSavedDialogues(JSON.parse(savedDialogs));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem(DIALOGUE_STORAGE_KEY, JSON.stringify(savedDialogues));
  }, [savedDialogues]);

  const filteredRecords = useMemo(() => {
    const startOfDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()).getTime();
    const endOfDay = startOfDay + 86400000;
    return records.filter(r => r.timestamp >= startOfDay && r.timestamp < endOfDay);
  }, [records, selectedDate]);

  const stats: StudyStats = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    return {
      todayCount: records.filter(r => r.timestamp >= startOfToday).length,
      monthCount: records.filter(r => r.timestamp >= startOfMonth).length
    };
  }, [records]);

  const handleProcess = async (words: string[]) => {
    if (words.length === 0) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchWordData(words);
      if (data && data.length > 0) {
        const newRecords: WordRecord[] = data.map(item => ({
          ...item,
          id: Math.random().toString(36).substr(2, 9),
          timestamp: Date.now()
        }));
        setRecords(prev => [...newRecords, ...prev]);
        setSelectedDate(new Date());
      }
    } catch (err) {
      setError("Failed to fetch word data.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchHighFreqWords = async () => {
    setIsLoading(true);
    try {
      const words = await fetchHighFreqWords();
      if (words && words.length > 0) {
        await handleProcess(words);
      }
    } catch (err) {
      setError("Failed to fetch words.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateDialogue = async () => {
    setIsLoading(true);
    try {
      const d = await generateDialogue();
      if (d) {
        setCurrentDialogue(d);
        setSavedDialogues(prev => [d, ...prev]);
      }
    } catch (err) {
      setError("Failed to generate dialogue.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearDay = () => {
    if (!window.confirm("确定要清空所选日期当天的所有记录吗？")) return;
    const startOfDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()).getTime();
    const endOfDay = startOfDay + 86400000;
    setRecords(prev => prev.filter(r => r.timestamp < startOfDay || r.timestamp >= endOfDay));
  };

  const handlePlay = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  }, []);

  const handleWordDoubleClick = async (e: React.MouseEvent) => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
    if (selectedText && selectedText.split(/\s+/).length === 1) {
      const cleanWord = selectedText.replace(/[^a-zA-Z]/g, '');
      if (!cleanWord) return;
      
      const result = await lookupWord(cleanWord);
      if (result) {
        setLookup({
          data: result,
          x: e.clientX,
          y: e.clientY
        });
      }
    }
  };

  const handleDeleteDialogue = (id: string) => {
    setSavedDialogues(prev => prev.filter(d => d.id !== id));
  };

  const toggleRevealDialogue = (id: string) => {
    setRevealedDialogueIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 md:py-20 bg-gray-50 min-h-screen relative" onClick={() => setLookup(null)}>
      {/* Word Lookup Popup */}
      {lookup && (
        <div 
          className="fixed z-50 bg-white border border-gray-200 shadow-xl rounded-lg p-3 text-xs animate-in zoom-in-95"
          style={{ top: lookup.y - 60, left: lookup.x }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-gray-900">{lookup.data.word}</span>
            <span className="text-gray-400 font-mono">{lookup.data.phonetic}</span>
            <button onClick={() => handlePlay(lookup.data.word)} className="text-blue-500 hover:text-blue-700">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 5 6 9 2 9 2 15 6 15 11 19 11 5Z" strokeWidth="2"/></svg>
            </button>
          </div>
          <div className="text-gray-600 border-t border-gray-50 pt-1 mt-1">{lookup.data.translation}</div>
        </div>
      )}

      <header className="mb-10 text-center">
        <h1 className="text-3xl font-light text-gray-900 tracking-tight mb-2">欧大宝专属单词打卡神器</h1>
        <p className="text-gray-500 font-light italic">Smart Vocabulary Hub</p>
      </header>

      <div className="flex flex-wrap gap-2 mb-6">
        <button 
          onClick={() => setViewMode(viewMode === 'review_words' ? 'normal' : 'review_words')}
          className={`px-4 py-2 rounded-full border text-xs transition-all ${viewMode === 'review_words' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'}`}
        >
          {viewMode === 'review_words' ? '退出单词复习' : '单词复习'}
        </button>
        <button 
          onClick={() => setViewMode(viewMode === 'review_dialogues' ? 'normal' : 'review_dialogues')}
          className={`px-4 py-2 rounded-full border text-xs transition-all ${viewMode === 'review_dialogues' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'}`}
        >
          {viewMode === 'review_dialogues' ? '退出对话复习' : '对话复习'}
        </button>
        {viewMode === 'normal' && (
          <>
            <button 
              onClick={handleFetchHighFreqWords}
              disabled={isLoading}
              className="px-4 py-2 rounded-full border bg-white text-gray-600 border-gray-200 hover:border-blue-400 text-xs transition-all disabled:opacity-50"
            >
              生活常用词 (30)
            </button>
            <button 
              onClick={handleGenerateDialogue}
              disabled={isLoading}
              className="px-4 py-2 rounded-full border bg-white text-gray-600 border-gray-200 hover:border-blue-400 text-xs transition-all disabled:opacity-50"
            >
              生活场景对话
            </button>
          </>
        )}
      </div>

      {viewMode === 'normal' && (
        <>
          <Dashboard stats={stats} />
          <Calendar records={records} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
          
          <section className="bg-white border border-gray-200 rounded-lg p-6 mb-8 shadow-sm">
            <textarea
              className="w-full h-24 p-4 border border-gray-100 rounded-md focus:ring-1 focus:ring-blue-500 outline-none text-gray-700 font-light resize-none bg-gray-50"
              placeholder="粘贴单词，逗号或换行分隔..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleProcess.bind(null, inputText.split(/,|\n/).map(w => w.trim()).filter(w => w.length > 0))}
                disabled={isLoading || !inputText.trim()}
                className="bg-blue-600 text-white px-8 py-2 rounded-md hover:bg-blue-700 transition-all disabled:opacity-50 font-medium"
              >
                {isLoading ? '解析中...' : '解析单词'}
              </button>
            </div>
            {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
          </section>

          {currentDialogue && (
            <div 
              className="bg-white border border-blue-100 rounded-lg p-6 mb-8 shadow-sm relative animate-in slide-in-from-top-4 duration-500"
              onDoubleClick={handleWordDoubleClick}
            >
              <button onClick={() => setCurrentDialogue(null)} className="absolute top-2 right-2 text-gray-300 hover:text-gray-500 text-xl">×</button>
              <h2 className="text-lg font-semibold text-blue-600 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
                新生成：{currentDialogue.title}
              </h2>
              <p className="text-[10px] text-blue-400 mb-4 bg-blue-50 py-1 px-2 rounded w-fit">双击单词可即时翻译朗读</p>
              <div className="space-y-4">
                {currentDialogue.lines.map((line, i) => (
                  <div key={i} className="flex gap-4 group">
                    <span className="font-bold text-[10px] text-gray-300 w-4 pt-1.5 shrink-0">{line.speaker}</span>
                    <div className="flex-1">
                      <div className="flex items-start gap-2">
                        <p className="text-gray-800 text-sm leading-relaxed flex-1 select-text">{line.text}</p>
                        <button onClick={() => handlePlay(line.text)} className="text-gray-300 hover:text-blue-500 shrink-0">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 5 6 9 2 9 2 15 6 15 11 19 11 5Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{line.translation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-0">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                {selectedDate.toLocaleDateString()} 记录
              </h3>
              {filteredRecords.length > 0 && (
                <button onClick={handleClearDay} className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1 transition-colors">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  清空当日
                </button>
              )}
            </div>
            {filteredRecords.length > 0 ? (
              filteredRecords.map((record) => (
                <WordCard key={record.id} record={record} onPlay={handlePlay} onDelete={(id) => setRecords(prev => prev.filter(r => r.id !== id))} />
              ))
            ) : (
              <div className="py-20 text-center text-gray-300 border border-dashed border-gray-200 rounded-lg">
                <p>当日无记录</p>
              </div>
            )}
          </div>
        </>
      )}

      {viewMode === 'review_words' && (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h2 className="text-blue-800 font-medium">单词复习模式</h2>
            <p className="text-blue-600 text-[10px] mt-1">掌握后点击 × 移除。</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {records.map((record) => (
              <WordCard key={record.id} record={record} onPlay={handlePlay} onDelete={(id) => setRecords(prev => prev.filter(r => r.id !== id))} minimal={true} />
            ))}
          </div>
          {records.length === 0 && <div className="py-20 text-center text-gray-300"><p>词库已清空。</p></div>}
        </div>
      )}

      {viewMode === 'review_dialogues' && (
        <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
          <div className="bg-green-50 p-4 rounded-lg border border-green-100">
            <h2 className="text-green-800 font-medium">对话复习模式</h2>
            <p className="text-green-600 text-[10px] mt-1">显示中文翻译，点击 Show 查阅原文。点击右上角 × 永久删除。</p>
          </div>
          <div className="space-y-6">
            {savedDialogues.map((dlg) => (
              <div key={dlg.id} className="bg-white border border-gray-200 rounded-lg p-6 relative shadow-sm group">
                <button onClick={() => handleDeleteDialogue(dlg.id)} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
                <h3 className="text-lg font-medium text-gray-800 mb-6 pr-8">{dlg.title}</h3>
                <div className="space-y-6">
                  {dlg.lines.map((line, idx) => {
                    const isRevealed = revealedDialogueIds.has(`${dlg.id}_${idx}`);
                    return (
                      <div key={idx} className="flex gap-4">
                        <span className="font-bold text-[10px] text-gray-300 w-4 pt-1 shrink-0">{line.speaker}</span>
                        <div className="flex-1">
                          <p className="text-gray-500 italic text-sm mb-2">"{line.translation}"</p>
                          {isRevealed ? (
                            <div className="bg-gray-50 p-3 rounded-md animate-in fade-in duration-500">
                              <div className="flex items-start gap-2">
                                <p className="text-gray-900 text-sm leading-relaxed flex-1 font-medium">{line.text}</p>
                                <button onClick={() => handlePlay(line.text)} className="text-blue-500 hover:text-blue-700">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 5 6 9 2 9 2 15 6 15 11 19 11 5Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button 
                              onClick={() => toggleRevealDialogue(`${dlg.id}_${idx}`)}
                              className="text-xs font-semibold text-blue-500 hover:text-blue-700 flex items-center gap-1"
                            >
                              Show English
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            {savedDialogues.length === 0 && <div className="py-20 text-center text-gray-300"><p>尚无保存的对话。</p></div>}
          </div>
        </div>
      )}

      <footer className="mt-20 py-10 text-center border-t border-gray-100">
        <p className="text-[10px] text-gray-300 uppercase tracking-widest">Minimalist Language Tool • Powered by Gemini Flash</p>
      </footer>
    </div>
  );
};

export default App;
