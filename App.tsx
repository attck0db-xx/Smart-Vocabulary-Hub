
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { WordRecord, StudyStats, Dialogue, WordLookup, ReviewStatus } from './types';
import WordCard from './components/WordCard';
import Dashboard from './components/Dashboard';
import Calendar from './components/Calendar';
import { fetchWordData, fetchHighFreqWords, generateDialogue, lookupWord } from './services/geminiService';

const STORAGE_KEY = 'vocab_dashboard_records_v2';
const DIALOGUE_STORAGE_KEY = 'vocab_dashboard_dialogues_v1';
const REVIEW_STORAGE_KEY = 'vocab_dashboard_reviews_v1';

const App: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [records, setRecords] = useState<WordRecord[]>([]);
  const [savedDialogues, setSavedDialogues] = useState<Dialogue[]>([]);
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>({});
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'normal' | 'review_words' | 'review_dialogues'>('normal');
  const [currentDialogue, setCurrentDialogue] = useState<Dialogue | null>(null);
  
  const [lookup, setLookup] = useState<{data: WordLookup, x: number, y: number} | null>(null);
  const [revealedDialogueIds, setRevealedDialogueIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const savedDialogs = localStorage.getItem(DIALOGUE_STORAGE_KEY);
    const savedReviews = localStorage.getItem(REVIEW_STORAGE_KEY);
    if (saved) setRecords(JSON.parse(saved));
    if (savedDialogs) setSavedDialogues(JSON.parse(savedDialogs));
    if (savedReviews) setReviewStatus(JSON.parse(savedReviews));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem(DIALOGUE_STORAGE_KEY, JSON.stringify(savedDialogues));
  }, [savedDialogues]);

  useEffect(() => {
    localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(reviewStatus));
  }, [reviewStatus]);

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
    const existingWords = new Set(records.map(r => r.word.toLowerCase()));
    const uniqueWords = words.filter(w => !existingWords.has(w.toLowerCase()));
    
    if (uniqueWords.length === 0) {
      setError("输入的所有单词都已在学习计划中。");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchWordData(uniqueWords);
      if (data && data.length > 0) {
        const newRecords: WordRecord[] = data.map(item => ({
          ...item,
          id: Math.random().toString(36).substr(2, 9),
          timestamp: Date.now()
        }));
        setRecords(prev => [...newRecords, ...prev]);
        setSelectedDate(new Date());
        setInputText('');
      }
    } catch (err) {
      setError("解析失败，请检查配置。");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchHighFreqWords = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const words = await fetchHighFreqWords();
      if (words && words.length > 0) {
        await handleProcess(words);
      }
    } catch (err) {
      setError("获取生活词汇失败。");
      setIsLoading(false);
    }
  };

  const handleGenerateDialogue = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const d = await generateDialogue();
      if (d) {
        setCurrentDialogue(d);
        setSavedDialogues(prev => [d, ...prev]);
      }
    } catch (err) {
      setError("生成对话失败。");
    } finally {
      setIsLoading(false);
    }
  };

  const updateReviewStatus = (type: 'words' | 'dialogues') => {
    const today = new Date();
    const dateKey = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    setReviewStatus(prev => ({
      ...prev,
      [dateKey]: {
        ...(prev[dateKey] || { wordsReviewed: false, dialoguesReviewed: false }),
        [type === 'words' ? 'wordsReviewed' : 'dialoguesReviewed']: true
      }
    }));
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
        setLookup({ data: result, x: e.clientX, y: e.clientY });
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
    <div className="min-h-screen bg-[#FDFDFF] text-slate-800 font-sans selection:bg-blue-100" onClick={() => setLookup(null)}>
      {lookup && (
        <div 
          className="fixed z-50 bg-white/95 backdrop-blur shadow-2xl rounded-2xl p-6 border border-slate-100 animate-in zoom-in-95 duration-200 min-w-[220px]"
          style={{ top: Math.min(window.innerHeight - 150, lookup.y - 120), left: Math.min(window.innerWidth - 240, lookup.x) }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="font-black text-xl text-slate-900">{lookup.data.word}</span>
            <button onClick={() => handlePlay(lookup.data.word)} className="text-blue-500 hover:text-blue-600 p-1.5 rounded-full hover:bg-blue-50 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M11 5 6 9 2 9 2 15 6 15 11 19 11 5Z"/></svg>
            </button>
          </div>
          <div className="text-slate-400 font-mono text-xs mb-3 italic">{lookup.data.phonetic}</div>
          <div className="text-slate-600 text-sm leading-relaxed border-t border-slate-50 pt-3 font-medium">{lookup.data.translation}</div>
        </div>
      )}

      <div className="max-w-[1400px] mx-auto px-8 py-12 md:py-20">
        
        <header className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8 border-b border-slate-100 pb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] mb-4">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
              Workspace
            </div>
            <h1 className="text-5xl lg:text-6xl font-black text-slate-900 tracking-tight mb-3">欧大宝打卡神器</h1>
            <p className="text-slate-400 font-bold text-lg tracking-tight">打造沉浸式英语学习环境 · 每日蜕变</p>
          </div>
          
          <nav className="flex flex-wrap gap-3">
            <button 
              onClick={() => { setViewMode(viewMode === 'review_words' ? 'normal' : 'review_words'); if (viewMode !== 'review_words') updateReviewStatus('words'); }}
              className={`px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-sm transition-all flex items-center gap-2 border ${viewMode === 'review_words' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-100 hover:border-slate-300'}`}
            >
              单词复习
            </button>
            <button 
              onClick={() => { setViewMode(viewMode === 'review_dialogues' ? 'normal' : 'review_dialogues'); if (viewMode !== 'review_dialogues') updateReviewStatus('dialogues'); }}
              className={`px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-sm transition-all flex items-center gap-2 border ${viewMode === 'review_dialogues' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-100 hover:border-slate-300'}`}
            >
              对话复习
            </button>
          </nav>
        </header>

        {viewMode === 'normal' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
            
            <aside className="xl:col-span-4 space-y-10">
              <Dashboard stats={stats} />
              
              <section className="bg-white border border-slate-100 rounded-[40px] p-10 shadow-sm">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-3">
                  <div className="p-1 bg-slate-100 rounded">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeWidth="3" strokeLinecap="round"/></svg>
                  </div>
                  添加新词
                </h3>
                <textarea
                  className="w-full h-48 p-6 border border-slate-50 rounded-[32px] focus:ring-8 focus:ring-blue-50/50 outline-none text-slate-700 font-bold resize-none bg-slate-50/30 transition-all placeholder:text-slate-300 text-base leading-relaxed"
                  placeholder="粘贴新单词... (已学的会自动跳过)"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                />
                <div className="mt-8 flex flex-col gap-4">
                  <button
                    onClick={() => handleProcess(inputText.split(/,|\n/).map(w => w.trim()).filter(w => w.length > 0))}
                    disabled={isLoading || !inputText.trim()}
                    className="w-full bg-blue-600 text-white py-5 rounded-[24px] hover:bg-blue-700 transition-all disabled:opacity-50 font-black shadow-2xl shadow-blue-100 flex items-center justify-center gap-3 text-sm uppercase tracking-widest"
                  >
                    {isLoading ? <span className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></span> : null}
                    {isLoading ? 'Processing' : 'Add to Plan'}
                  </button>
                  <div className="grid grid-cols-2 gap-4">
                    <button onClick={handleFetchHighFreqWords} disabled={isLoading} className="py-4 rounded-[20px] border border-slate-100 bg-white text-slate-600 text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors disabled:opacity-50">
                      High-Freq
                    </button>
                    <button onClick={handleGenerateDialogue} disabled={isLoading} className="py-4 rounded-[20px] border border-slate-100 bg-white text-slate-600 text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors disabled:opacity-50">
                      Scenario
                    </button>
                  </div>
                </div>
                {error && <p className="mt-6 text-[11px] text-red-500 font-bold bg-red-50/50 p-4 rounded-2xl border border-red-50 animate-in fade-in">{error}</p>}
              </section>
            </aside>

            <main className="xl:col-span-8 space-y-12">
              <Calendar 
                records={records} 
                dialogues={savedDialogues} 
                reviewStatus={reviewStatus}
                selectedDate={selectedDate} 
                onSelectDate={setSelectedDate} 
              />

              {currentDialogue && (
                <div className="bg-white border border-blue-100 rounded-[48px] p-12 shadow-2xl shadow-blue-50/50 relative animate-in slide-in-from-right-10 duration-700 overflow-hidden" onDoubleClick={handleWordDoubleClick}>
                  <div className="absolute top-0 left-0 w-3 h-full bg-blue-500"></div>
                  <button onClick={() => setCurrentDialogue(null)} className="absolute top-8 right-8 text-slate-300 hover:text-slate-500 transition-colors p-3 hover:bg-slate-50 rounded-full">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2.5"/></svg>
                  </button>
                  <h2 className="text-3xl font-black text-slate-900 mb-4">场景对话：{currentDialogue.title}</h2>
                  <p className="text-[11px] font-black text-blue-500 mb-12 flex items-center gap-3">
                    <span className="p-1.5 bg-blue-50 rounded-lg">PRO TIP</span>
                    <span>Double Click Any Word to Translate</span>
                  </p>
                  <div className="space-y-10">
                    {currentDialogue.lines.map((line, i) => (
                      <div key={i} className="flex gap-10 group">
                        <span className="font-black text-sm text-slate-200 w-8 pt-1.5 shrink-0 group-hover:text-blue-300 transition-colors text-right">{line.speaker}</span>
                        <div className="flex-1">
                          <div className="flex items-start gap-6">
                            <p className="text-slate-800 text-xl leading-relaxed flex-1 select-text font-bold tracking-tight">{line.text}</p>
                            <button onClick={() => handlePlay(line.text)} className="text-slate-200 hover:text-blue-500 shrink-0 p-2 rounded-full hover:bg-blue-50 transition-all">
                              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M11 5 6 9 2 9 2 15 6 15 11 19 11 5Z"/></svg>
                            </button>
                          </div>
                          <p className="text-base text-slate-400 mt-3 font-medium">{line.translation}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-8">
                <div className="flex justify-between items-center px-6">
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.4em]">
                    {selectedDate.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })} 的学习历程
                  </h3>
                  {filteredRecords.length > 0 && (
                    <button onClick={handleClearDay} className="text-[11px] text-slate-300 hover:text-red-500 flex items-center gap-2 transition-all font-black uppercase tracking-widest px-4 py-2 rounded-xl hover:bg-red-50">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      Clear
                    </button>
                  )}
                </div>
                
                {filteredRecords.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-16">
                    {filteredRecords.map((record) => (
                      <WordCard key={record.id} record={record} onPlay={handlePlay} onDelete={(id) => setRecords(prev => prev.filter(r => r.id !== id))} />
                    ))}
                  </div>
                ) : (
                  <div className="py-40 text-center text-slate-300 border-[3px] border-dashed border-slate-50 rounded-[60px] bg-white/40">
                    <p className="text-lg font-bold tracking-tight">暂无数据 · 快去开启今日学习吧</p>
                  </div>
                )}
              </div>
            </main>
          </div>
        )}

        {viewMode === 'review_words' && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-5 duration-500">
            <div className="bg-slate-900 text-white p-12 rounded-[48px] shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
              <div className="relative z-10">
                <h2 className="text-4xl font-black flex items-center gap-4">
                  <div className="p-2 bg-blue-500 rounded-2xl">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  </div>
                  单词深度复习
                </h2>
                <p className="text-slate-400 text-lg mt-3 font-medium">看词识义 · 查缺补漏</p>
              </div>
              <button onClick={() => setViewMode('normal')} className="px-8 py-4 rounded-2xl bg-white/10 text-white text-[11px] font-black uppercase tracking-widest hover:bg-white/20 transition-all relative z-10 border border-white/10">Exit Review</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {records.map((record) => (
                <WordCard key={record.id} record={record} onPlay={handlePlay} onDelete={(id) => setRecords(prev => prev.filter(r => r.id !== id))} minimal={true} />
              ))}
            </div>
            {records.length === 0 && <div className="py-40 text-center text-slate-300 bg-white rounded-[60px] border border-slate-100 shadow-sm"><p className="text-2xl font-light tracking-tight">词库已清空，全掌握达成！</p></div>}
          </div>
        )}

        {viewMode === 'review_dialogues' && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-5 duration-500">
            <div className="bg-emerald-900 text-white p-12 rounded-[48px] shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
              <div className="relative z-10">
                <h2 className="text-4xl font-black flex items-center gap-4">
                  <div className="p-2 bg-emerald-500 rounded-2xl">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                  </div>
                  情景对话温故
                </h2>
                <p className="text-emerald-200/60 text-lg mt-3 font-medium">结合场景 · 还原表达</p>
              </div>
              <button onClick={() => setViewMode('normal')} className="px-8 py-4 rounded-2xl bg-white/10 text-white text-[11px] font-black uppercase tracking-widest hover:bg-white/20 transition-all relative z-10 border border-white/10">Exit Review</button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {savedDialogues.map((dlg) => (
                <div key={dlg.id} className="bg-white border border-slate-200 rounded-[48px] p-12 relative shadow-sm group hover:border-emerald-200 transition-all hover:shadow-2xl hover:shadow-emerald-50/50">
                  <button onClick={() => handleDeleteDialogue(dlg.id)} className="absolute top-10 right-10 text-slate-200 hover:text-red-500 transition-all p-3 hover:bg-red-50 rounded-full">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                  <h3 className="text-3xl font-black text-slate-800 mb-12 pr-16">{dlg.title}</h3>
                  <div className="space-y-12">
                    {dlg.lines.map((line, idx) => {
                      const isRevealed = revealedDialogueIds.has(`${dlg.id}_${idx}`);
                      return (
                        <div key={idx} className="flex gap-8 border-l-4 border-slate-50 pl-8 group/line hover:border-emerald-100 transition-all">
                          <span className="font-black text-xs text-slate-200 w-4 pt-1.5 shrink-0 uppercase tracking-tighter">{line.speaker}</span>
                          <div className="flex-1">
                            <p className="text-slate-500 italic text-xl mb-5 leading-relaxed font-bold tracking-tight">"{line.translation}"</p>
                            {isRevealed ? (
                              <div className="bg-slate-50 p-6 rounded-3xl animate-in slide-in-from-left-4 duration-500 border border-slate-100 shadow-inner">
                                <div className="flex items-start gap-6">
                                  <p className="text-slate-900 text-xl leading-relaxed flex-1 font-black tracking-tight">{line.text}</p>
                                  <button onClick={() => handlePlay(line.text)} className="text-blue-500 hover:text-blue-700 p-2.5 bg-white rounded-2xl shadow-xl border border-slate-100 transition-all active:scale-95">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M11 5 6 9 2 9 2 15 6 15 11 19 11 5Z"/></svg>
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button 
                                onClick={() => toggleRevealDialogue(`${dlg.id}_${idx}`)}
                                className="text-[11px] font-black text-emerald-600 hover:text-white transition-all bg-emerald-50 px-6 py-3 rounded-2xl border border-emerald-100 hover:bg-emerald-600 hover:border-emerald-600 shadow-sm uppercase tracking-widest"
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
              {savedDialogues.length === 0 && <div className="col-span-full py-40 text-center text-slate-300 bg-white rounded-[60px] border border-slate-100"><p className="text-xl font-light">还没有保存的对话呢。</p></div>}
            </div>
          </div>
        )}

        <footer className="mt-40 py-20 text-center border-t border-slate-50">
          <div className="inline-block px-6 py-3 bg-slate-50 rounded-[20px] border border-slate-100 shadow-sm">
            <p className="text-xs text-slate-400 font-black uppercase tracking-[0.6em]">欧大宝专属 · 极致高效工作区</p>
          </div>
          <p className="mt-6 text-[11px] text-slate-300 font-bold uppercase tracking-widest">Powered by Gemini Flash 3 · Precision & Innovation</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
