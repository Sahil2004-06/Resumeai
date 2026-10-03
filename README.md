# ResumeAI

ResumeAI is an AI-assisted resume workspace for building ATS-friendly resumes, tailoring them to roles, and finding better job matches. The current frontend slice is a polished local demo with a responsive dashboard, resume library, live editor preview, ATS-ready data utilities, and job matching views.

## Current Features

- Responsive SaaS workspace with dashboard, resume library, editor, and job matches.
- Structured resume data model used by the editor and live preview.
- Local demo job provider data with match scores and skill tags.
- Deterministic ATS scoring utility in `src/lib/ats.js`.
- Escaped LaTeX generation utility in `src/lib/latex.js`.
- Supabase client boundary and PostgreSQL migration with ownership-based RLS.
- No Gemini or service-role credentials are exposed to the browser.

## Stack

React, Vite, JavaScript, React Router, Lucide React, Supabase, PostgreSQL, Zod, and Gemini through server-only Edge Functions.

## Run Locally

```bash
npm install
npm run dev
```

Quality checks:

```bash
npm run lint
npm run build
```

## Environment Setup

Create `resumeai/.env` from `.env.example`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_KEY
```

Never put `GEMINI_API_KEY` in this file or in any `VITE_` variable. Vite exposes `VITE_` values to the browser.

## Supabase Setup

1. Create a Supabase project at https://supabase.com.
2. Install the Supabase CLI and run `supabase login`.
3. From this project folder run `supabase link --project-ref YOUR_PROJECT_REF`.
4. Apply the database and storage migrations with `supabase db push`.
5. In Supabase Authentication, enable Email provider and choose whether email confirmation is required.
6. Copy the Project URL and anon key into `.env`.
7. Set the Gemini secret with `supabase secrets set GEMINI_API_KEY=YOUR_GEMINI_KEY`.
8. Deploy the AI functions with `supabase functions deploy analyze-resume`, `supabase functions deploy analyze-job`, and `supabase functions deploy tailor-resume`.

The migrations create profiles, resumes, resume versions, job descriptions, AI suggestions, job matches, saved jobs, user settings, and private `resume-uploads` / `resume-exports` buckets. Row Level Security is enabled for every user-owned table. Upload paths must start with the authenticated user id, for example `<user-id>/original.pdf`.

## Architecture

```text
React / Vite
   |
   +--> Supabase Auth + PostgreSQL + Storage
   |
   +--> Supabase Edge Functions --> Gemini API
   |
   +--> Resume JSON --> LaTeX generator --> PDF/DOCX service
```

Gemini calls should follow the server boundary above. AI output must be validated with Zod before it is stored or applied to a resume. The deterministic ATS utility is intentionally kept separate from AI scoring so the product can explain its estimate.

## Next Integration Steps

- Add AuthContext and protected routes around the existing workspace shell.
- Connect the editor save actions to `src/services/resumeService.js`.
- Connect upload/analyzer/tailor controls to `src/services/aiService.js`.
- Add PDF/DOCX text extraction and export workers behind Edge Functions.
- Replace the mock job provider with a compliant provider adapter when credentials are available.

## Resume builder and uploads

The resume maker is available at `/resumes/new` and saves structured resume data to Supabase. It includes experience, education, technical skills, soft skills, achievements, and certifications.

AI Tailor accepts pasted text or PDF/DOCX/TXT/Markdown uploads for both the resume and target job description. PDF and DOCX text is extracted in the browser before the content is sent to the protected Edge Function.

For live job listings, configure a compliant provider adapter with:

```env
VITE_JOBS_API_URL=https://your-provider.example/jobs
```

The app keeps sample listings only as a clearly labeled fallback when this variable is not configured. Do not scrape job boards or expose provider secrets in `VITE_` variables; use a server-side proxy when authentication is required.

## Limitations

The current dashboard data is still local demo data, while authentication and the backend service boundaries are ready. PDF compilation, DOCX generation, file extraction, and real Supabase CRUD need to be connected to the controls before production deployment.