import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Check if Supabase is configured
export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl &&
         supabaseAnonKey &&
         supabaseUrl !== 'https://placeholder.supabase.co' &&
         supabaseAnonKey !== 'placeholder-key' &&
         !supabaseUrl.includes('placeholder'));
};

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key'
);

export type Note = {
  id: string;
  user_id?: string;
  audio_url?: string;
  transcription: string;
  summary: string;
  key_points: string[];
  action_items: string[];
  created_at: string;
};

// Helper function to upload audio file to Supabase Storage
export async function uploadAudioFile(audioBlob: Blob, fileName: string): Promise<string | null> {
  try {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured, skipping audio upload');
      return null;
    }

    // Convert blob to file
    const file = new File([audioBlob], fileName, { type: audioBlob.type });
    
    // Upload to Supabase Storage bucket 'audio-notes'
    const { data, error } = await supabase.storage
      .from('audio-notes')
      .upload(`recordings/${Date.now()}-${fileName}`, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Error uploading audio:', error);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('audio-notes')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Failed to upload audio:', error);
    return null;
  }
}

// Helper function to save note to database
export async function saveNoteToDatabase(note: Omit<Note, 'id' | 'created_at'>) {
  try {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please set up your .env.local file with Supabase credentials.');
    }

    const { data, error } = await supabase
      .from('notes')
      .insert([
        {
          ...note,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      throw new Error(`Failed to save note: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error in saveNoteToDatabase:', error);
    throw error;
  }
}

// Helper function to fetch all notes
export async function fetchAllNotes(): Promise<Note[]> {
  try {
    if (!isSupabaseConfigured()) {
      return [];
    }

    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notes:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchAllNotes:', error);
    return [];
  }
}

