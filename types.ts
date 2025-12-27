
export interface WordRecord {
  id: string;
  word: string;
  wordTranslation: string;
  phonetic: string;
  sentence: string;
  sentenceTranslation: string;
  timestamp: number;
}

export interface DialogueLine {
  speaker: string;
  text: string;
  translation: string;
}

export interface Dialogue {
  id: string;
  title: string;
  lines: DialogueLine[];
  timestamp: number;
}

export interface WordLookup {
  word: string;
  phonetic: string;
  translation: string;
}

export interface ReviewStatus {
  [dateKey: string]: {
    wordsReviewed: boolean;
    dialoguesReviewed: boolean;
  };
}

export interface StudyStats {
  todayCount: number;
  monthCount: number;
}

export interface GeminiWordResponse {
  word: string;
  wordTranslation: string;
  phonetic: string;
  sentence: string;
  sentenceTranslation: string;
}
