'use client';

import { useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { fetchAllNotes, isSupabaseConfigured, Note, supabase } from '@/lib/supabase-client';
import SetupWarning from '@/components/SetupWarning';

type NoteMetric = {
  label: string;
  primary: string;
  helper: string;
};

const shimmerVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  useEffect(() => {
    void fetchNotes();
  }, []);

  useEffect(() => {
    if (!isLoading && notes.length > 0 && !selectedNote) {
      setSelectedNote(notes[0]);
    }
  }, [isLoading, notes, selectedNote]);

  const fetchNotes = async () => {
    try {
      if (!isSupabaseConfigured()) {
        console.warn('Supabase not configured, skipping notes fetch');
        setNotes([]);
        setIsLoading(false);
        return;
      }

      const data = await fetchAllNotes();
      setNotes(data);
    } catch (error) {
      console.error('Error fetching notes:', error);
      setNotes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const deleteNote = async (id: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      const { error } = await supabase.from('notes').delete().eq('id', id);

      if (error) throw error;

      setNotes(prev => prev.filter(note => note.id !== id));
      setSelectedNote(prev => (prev?.id === id ? null : prev));
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Failed to delete note');
    }
  };

  const handleNoteKeyDown = (event: KeyboardEvent<HTMLDivElement>, note: Note) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setSelectedNote(note);
    }
  };

  const metrics: NoteMetric[] = useMemo(() => {
    const totalNotes = notes.length;
    const totalKeyPoints = notes.reduce((sum, note) => sum + (note.key_points?.length ?? 0), 0);
    const totalActionItems = notes.reduce((sum, note) => sum + (note.action_items?.length ?? 0), 0);
    const averageKeyPoints = totalNotes ? (totalKeyPoints / totalNotes).toFixed(1) : '0.0';
    const lastUpdated = notes[0]?.created_at ? formatDate(notes[0].created_at) : 'Awaiting first note';

    return [
      {
        label: 'Notes archived',
        primary: totalNotes.toString().padStart(2, '0'),
        helper: totalNotes ? `Latest captured ${lastUpdated}` : 'Capture your first voice note',
      },
      {
        label: 'Key points surfaced',
        primary: totalKeyPoints.toString().padStart(2, '0'),
        helper: totalNotes ? `Average highlights per note ${averageKeyPoints}` : 'Summaries ready in seconds',
      },
      {
        label: 'Action items tracked',
        primary: totalActionItems.toString().padStart(2, '0'),
        helper: totalNotes ? 'Keeps your follow-ups organised' : 'Turn insight into action fast',
      },
    ];
  }, [notes]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f6f7ff] text-slate-900">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-x-0 top-[-35%] h-[520px] bg-gradient-to-b from-purple-200/70 via-transparent to-transparent blur-3xl" />
        <div className="absolute left-[-18%] top-20 h-[420px] w-[420px] rounded-full bg-gradient-to-br from-purple-400/40 via-blue-300/25 to-transparent blur-3xl" />
        <div className="absolute right-[-15%] bottom-16 h-[480px] w-[480px] rounded-full bg-gradient-to-br from-pink-300/35 via-transparent to-transparent blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.9),_rgba(255,255,255,0))]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="group flex items-center gap-4">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-500 text-white shadow-lg shadow-purple-500/40 transition-transform group-hover:scale-105">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                className="h-6 w-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 18.75a5.25 5.25 0 005.25-5.25V9a5.25 5.25 0 10-10.5 0v4.5A5.25 5.25 0 0012 18.75z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 9v3m7.5-3v3m-3.75 6v3m0 0h3m-3 0h-3"
                />
              </svg>
              <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-emerald-400 shadow-sm shadow-emerald-200/80" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Echo Notes</p>
              <p className="text-base font-semibold text-slate-900">Your library of captured insights</p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full border border-purple-200 bg-white/60 px-3 py-1 text-xs font-semibold text-purple-600 shadow-sm shadow-purple-200/70 sm:inline-flex">
              Synced securely with Supabase
            </span>
            <Link
              href="/"
              className="group inline-flex items-center gap-2 rounded-full border border-transparent bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/30 transition-all hover:shadow-purple-500/50"
            >
              <span>New Note</span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                strokeWidth={1.8}
                stroke="currentColor"
                className="h-4 w-4 transition-transform group-hover:translate-x-1"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m0 0l-6-6m6 6l-6 6" />
              </svg>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 lg:px-8">
        <div className="space-y-16">
          <section className="mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-white/60 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-purple-600 shadow-md shadow-purple-200/60">
              <span className="h-2 w-2 rounded-full bg-purple-500 shadow-[0_0_0_3px_rgba(168,85,247,0.25)]" />
              Notes Dashboard
            </div>
            <h1 className="mt-6 text-4xl font-bold leading-tight text-slate-900 sm:text-5xl">
              Your voice notes, beautifully organised
            </h1>
            <p className="mt-4 text-lg text-slate-600 sm:text-xl">
              Review every conversation, extract instant context, and jump back into the work that matters most.
            </p>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-2xl border border-white/70 bg-white/70 p-5 shadow-lg shadow-purple-200/40 backdrop-blur-xl"
                >
                  <p className="text-3xl font-semibold text-slate-900">{metric.primary}</p>
                  <p className="text-sm font-medium text-slate-500">{metric.label}</p>
                  <p className="mt-1 text-xs font-semibold text-purple-600">{metric.helper}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="mx-auto max-w-4xl">
            <SetupWarning />
          </div>

          {isLoading ? (
            <motion.div
              className="flex items-center justify-center py-32"
              initial="initial"
              animate="animate"
              variants={shimmerVariants}
              transition={{ duration: 0.6 }}
            >
              <div className="relative h-16 w-16">
                <div className="absolute inset-0 rounded-full border-4 border-purple-500/40" />
                <div className="absolute inset-0 rounded-full border-t-4 border-purple-500 animate-spin" />
              </div>
            </motion.div>
          ) : notes.length === 0 ? (
            <motion.div
              className="mx-auto max-w-3xl rounded-3xl border border-white/70 bg-white/80 px-12 py-16 text-center shadow-xl shadow-purple-200/50 backdrop-blur-xl"
              initial="initial"
              animate="animate"
              variants={shimmerVariants}
              transition={{ duration: 0.6 }}
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/15 via-indigo-500/10 to-blue-500/15 text-purple-600">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.6} stroke="currentColor" className="h-8 w-8">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v12m-6-6h12m2 0a8 8 0 11-16 0 8 8 0 0116 0z"
                  />
                </svg>
              </div>
              <h2 className="mt-6 text-2xl font-semibold text-slate-900">
                {isSupabaseConfigured() ? 'No notes yet' : 'Setup required'}
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                {isSupabaseConfigured()
                  ? 'Record your first voice note to start building a searchable knowledge base.'
                  : 'Configure Supabase to archive and sync your notes securely across devices.'}
              </p>
              <Link
                href="/"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-600 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/40 transition-all hover:shadow-purple-500/60"
              >
                Create a note
                <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} stroke="currentColor" className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m0 0l-6-6m6 6l-6 6" />
                </svg>
              </Link>
            </motion.div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
              {/* Notes List */}
              <div className="space-y-4">
                {notes.map((note, index) => {
                  const isActive = selectedNote?.id === note.id;
                  return (
                    <motion.div
                      key={note.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => setSelectedNote(note)}
                      onKeyDown={(event) => handleNoteKeyDown(event, note)}
                      role="button"
                      tabIndex={0}
                      aria-pressed={isActive}
                      className={`group relative w-full overflow-hidden rounded-3xl border p-6 text-left shadow-lg transition-all ${
                        isActive
                          ? 'border-purple-500/50 bg-gradient-to-br from-purple-500/10 via-white/90 to-blue-500/10 shadow-purple-300/60'
                          : 'border-white/70 bg-white/75 hover:border-purple-300/70 hover:shadow-xl hover:shadow-purple-200/60'
                      } backdrop-blur-xl`}
                    >
                      <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-gradient-to-br from-purple-400/20 via-transparent to-transparent blur-3xl" />
                      <div className="relative flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">{formatDate(note.created_at)}</p>
                          <h3 className="mt-2 text-lg font-semibold text-slate-900">
                            {note.summary.slice(0, 68)}
                            {note.summary.length > 68 ? '...' : ''}
                          </h3>
                        </div>
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            void deleteNote(note.id);
                          }}
                          className="flex h-9 w-9 items-center justify-center rounded-full border border-red-100 bg-white/70 text-red-500 shadow-sm transition-all hover:border-red-200 hover:text-red-600"
                          aria-label="Delete note"
                        >
                          <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.7} stroke="currentColor" className="h-5 w-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M9 7V4h6v3m2 0v13H7V7h10z" />
                          </svg>
                        </button>
                      </div>
                      <p className="relative mt-4 line-clamp-3 text-sm text-slate-600">{note.summary}</p>
                      <div className="relative mt-6 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500">
                        <span className="inline-flex items-center gap-1 rounded-full border border-purple-200 bg-white/70 px-3 py-1 shadow-sm">
                          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-purple-500">
                            <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm3.707 6.293l-4 4a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L9 10.586l3.293-3.293a1 1 0 011.414 1.414z" />
                          </svg>
                          {note.key_points.length} key points
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-white/70 px-3 py-1 shadow-sm">
                          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-blue-500">
                            <path d="M3 3a1 1 0 000 2h1l2.6 7.789a1 1 0 00.95.711H14a1 1 0 100-2h-5.05l-.35-1h6.4a1 1 0 00.97-.758l1.2-5A1 1 0 0016.2 3H4.618l-.2-.599A1 1 0 003.47 2H3a1 1 0 000 1z" />
                          </svg>
                          {note.action_items.length} action items
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Note Details */}
              <div className="lg:sticky lg:top-28 lg:self-start">
                {selectedNote ? (
                  <motion.div
                    key={selectedNote.id}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.35 }}
                    className="space-y-6"
                  >
                    {/* Summary */}
                    <article className="rounded-3xl border border-white/70 bg-white/85 p-8 shadow-xl shadow-purple-200/60 backdrop-blur-xl">
                      <header className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/15 via-indigo-500/10 to-blue-500/20 text-purple-600">
                          <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 6.75h15M4.5 12h15M4.5 17.25h10.5" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Summary</p>
                          <h2 className="text-lg font-semibold text-slate-900">Snapshot of the conversation</h2>
                        </div>
                      </header>
                      <p className="mt-4 text-sm leading-relaxed text-slate-700">{selectedNote.summary}</p>
                    </article>

                    {/* Key Points */}
                    <article className="rounded-3xl border border-white/70 bg-white/85 p-8 shadow-xl shadow-blue-200/60 backdrop-blur-xl">
                      <header className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/15 via-sky-500/10 to-cyan-500/20 text-blue-600">
                          <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19.5V4.5m0 0L4.5 12m7.5-7.5L19.5 12" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Key points</p>
                          <h2 className="text-lg font-semibold text-slate-900">What deserves attention</h2>
                        </div>
                      </header>
                      <ul className="mt-4 space-y-3">
                        {selectedNote.key_points.map((point, index) => (
                          <li
                            key={`${selectedNote.id}-point-${index}`}
                            className="flex items-start gap-3 rounded-2xl border border-blue-100/70 bg-white/80 p-4 shadow-sm"
                          >
                            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-sm font-semibold text-blue-600">
                              {index + 1}
                            </span>
                            <span className="text-sm text-slate-700">{point}</span>
                          </li>
                        ))}
                        {selectedNote.key_points.length === 0 && (
                          <p className="rounded-2xl border border-dashed border-blue-200 bg-white/60 p-4 text-sm text-slate-500">
                            No key points captured for this note.
                          </p>
                        )}
                      </ul>
                    </article>

                    {/* Action Items */}
                    <article className="rounded-3xl border border-white/70 bg-white/85 p-8 shadow-xl shadow-emerald-200/60 backdrop-blur-xl">
                      <header className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-lime-500/20 text-emerald-600">
                          <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Action items</p>
                          <h2 className="text-lg font-semibold text-slate-900">Next steps to follow</h2>
                        </div>
                      </header>
                      <ul className="mt-4 space-y-3">
                        {selectedNote.action_items.map((item, index) => (
                          <li
                            key={`${selectedNote.id}-action-${index}`}
                            className="flex items-start gap-3 rounded-2xl border border-emerald-100/70 bg-white/80 p-4 shadow-sm"
                          >
                            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-sm font-semibold text-emerald-600">
                              {index + 1}
                            </span>
                            <span className="text-sm text-slate-700">{item}</span>
                          </li>
                        ))}
                        {selectedNote.action_items.length === 0 && (
                          <p className="rounded-2xl border border-dashed border-emerald-200 bg-white/60 p-4 text-sm text-slate-500">
                            No action items were detected for this recording.
                          </p>
                        )}
                      </ul>
                    </article>

                    {/* Transcription */}
                    <article className="rounded-3xl border border-white/70 bg-white/85 p-8 shadow-xl shadow-slate-200/70 backdrop-blur-xl">
                      <header className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-slate-500/15 via-slate-500/10 to-slate-500/20 text-slate-700">
                          <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 9.75h15m-15 4.5h15" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Transcription</p>
                          <h2 className="text-lg font-semibold text-slate-900">Full context</h2>
                        </div>
                      </header>
                      <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                        {selectedNote.transcription}
                      </p>
                    </article>

                    {/* Audio Player */}
                    {selectedNote.audio_url && (
                      <article className="rounded-3xl border border-white/70 bg-white/85 p-8 shadow-xl shadow-purple-200/60 backdrop-blur-xl">
                        <header className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/15 via-indigo-500/10 to-blue-500/15 text-purple-600">
                            <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V5l12 7-12 7zM4 5v14" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Original recording</p>
                            <h2 className="text-lg font-semibold text-slate-900">Play the source audio</h2>
                          </div>
                        </header>
                        <audio controls className="mt-4 w-full rounded-xl border border-purple-200/60 bg-white/70 p-3 shadow-inner">
                          <source src={selectedNote.audio_url} type="audio/webm" />
                          Your browser does not support the audio element.
                        </audio>
                      </article>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    className="rounded-3xl border border-white/70 bg-white/80 p-12 text-center shadow-xl shadow-purple-200/50 backdrop-blur-xl"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/15 via-indigo-500/10 to-blue-500/15 text-purple-600">
                      <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.6} stroke="currentColor" className="h-8 w-8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                    <h2 className="mt-5 text-lg font-semibold text-slate-900">Select a note to view its details</h2>
                    <p className="mt-2 text-sm text-slate-600">
                      Choose any summary on the left to explore key points, actions, and the full transcription.
                    </p>
                  </motion.div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
