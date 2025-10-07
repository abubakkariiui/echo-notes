# Echo Notes - AI Voice Note Assistant
 
<img width="1920" height="2413" alt="screencapture-localhost-3000-2025-10-07-13_20_33" src="https://github.com/user-attachments/assets/94960a13-7432-4378-bae9-c1b578f26760" />

Echo Notes turns raw voice recordings into structured meeting summaries, key points, and action items using OpenAI and Supabase. The project ships with a polished Next.js UI optimised for desktop and mobile.

## Features
- Voice recording with live waveform feedback.
- Whisper transcription plus GPT-4o analysis for summaries, key points, and action items.
- Supabase storage for persistent note history and audio files.
- Clerk authentication so every user signs in and only sees their own notes.
- Responsive UI with animations powered by Tailwind CSS and Framer Motion.
- Production-friendly empty states, keyboard navigation, and status messaging.

## Tech Stack
- **Framework:** Next.js 15 (App Router) with TypeScript.
- **Styling:** Tailwind CSS v4 and custom gradients.
- **Animations:** Framer Motion.
- **AI:** OpenAI Whisper + GPT-4o-mini.
- **Data:** Supabase (PostgreSQL + Storage).

## Prerequisites
- Node.js 18+
- An OpenAI API key with Whisper + GPT access
- A Supabase project (free tier works)
- A Clerk account with a web application (for publishable & secret keys)

## Local Setup
1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Environment variables**
   Create `.env.local` in the project root with:
   ```env
   OPENAI_API_KEY=sk-proj-your-openai-api-key
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your-key
   CLERK_SECRET_KEY=sk_test_your-key
   ```
3. **Database schema and storage**
   - Open Supabase Studio and run the SQL from `supabase-schema.sql` to create the `notes` table.
   - In Supabase Storage, create a **public** bucket named `audio-notes` (allow audio/webm uploads).
   - **Important:** Replace the demo policy in the SQL file with user-specific RLS policies once Clerk is configured: only allow inserts/selects/updates/deletes when `auth.uid() = user_id`. This ensures users cannot read or mutate other users' notes even if they tamper with requests.
4. **Run the dev server**
   ```bash
   npm run dev
   ```
   Then visit http://localhost:3000.

## Usage
1. Sign in or create an account via Clerk (modal or `/sign-in` / `/sign-up` routes).
2. Hit the glowing mic button to record a voice note.
3. Click **Process Note with AI** to upload, transcribe, and analyse the recording.
4. Save the structured note to Supabase or copy it to your clipboard.
5. Browse saved notes on the **Notes** page, review details, and delete unneeded entries.

## Deployment
- Deploy on [Vercel](https://vercel.com) for best DX.
- Set the environment variables (`OPENAI_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) in the hosting dashboard.
- Ensure the Supabase SQL schema and storage bucket have been applied before the first deploy.

## Troubleshooting
- **Audio errors:** confirm the browser has microphone permission and supports the MediaRecorder API.
- **AI failures:** verify OpenAI credits and the `OPENAI_API_KEY` value.
- **Storage/database issues:** confirm Supabase URL/key are correct and the `notes` table and bucket exist.

## License
Released under the MIT License. Add a `LICENSE` file if you plan to distribute publicly.
