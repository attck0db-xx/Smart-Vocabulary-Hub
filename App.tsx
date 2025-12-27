
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
    
    // 逻辑优化：自动忽略已学习过的单词
    const existingWords = new Set(records.map(r => r.word.toLowerCase()));
    const uniqueWords = words.filter(w => !existingWords.has(w.toLowerCase()));
    
    if (uniqueWords.length === 0) {
      setError("输入的所有单词都已在学习计划中，无需重复添加。");
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
      setError("解析失败，请检查网络或 API 配置。");
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
    <div className="max-w-2xl mx-auto px-4 py-12 md:py-20 bg-[#F9FAFB] min-h-screen relative font-sans text-slate-800" onClick={() => setLookup(null)}>
      {/* Word Lookup Popup - Improved Glassmorphism */}
      {lookup && (
        <div 
          className="fixed z-50 bg-white/90 backdrop-blur-md border border-slate-200 shadow-2xl rounded-xl p-4 text-sm animate-in zoom-in-95 duration-200"
          style={{ top: Math.min(window.innerHeight - 150, lookup.y - 100), left: Math.min(window.innerWidth - 200, lookup.x) }}
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="font-bold text-slate-900 text-base">{lookup.data.word}</span>
            <span className="text-slate-400 font-mono text-xs px-2 py-0.5 bg-slate-100 rounded">{lookup.data.phonetic}</span>
            <button onClick={() => handlePlay(lookup.data.word)} className="text-blue-500 hover:text-blue-700 p-1 rounded-full hover:bg-blue-50">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M11 5 6 9 2 9 2 15 6 15 11 19 11 5Z"/></svg>
            </button>
          </div>
          <div className="text-slate-600 border-t border-slate-100 pt-2">{lookup.data.translation}</div>
        </div>
      )}

      <header className="mb-12 text-center">
        <div className="inline-block px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4">Dashboard</div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">欧大宝专属单词打卡神器</h1>
        <p className="text-slate-400 font-light italic">Smart Vocabulary Hub & Daily Companion</p>
      </header>

      <div className="flex flex-wrap gap-2 mb-8 justify-center">
        <button 
          onClick={() => setViewMode(viewMode === 'review_words' ? 'normal' : 'review_words')}
          className={`px-5 py-2.5 rounded-full border text-xs font-semibold shadow-sm transition-all flex items-center gap-2 ${viewMode === 'review_words' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400'}`}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
          {viewMode === 'review_words' ? '退出单词复习' : '单词复习'}
        </button>
        <button 
          onClick={() => setViewMode(viewMode === 'review_dialogues' ? 'normal' : 'review_dialogues')}
          className={`px-5 py-2.5 rounded-full border text-xs font-semibold shadow-sm transition-all flex items-center gap-2 ${viewMode === 'review_dialogues' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400'}`}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
          {viewMode === 'review_dialogues' ? '退出对话复习' : '对话复习'}
        </button>
        {viewMode === 'normal' && (
          <>
            <button 
              onClick={handleFetchHighFreqWords}
              disabled={isLoading}
              className="px-5 py-2.5 rounded-full border bg-white text-slate-600 border-slate-200 hover:border-blue-400 text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              生活常用词 (30)
            </button>
            <button 
              onClick={handleGenerateDialogue}
              disabled={isLoading}
              className="px-5 py-2.5 rounded-full border bg-white text-slate-600 border-slate-200 hover:border-blue-400 text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
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
          
          <section className="bg-white border border-slate-200 rounded-2xl p-6 mb-10 shadow-sm transition-shadow hover:shadow-md">
            <textarea
              className="w-full h-28 p-4 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none text-slate-700 font-light resize-none bg-slate-50/50 transition-all placeholder:text-slate-300"
              placeholder="粘贴新单词，逗号或换行分隔... (已学过的单词将自动跳过)"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <div className="mt-4 flex justify-between items-center">
              <span className="text-[10px] text-slate-400">已自动过滤重复内容</span>
              <button
                onClick={() => handleProcess(inputText.split(/,|\n/).map(w => w.trim()).filter(w => w.length > 0))}
                disabled={isLoading || !inputText.trim()}
                className="bg-blue-600 text-white px-8 py-2.5 rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 font-bold shadow-lg shadow-blue-200"
              >
                {isLoading ? '解析中...' : '开始学习'}
              </button>
            </div>
            {error && <p className="mt-3 text-xs text-red-500 bg-red-50 p-2 rounded-lg border border-red-100">{error}</p>}
          </section>

          {currentDialogue && (
            <div 
              className="bg-white border border-blue-100 rounded-2xl p-7 mb-10 shadow-xl shadow-blue-50 relative animate-in slide-in-from-top-4 duration-500 overflow-hidden"
              onDoubleClick={handleWordDoubleClick}
            >
              <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
              <button onClick={() => setCurrentDialogue(null)} className="absolute top-3 right-3 text-slate-300 hover:text-slate-500 transition-colors p-1">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2"/></svg>
              </button>
              <h2 className="text-xl font-bold text-slate-900 mb-5 flex items-center gap-3">
                <span className="p-2 bg-blue-50 rounded-lg text-blue-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
                </span>
                场景：{currentDialogue.title}
              </h2>
              <p className="text-[11px] font-medium text-blue-500 mb-6 flex items-center gap-1.5">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                提示：双击单词即时翻译
              </p>
              <div className="space-y-6">
                {currentDialogue.lines.map((line, i) => (
                  <div key={i} className="flex gap-5 group">
                    <span className="font-black text-xs text-slate-200 w-4 pt-1 shrink-0 group-hover:text-blue-200 transition-colors">{line.speaker}</span>
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        <p className="text-slate-800 text-base leading-relaxed flex-1 select-text font-medium">{line.text}</p>
                        <button onClick={() => handlePlay(line.text)} className="text-slate-300 hover:text-blue-500 shrink-0 p-1 rounded-full hover:bg-slate-50 transition-all">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M11 5 6 9 2 9 2 15 6 15 11 19 11 5Z"/></svg>
                        </button>
                      </div>
                      <p className="text-sm text-slate-400 mt-2 font-light">{line.translation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex justify-between items-center px-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">
                {selectedDate.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
              </h3>
              {filteredRecords.length > 0 && (
                <button onClick={handleClearDay} className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1.5 transition-colors font-medium">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  清空当日
                </button>
              )}
            </div>
            <div className="space-y-3">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((record) => (
                  <WordCard key={record.id} record={record} onPlay={handlePlay} onDelete={(id) => setRecords(prev => prev.filter(r => r.id !== id))} />
                ))
              ) : (
                <div className="py-24 text-center text-slate-300 border-2 border-dashed border-slate-100 rounded-3xl bg-white/50">
                  <p className="text-sm font-light">今日尚无单词记录，快去学习吧！</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {viewMode === 'review_words' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2"/></svg>
              单词自主复习
            </h2>
            <p className="text-slate-400 text-xs mt-2">点击 "Show" 查阅翻译，掌握后点击右上角删除键移出词库。</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {records.map((record) => (
              <WordCard key={record.id} record={record} onPlay={handlePlay} onDelete={(id) => setRecords(prev => prev.filter(r => r.id !== id))} minimal={true} />
            ))}
          </div>
          {records.length === 0 && <div className="py-20 text-center text-slate-300 bg-white rounded-3xl border border-slate-100"><p>词库已清空，太棒了！</p></div>}
        </div>
      )}

      {viewMode === 'review_dialogues' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="bg-emerald-900 text-white p-6 rounded-2xl shadow-xl">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" strokeWidth="2"/></svg>
              对话深度复习
            </h2>
            <p className="text-emerald-200/60 text-xs mt-2 font-light">看着中文想英文，点击 "Show English" 验证成果。</p>
          </div>
          <div className="space-y-8">
            {savedDialogues.map((dlg) => (
              <div key={dlg.id} className="bg-white border border-slate-200 rounded-2xl p-8 relative shadow-sm group hover:border-emerald-200 transition-all">
                <button onClick={() => handleDeleteDialogue(dlg.id)} className="absolute top-5 right-5 text-slate-300 hover:text-red-500 transition-all p-1 hover:bg-red-50 rounded-full">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2"/></svg>
                </button>
                <h3 className="text-xl font-bold text-slate-800 mb-8 pr-10">{dlg.title}</h3>
                <div className="space-y-8">
                  {dlg.lines.map((line, idx) => {
                    const isRevealed = revealedDialogueIds.has(`${dlg.id}_${idx}`);
                    return (
                      <div key={idx} className="flex gap-5 border-l-2 border-slate-50 pl-5 hover:border-emerald-100 transition-all">
                        <span className="font-black text-xs text-slate-200 w-4 pt-1 shrink-0">{line.speaker}</span>
                        <div className="flex-1">
                          <p className="text-slate-500 italic text-base mb-3 leading-relaxed">"{line.translation}"</p>
                          {isRevealed ? (
                            <div className="bg-slate-50 p-4 rounded-xl animate-in slide-in-from-left-2 duration-300 border border-slate-100">
                              <div className="flex items-start gap-3">
                                <p className="text-slate-900 text-base leading-relaxed flex-1 font-semibold">{line.text}</p>
                                <button onClick={() => handlePlay(line.text)} className="text-blue-500 hover:text-blue-700 p-1 bg-white rounded-full shadow-sm border border-slate-100">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M11 5 6 9 2 9 2 15 6 15 11 19 11 5Z"/></svg>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button 
                              onClick={() => toggleRevealDialogue(`${dlg.id}_${idx}`)}
                              className="text-xs font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1.5 transition-all bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100"
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
            {savedDialogues.length === 0 && <div className="py-24 text-center text-slate-300 bg-white rounded-3xl border border-slate-100"><p>尚无保存的对话数据。</p></div>}
          </div>
        </div>
      )}

      <footer className="mt-24 py-12 text-center border-t border-slate-100">
        <p className="text-[10px] text-slate-300 uppercase tracking-[0.4em] font-black">Minimalist Language Tool • Powered by Gemini Flash 3</p>
      </footer>
    </div>
  );
};

export default App;
