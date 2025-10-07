'use client';

import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
  useAuth,
} from '@clerk/nextjs';
import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import VoiceRecorder from '@/components/VoiceRecorder';
import ProcessingAnimation from '@/components/ProcessingAnimation';
import NoteResults from '@/components/NoteResults';
import SetupWarning from '@/components/SetupWarning';
import { uploadAudioFile } from '@/lib/supabase-client';

interface ProcessedNote {
  transcription: string;
  summary: string;
  key_points: string[];
  action_items: string[];
}

const HERO_STATS = [
  { value: '2.1k', label: 'Notes processed', helper: '+128 this week' },
  { value: '92%', label: 'Review time saved', helper: 'vs manual transcription' },
  { value: '4.8/5', label: 'Team satisfaction', helper: 'Based on 340 sessions' },
];

const FEATURE_CARDS: Array<{
  id: string;
  badge: string;
  badgeGradient: string;
  title: string;
  description: string;
  bullets: string[];
  icon: ReactNode;
}> = [
  {
    id: 'summaries',
    badge: 'AI',
    badgeGradient: 'from-purple-500 via-indigo-500 to-blue-500',
    title: 'Smart Summaries',
    description: 'Condense long conversations into crisp, shareable snapshots your team can read in seconds.',
    bullets: ['Detects themes and decisions automatically', 'Surfaces timestamps for critical takeaways'],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11.25 6.75V3.75a.75.75 0 01.75-.75h6a.75.75 0 01.75.75v3M5.25 20.25H18a.75.75 0 00.75-.75V9a.75.75 0 00-.75-.75H6a.75.75 0 00-.75.75v10.5a.75.75 0 00.75.75z"
        />
      </svg>
    ),
  },
  {
    id: 'keypoints',
    badge: 'KP',
    badgeGradient: 'from-blue-500 via-sky-500 to-cyan-500',
    title: 'Key Points',
    description: 'Highlight the ideas that matter most and keep everyone aligned on next steps instantly.',
    bullets: ['Spotlights important questions and answers', 'Groups insights by topic for rapid scanning'],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19.5V4.5m0 0l-7.5 7.5M12 4.5l7.5 7.5" />
      </svg>
    ),
  },
  {
    id: 'actions',
    badge: 'Do',
    badgeGradient: 'from-emerald-500 via-lime-500 to-teal-500',
    title: 'Action Items',
    description: 'Transform insights into focused follow-ups with owners, due dates, and context baked in.',
    bullets: ['Auto-assign tasks from commitments', 'Exports seamlessly to your favourite tools'],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.5 12l5.25 5.25L19.5 7.5m0 11.25v-12a2.25 2.25 0 00-2.25-2.25h-10.5A2.25 2.25 0 004.5 6.75v10.5A2.25 2.25 0 006.75 19.5h10.5A2.25 2.25 0 0019.5 17.25z"
        />
      </svg>
    ),
  },
];

const WORKFLOW_STEPS = [
  {
    id: 'capture',
    title: 'Capture effortlessly',
    description: 'Tap the glowing mic, speak naturally, and let the recorder handle clarity with built-in noise smoothing.',
    tip: 'Perfect for meetings, quick ideas, or coaching moments on the go.',
  },
  {
    id: 'analyze',
    title: 'AI does the heavy lifting',
    description: 'Echo Notes uploads securely, transcribes with Whisper, then distills every insight using GPT-4o.',
    tip: "You'll see summaries, key points, and contextual highlights in under a minute.",
  },
  {
    id: 'act',
    title: 'Act with confidence',
    description: 'Share structured notes, send action items to teammates, or revisit past recordings from the library.',
    tip: "Stay on top of commitments and never lose the thread of what's next.",
  },
];

export default function Home() {
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedNote, setProcessedNote] = useState<ProcessedNote | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [hasScrolled, setHasScrolled] = useState(false);
  const { isSignedIn } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setHasScrolled(window.scrollY > 12);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleRecordingComplete = (audioBlob: Blob) => {
    setRecordedAudio(audioBlob);
  };

  const handleProcessNote = async () => {
    if (!isSignedIn) {
      alert('Please sign in to process a note.');
      return;
    }

    if (!recordedAudio) return;

    setIsProcessing(true);
    try {
      const uploadedUrl = await uploadAudioFile(recordedAudio, 'recording.webm');
      if (uploadedUrl) {
        setAudioUrl(uploadedUrl);
      }

      const formData = new FormData();
      formData.append('audio', recordedAudio, 'recording.webm');

      const response = await fetch('/api/process', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to process audio');
      }

      const data = await response.json();
      setProcessedNote(data);
      setRecordedAudio(null);
    } catch (error) {
      console.error('Error processing note:', error);
      alert(
        `Failed to process note: ${
          error instanceof Error ? error.message : 'Unknown error'
        }\n\nCheck console for details.`,
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNewNote = () => {
    setProcessedNote(null);
    setRecordedAudio(null);
    setAudioUrl(null);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f6f7ff] text-slate-900">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-x-0 top-[-30%] h-[520px] bg-gradient-to-b from-purple-200/70 via-transparent to-transparent blur-3xl" />
        <div className="absolute left-[-12%] top-32 h-96 w-96 rounded-full bg-gradient-to-br from-purple-400/40 via-blue-400/20 to-transparent blur-3xl" />
        <div className="absolute right-[-10%] bottom-10 h-[420px] w-[420px] rounded-full bg-gradient-to-br from-pink-300/40 via-transparent to-transparent blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.8),_rgba(255,255,255,0))]" />
      </div>

      {/* Header */}
      <header
        className={`sticky top-0 z-50 border-b transition-all ${
          hasScrolled
            ? 'border-white/80 bg-white/90 shadow-lg shadow-slate-900/5 backdrop-blur-xl'
            : 'border-white/60 bg-white/60 backdrop-blur-lg'
        }`}
      >
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
              <p className="text-base font-semibold text-slate-900">Turn every idea into action</p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full border border-purple-200 bg-white/60 px-3 py-1 text-xs font-semibold text-purple-600 shadow-sm shadow-purple-200/70 sm:inline-flex">
              Live transcription powered by GPT-4o
            </span>
            <SignedOut>
              <div className="flex items-center gap-3">
                <SignInButton mode="modal">
                  <button className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-purple-300 hover:text-purple-600 hover:shadow-md">
                    Sign in
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="group inline-flex items-center gap-2 rounded-full border border-transparent bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/30 transition-all hover:shadow-purple-500/50">
                    <span>Create account</span>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      strokeWidth={1.8}
                      stroke="currentColor"
                      className="h-4 w-4 transition-transform group-hover:translate-x-1"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m0 0l-6-6m6 6l-6 6" />
                    </svg>
                  </button>
                </SignUpButton>
              </div>
            </SignedOut>
            <SignedIn>
              <div className="flex items-center gap-3">
                <Link
                  href="#record"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-purple-300 hover:text-purple-600 hover:shadow-md"
                >
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} stroke="currentColor" className="h-4 w-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
                  </svg>
                  Start Recording
                </Link>
                <Link
                  href="/notes"
                  className="group inline-flex items-center gap-2 rounded-full border border-transparent bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/30 transition-all hover:shadow-purple-500/50"
                >
                  <span>View Notes</span>
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
                <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: 'h-10 w-10' } }} />
              </div>
            </SignedIn>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 lg:px-8">
        {!processedNote ? (
          <div className="space-y-16">
            <section className="grid gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-start">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-white/60 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-purple-600 shadow-md shadow-purple-200/60">
                  <span className="h-2 w-2 rounded-full bg-purple-500 shadow-[0_0_0_3px_rgba(168,85,247,0.25)]" />
                  Your AI workspace for voice notes
                </div>
                <h1 className="mt-6 text-4xl font-bold leading-tight text-slate-900 sm:text-5xl sm:leading-tight">
                  Transform Voice into{' '}
                  <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">
                    Brilliant Insights
                  </span>
                </h1>
                <p className="mt-4 text-lg text-slate-600 sm:text-xl">
                  Record once and Echo Notes instantly returns rich summaries, key points, and smart action items ready
                  to share with your team.
                </p>
                <div className="mt-10 grid gap-4 sm:grid-cols-3">
                  {HERO_STATS.map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-2xl border border-white/70 bg-white/70 p-5 shadow-lg shadow-purple-200/40 backdrop-blur-xl"
                    >
                      <p className="text-3xl font-semibold text-slate-900">{stat.value}</p>
                      <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                      <p className="mt-1 text-xs font-semibold text-purple-600">{stat.helper}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div id="record" className="relative">
                <div className="absolute inset-0 -z-10 rounded-[2.5rem] bg-gradient-to-br from-purple-300/40 via-white/50 to-blue-300/30 blur-3xl" />
                <div className="rounded-[2.5rem] border border-white/60 bg-white/75 p-1 shadow-2xl shadow-purple-200/60 backdrop-blur-2xl">
                  <div className="rounded-[2rem] bg-white/90 p-6 sm:p-10">
                    <div className="mb-6">
                      <SetupWarning />
                    </div>
                    <SignedOut>
                      <div className="rounded-2xl border border-slate-200/70 bg-white/90 px-6 py-8 text-center shadow-inner shadow-purple-200/30">
                        <p className="text-base font-semibold text-slate-800">Sign in to capture voice notes</p>
                        <p className="mt-2 text-sm text-slate-600">
                          Create a free account to record audio, generate AI summaries, and revisit your notes anytime.
                        </p>
                        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                          <SignInButton mode="modal">
                            <button className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-purple-300 hover:text-purple-600 hover:shadow-md">
                              Sign in
                            </button>
                          </SignInButton>
                          <SignUpButton mode="modal">
                            <button className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-400/40 transition-all hover:shadow-purple-500/60">
                              Create account
                            </button>
                          </SignUpButton>
                        </div>
                      </div>
                    </SignedOut>
                    <SignedIn>
                      {isProcessing ? (
                        <ProcessingAnimation />
                      ) : (
                        <>
                          <VoiceRecorder onRecordingComplete={handleRecordingComplete} isProcessing={isProcessing} />
                          {recordedAudio && (
                            <div className="mt-8 space-y-4">
                              <div className="rounded-2xl border border-emerald-200/60 bg-gradient-to-r from-emerald-50 to-sky-50 px-6 py-4 shadow-md shadow-emerald-100/60">
                                <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-4">
                                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500">
                                    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} stroke="currentColor" className="h-5 w-5">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                  </div>
                                  <div className="text-center sm:text-left">
                                    <p className="text-base font-semibold text-emerald-600">Recording captured</p>
                                    <p className="text-sm text-slate-600">Ready when you are - process now to unlock insights.</p>
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                                <button
                                  onClick={handleProcessNote}
                                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-600 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/40 transition-all hover:shadow-purple-500/60 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:ring-offset-2 focus:ring-offset-white"
                                >
                                  Process Note with AI
                                  <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} stroke="currentColor" className="h-4 w-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m0 0l-6-6m6 6l-6 6" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => setRecordedAudio(null)}
                                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-8 py-3 text-sm font-semibold text-slate-600 shadow-sm transition-all hover:border-rose-300 hover:text-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:ring-offset-2 focus:ring-offset-white"
                                >
                                  Discard
                                </button>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </SignedIn>
                  </div>
                </div>
              </div>
            </section>

            <div className="grid gap-6 md:grid-cols-3">
              {FEATURE_CARDS.map((feature) => (
                <div
                  key={feature.id}
                  className="group relative overflow-hidden rounded-3xl border border-white/70 bg-white/75 p-8 shadow-xl shadow-purple-200/40 backdrop-blur-xl transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-200/70"
                >
                  <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br from-purple-400/20 via-transparent to-transparent blur-3xl transition-all group-hover:translate-x-6 group-hover:-translate-y-6" />
                  <div className="inline-flex items-center gap-3 rounded-full border border-white/70 bg-white/80 px-4 py-1 text-sm font-semibold text-slate-600 shadow-sm">
                    <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r ${feature.badgeGradient} text-sm font-bold text-white shadow-sm shadow-purple-300/60`}>
                      {feature.badge}
                    </span>
                    {feature.title}
                  </div>
                  <div className="mt-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-100 via-indigo-100 to-blue-100 text-purple-600">
                    {feature.icon}
                  </div>
                  <p className="mt-6 text-base text-slate-600">{feature.description}</p>
                  <ul className="mt-6 space-y-3 text-sm text-slate-500">
                    {feature.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-2">
                        <span className="mt-1 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-purple-500/10 text-purple-500">
                          <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                            <path
                              fillRule="evenodd"
                              d="M16.704 5.29a1 1 0 010 1.415l-6.364 6.364a1 1 0 01-1.415 0L3.296 7.444a1 1 0 011.415-1.414l4.219 4.218 5.657-5.656a1 1 0 011.415 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="rounded-3xl border border-white/70 bg-white/75 p-10 shadow-xl shadow-blue-200/50 backdrop-blur-xl">
              <div className="grid gap-10 md:grid-cols-5">
                <div className="space-y-4 md:col-span-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-blue-600">
                    Workflow
                  </span>
                  <h2 className="text-2xl font-semibold text-slate-900 sm:text-3xl">How Echo Notes works</h2>
                  <p className="text-sm text-slate-600">
                    From the first idea to your next action item, Echo Notes keeps every detail organised and actionable.
                  </p>
                </div>
                <div className="space-y-6 md:col-span-3">
                  {WORKFLOW_STEPS.map((step, index) => (
                    <div
                      key={step.id}
                      className="rounded-2xl border border-slate-100 bg-white/90 p-5 shadow-md shadow-slate-200/70 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-300/60"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="inline-flex items-center gap-2 rounded-full bg-slate-900/5 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-slate-500">
                            Step {index + 1}
                          </div>
                          <h3 className="mt-3 text-lg font-semibold text-slate-900">{step.title}</h3>
                          <p className="mt-2 text-sm text-slate-600">{step.description}</p>
                        </div>
                        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-purple-200 bg-purple-50 text-base font-semibold text-purple-600 shadow-sm shadow-purple-100/60">
                          {index + 1}
                        </span>
                      </div>
                      <p className="mt-3 rounded-xl bg-slate-900/3 px-4 py-2 text-xs font-medium text-slate-500">
                        {step.tip}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <NoteResults
            transcription={processedNote.transcription}
            summary={processedNote.summary}
            keyPoints={processedNote.key_points}
            actionItems={processedNote.action_items}
            audioUrl={audioUrl}
            onNewNote={handleNewNote}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/70 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-8 text-center text-sm text-slate-500 sm:flex-row sm:text-left sm:text-base">
          <p>Powered by OpenAI Whisper &amp; GPT-4o - Built with Next.js &amp; Supabase</p>
          <p className="text-xs text-slate-400">Echo Notes keeps your conversations encrypted end to end.</p>
        </div>
      </footer>
    </div>
  );
}

