'use client';

import { motion } from 'framer-motion';

export default function ProcessingAnimation() {
  return (
    <div className="flex flex-col items-center justify-center space-y-6 py-12">
      <div className="relative w-24 h-24">
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-purple-200"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute inset-2 rounded-full border-4 border-blue-500 border-t-transparent"
          animate={{ rotate: -360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <svg
              className="w-8 h-8 text-purple-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path
                fillRule="evenodd"
                d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                clipRule="evenodd"
              />
            </svg>
          </motion.div>
        </div>
      </div>

      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold text-gray-800">Processing your voice note</h3>
        <ul className="flex items-center gap-3 text-gray-600">
          {['Transcribing', 'Analyzing', 'Summarizing'].map((label, index) => (
            <li key={label} className="flex items-center gap-3">
              {index > 0 && <span className="h-1.5 w-1.5 rounded-full bg-gray-400" aria-hidden />}
              <motion.span
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: index * 0.35 }}
              >
                {label}
              </motion.span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

