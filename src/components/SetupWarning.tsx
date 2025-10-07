'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { isSupabaseConfigured } from '@/lib/supabase-client';

export default function SetupWarning() {
  const [isConfigured, setIsConfigured] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    setIsConfigured(isSupabaseConfigured());
    const dismissed = sessionStorage.getItem('setup-warning-dismissed');
    setIsDismissed(dismissed === 'true');
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('setup-warning-dismissed', 'true');
  };

  if (isConfigured || isDismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        role="alert"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        className="relative overflow-hidden rounded-2xl border border-amber-200/80 bg-amber-50/90 p-5 text-amber-900 shadow-lg shadow-amber-200/60 backdrop-blur"
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-amber-200/40 via-transparent to-transparent" aria-hidden />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-700">
              <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} stroke="currentColor" className="h-6 w-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.94 4h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">Supabase setup required</p>
              <p className="mt-1 text-sm leading-relaxed text-amber-800">
                Supabase credentials are missing. Add your environment variables and run the schema so notes can be saved.
              </p>
              {showDetails && (
                <div className="mt-3 space-y-3 rounded-xl border border-amber-200/70 bg-white/80 p-4 text-xs text-amber-900 shadow-inner">
                  <ol className="space-y-2">
                    <li>1. Create <code className="rounded bg-amber-100 px-1">.env.local</code> with your Supabase URL and anon key.</li>
                    <li>2. Run the SQL in <code className="rounded bg-amber-100 px-1">supabase-schema.sql</code> from Supabase Studio.</li>
                    <li>3. In Supabase Storage, create a public bucket named <code className="rounded bg-amber-100 px-1">audio-notes</code>.</li>
                    <li>4. Restart the dev server after the values are set.</li>
                  </ol>
                  <p className="text-[11px] text-amber-700">
                    Need more detail? See the checklist in README.md under the Local Setup section.
                  </p>
                </div>
              )}
              <button
                onClick={() => setShowDetails((value) => !value)}
                className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-amber-800 underline decoration-amber-400 decoration-dotted underline-offset-4 transition-colors hover:text-amber-900"
              >
                {showDetails ? 'Hide setup checklist' : 'View setup checklist'}
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="self-start rounded-full border border-amber-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-amber-700 shadow-sm transition-colors hover:bg-white"
          >
            Dismiss
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
