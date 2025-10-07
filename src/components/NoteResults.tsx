'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { saveNoteToDatabase, isSupabaseConfigured } from '@/lib/supabase-client';

interface NoteResultsProps {
  transcription: string;
  summary: string;
  keyPoints: string[];
  actionItems: string[];
  audioUrl?: string | null;
  onSaveComplete?: () => void;
  onNewNote: () => void;
}

const baseCardClasses =
  'relative rounded-3xl border border-white/70 bg-white/85 p-8 shadow-xl shadow-purple-200/40 backdrop-blur-xl';

export default function NoteResults({
  transcription,
  summary,
  keyPoints,
  actionItems,
  audioUrl,
  onSaveComplete,
  onNewNote,
}: NoteResultsProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!isSupabaseConfigured()) {
      alert(
        'Supabase is not configured.\n\nUpdate .env.local with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then restart the dev server.',
      );
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const savedNote = await saveNoteToDatabase({
        transcription,
        summary,
        key_points: keyPoints,
        action_items: actionItems,
        audio_url: audioUrl || undefined,
      });

      console.log('Note saved successfully:', savedNote);
      setIsSaved(true);
      if (onSaveComplete) onSaveComplete();

      router.push('/notes');
    } catch (error) {
      console.error('Error saving note:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      setSaveError(message);
      alert(
        `Failed to save note.\n\n${message}\n\nCheck your Supabase credentials, run the SQL schema, and verify the project is active.`,
      );
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = () => {
    const text = `
SUMMARY
${summary}

KEY POINTS
${keyPoints.map((point, index) => `${index + 1}. ${point}`).join('\n')}

ACTION ITEMS
${actionItems.map((item, index) => `${index + 1}. ${item}`).join('\n')}

FULL TRANSCRIPTION
${transcription}
    `.trim();

    navigator.clipboard.writeText(text);
    alert('Note copied to clipboard.');
  };

  const toggleActionItem = (index: number) => {
    setCheckedItems((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const statusLabel = (() => {
    if (isSaving) return 'Saving note...';
    if (isSaved) return 'Note saved to Supabase.';
    if (saveError) return 'Save failed. Try again.';
    return 'Store this note or copy the highlights.';
  })();

  const statusTone = isSaving
    ? 'text-blue-600 border-blue-200 bg-blue-50/70'
    : isSaved
    ? 'text-emerald-600 border-emerald-200 bg-emerald-50/70'
    : saveError
    ? 'text-rose-600 border-rose-200 bg-rose-50/70'
    : 'text-slate-600 border-slate-200 bg-white/60';

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative mx-auto max-w-5xl space-y-10 text-slate-900"
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-32 top-24 h-72 w-72 rounded-full bg-gradient-to-br from-purple-400/30 via-blue-300/20 to-transparent blur-3xl" />
        <div className="absolute right-[-10%] top-1/2 h-80 w-80 rounded-full bg-gradient-to-br from-pink-300/30 via-transparent to-transparent blur-3xl" />
      </div>

      <section className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-xl shadow-purple-200/50 backdrop-blur-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className={`flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold ${statusTone}`}>
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-current" />
            {statusLabel}
          </div>
          <div className="flex flex-wrap justify-end gap-3">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-all ${
                isSaved
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-400/40'
                  : saveError
                  ? 'bg-gradient-to-r from-rose-500 to-rose-600 shadow-lg shadow-rose-400/40'
                  : 'bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-600 shadow-lg shadow-purple-400/40 hover:shadow-purple-400/60'
              } disabled:cursor-not-allowed disabled:opacity-70`}
            >
              <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} stroke="currentColor" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 7h14M5 12h14m-9 5h9" />
              </svg>
              {isSaving ? 'Saving...' : isSaved ? 'Saved' : saveError ? 'Try Again' : 'Save to Supabase'}
            </button>
            <button
              onClick={copyToClipboard}
              className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-white/80 px-5 py-2.5 text-sm font-semibold text-purple-600 shadow-sm transition-all hover:border-purple-300 hover:shadow-md"
            >
              <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} stroke="currentColor" className="h-4 w-4">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 16h10a2 2 0 002-2V6a2 2 0 00-2-2h-6l-4 4v6a2 2 0 002 2zm-2 4h10"
                />
              </svg>
              Copy note
            </button>
            <button
              onClick={onNewNote}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-5 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition-all hover:border-slate-300 hover:text-slate-800 hover:shadow-md"
            >
              <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} stroke="currentColor" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
              </svg>
              New note
            </button>
          </div>
        </div>
      </section>

      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className={baseCardClasses}
      >
        <header className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/15 via-indigo-500/10 to-blue-500/20 text-purple-600">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 6.75h15m-15 4.5h15m-15 4.5h10.5" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Summary</p>
            <h2 className="text-lg font-semibold text-slate-900">Conversation snapshot</h2>
          </div>
        </header>
        <p className="mt-5 text-base leading-relaxed text-slate-700">{summary}</p>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className={`${baseCardClasses} shadow-blue-200/50`}
      >
        <header className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/15 via-sky-500/10 to-cyan-500/20 text-blue-600">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19.5V4.5m0 0L4.5 12m7.5-7.5L19.5 12" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Key points</p>
            <h2 className="text-lg font-semibold text-slate-900">Highlights to remember</h2>
          </div>
        </header>
        <ul className="mt-5 space-y-3">
          {keyPoints.length > 0 ? (
            keyPoints.map((point, index) => (
              <motion.li
                key={`${index}-key-point`}
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 + index * 0.05 }}
                className="flex items-start gap-3 rounded-2xl border border-blue-100/70 bg-white/80 p-4 shadow-sm"
              >
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-sm font-semibold text-blue-600">
                  {index + 1}
                </span>
                <span className="text-sm leading-relaxed text-slate-700">{point}</span>
              </motion.li>
            ))
          ) : (
            <li className="rounded-2xl border border-dashed border-blue-200 bg-white/60 p-4 text-sm text-slate-500">
              No key points were generated for this note.
            </li>
          )}
        </ul>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className={`${baseCardClasses} shadow-emerald-200/50`}
      >
        <header className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-lime-500/20 text-emerald-600">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Action items</p>
            <h2 className="text-lg font-semibold text-slate-900">Next steps to follow through</h2>
          </div>
        </header>
        <ul className="mt-5 space-y-3">
          {actionItems.length > 0 ? (
            actionItems.map((item, index) => (
              <motion.li
                key={`${index}-action-item`}
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.45 + index * 0.05 }}
                className="flex items-start gap-3 rounded-2xl border border-emerald-100/70 bg-white/80 p-4 shadow-sm"
              >
                <input
                  type="checkbox"
                  checked={checkedItems[index] || false}
                  onChange={() => toggleActionItem(index)}
                  className="mt-1 h-5 w-5 rounded border-emerald-200 text-emerald-600 focus:ring-emerald-400"
                />
                <span
                  className={`text-sm leading-relaxed transition-all ${
                    checkedItems[index] ? 'text-slate-400 line-through' : 'text-slate-700'
                  }`}
                >
                  {item}
                </span>
              </motion.li>
            ))
          ) : (
            <li className="rounded-2xl border border-dashed border-emerald-200 bg-white/60 p-4 text-sm text-slate-500">
              No action items were detected for this note.
            </li>
          )}
        </ul>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className={`${baseCardClasses} shadow-slate-200/60`}
      >
        <header className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-500/15 via-slate-500/10 to-slate-500/20 text-slate-700">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 9.75h15m-15 4.5h15" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Full transcription</p>
            <h2 className="text-lg font-semibold text-slate-900">Complete conversation</h2>
          </div>
        </header>
        <p className="mt-5 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{transcription}</p>
      </motion.section>

      {audioUrl && (
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className={`${baseCardClasses} shadow-blue-200/60`}
        >
          <header className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/15 via-indigo-500/10 to-blue-500/15 text-purple-600">
              <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 5v14l12-7-12-7zm16 0v14" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Original recording</p>
              <h2 className="text-lg font-semibold text-slate-900">Replay captured audio</h2>
            </div>
          </header>
          <audio controls className="mt-5 w-full rounded-2xl border border-purple-200/60 bg-white/80 p-3 shadow-inner">
            <source src={audioUrl} type="audio/webm" />
            Your browser does not support the audio element.
          </audio>
        </motion.section>
      )}
    </motion.div>
  );
}
