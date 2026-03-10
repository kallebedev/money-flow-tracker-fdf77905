# MoneyFlow - Sales Intelligence App

## Overview
A personal finance and productivity web application built with React, Vite, TypeScript, and Supabase. Features include expense tracking, budget planning, AI-powered chatbot, goal tracking, spending analysis, and productivity tools.

## Architecture
- **Frontend**: React 18 + TypeScript + Vite (port 5000)
- **Auth & Database**: Supabase (hosted)
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: React Query + React Context
- **Routing**: React Router DOM v6

## Key Features
- Dashboard with financial overview
- Transaction management
- Budget categories
- Goal tracking
- Spending analysis with charts (Recharts)
- AI chatbot and budget planner (OpenAI)
- Productivity tools (notes, tasks)
- Dark/light theme support
- PDF export (jsPDF)

## Project Structure
```
src/
  App.tsx           - Main app with routing
  main.tsx          - Entry point
  contexts/         - AuthContext, FinanceContext
  components/       - UI components including shadcn/ui
  pages/            - Route-level page components
  lib/              - Supabase client, utilities
  hooks/            - Custom React hooks
```

## Environment
- Supabase URL and anon key are hardcoded in `src/lib/supabase.ts`
- The app uses Supabase Auth for user authentication
- OpenAI API key should be stored as an environment variable: `VITE_OPENAI_API_KEY`

## Running the App
```bash
npm run dev   # Starts Vite dev server on port 5000
npm run build # Production build
```

## Migration Notes
- Migrated from Lovable to Replit
- Removed `lovable-tagger` from vite.config.ts
- Updated Vite server config: host `0.0.0.0`, port `5000`, `allowedHosts: true`
