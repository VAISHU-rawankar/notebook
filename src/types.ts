export interface Attachment {
  id: string;
  entry_id: string;
  file_url: string;
  file_type: 'image' | 'video' | 'audio' | 'file';
  file_name: string;
}

export interface JournalEntry {
  id: string;
  content: string;
  mood?: string | null;
  created_at: string;
  updated_at: string;
  attachments?: Attachment[];
}

export type View = 'dashboard' | 'editor' | 'settings';
