# Connectly

Connectly is a modern social networking web app built with React, TypeScript, Vite, and Supabase. It provides a clean social feed experience with authentication, user profiles, friend connections, notifications, and real-time updates.

## Features

- User authentication and protected routes
- Social feed with post creation and interaction
- User profiles and account settings
- Friend discovery and connection flow
- Notifications center
- Real-time updates powered by Supabase Realtime
- Responsive UI with Tailwind CSS
- PostgreSQL database with Supabase edge-ready schema

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Supabase Auth + Database + Realtime
- React Router
- Lucide React

## Project Structure

```text
Connectly/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   ├── contexts/
│   ├── hooks/
│   ├── lib/
│   ├── pages/
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   └── types.ts
├── supabase/
│   └── migrations/
├── .env.example
├── .gitignore
├── .oxlintrc.json
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
├── vercel.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+ recommended
- npm or another package manager
- A Supabase project

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file in the project root using the example file as a base:

```bash
cp .env.example .env
```

Then update the values with your Supabase credentials:

```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Run the app locally

```bash
npm run dev
```

The app will be available at the local Vite URL shown in the terminal.

## Available Scripts

```bash
npm run dev      # start development server
npm run build    # compile TypeScript and create production build
npm run preview  # preview production build locally
npm run lint     # run lint checks
```

## Supabase Setup

This project uses Supabase for authentication, storage, and realtime data. The database schema is defined in:

- `supabase/migrations/00000000000000_initial_schema.sql`
- `supabase/migrations/20260926000001_step2_social.sql`
- `supabase/migrations/20260926000002_step3_realtime.sql`

After creating your Supabase project, run the SQL migrations or use the Supabase CLI to apply them.

## Deployment

The repository includes a Vercel configuration file (`vercel.json`), making deployment straightforward on Vercel.

### Vercel deployment notes

- Set the required environment variables in the Vercel dashboard.
- Use the project root as the deployment directory.
- Ensure your Supabase URL and anon key are configured for production.

## Notes

This is a frontend-focused social app that depends on a properly configured Supabase backend. If environment variables are missing, the app will log warnings and use placeholder values until configured.

## License

This project does not currently include a license file. If you plan to publish or share it publicly, consider adding an appropriate open-source license.
