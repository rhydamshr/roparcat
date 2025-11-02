# Tabbycat Clone - Debate Tournament Management System

A comprehensive debate tournament management system built with React, TypeScript, Tailwind CSS, and Supabase. This system manages teams, adjudicators, rounds, draws, tabulation, and results for debate tournaments following formats like British Parliamentary (BP) and Asian Parliamentary (AP).

## 📚 Getting Started

- **[⚡ Quick Start (5 min)](./QUICK_START.md)** - Get up and running fast!
- **[📖 How To Use Guide](./HOW_TO_USE.md)** - Complete step-by-step instructions
- **[✅ Feature Checklist](./FEATURE_CHECKLIST.md)** - Verify everything works!
- **[✅ Implementation Summary](./IMPLEMENTATION.md)** - What's implemented

## 🎯 Features

### Core Features
- **Tournament Management**: Create and manage multiple tournaments with different formats
- **Team & Institution Management**: Register teams with speakers and manage institutions
- **Adjudicator System**: Track adjudicator strength, affiliations, and assignments
- **Round Management**: Create rounds with motions and manage debate pairings
- **Automated Draw Generation**: Power-pairing algorithm for fair team matchups
- **Result Entry**: Enter debate results, speaker scores, and rankings
- **Live Tabulation**: Real-time standings with team points, speaker averages, and break calculations
- **Participant URLs**: Generate unique private URLs for each team to view their draws and standings
- **CSV Import/Export**: Bulk import/export teams and data

### User Roles
- **Admin**: Full system access, can manage all tournament data
- **Tabber**: Can view data and enter/update results
- **Public**: View-only access to published standings and draws

## 🚀 Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Real-time)
- **Authentication**: Supabase Auth with Row Level Security (RLS)
- **Icons**: Lucide React
- **Routing**: React Router v7

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works)
- Git

## 🛠️ Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/meow-main.git
cd meow-main
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key
3. Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run Database Migrations

The SQL schema is in `supabase/migrations/`. Run this migration in your Supabase SQL Editor:

```bash
# Copy the contents of supabase/migrations/20251026100942_create_debate_tournament_schema.sql
# Paste and execute in Supabase SQL Editor
```

### 5. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### 6. Create Your First User

1. Navigate to the Register page
2. Create an Admin account (select "Admin" role)
3. Log in and start managing your tournament!

## 📖 Usage Guide

**📚 For detailed step-by-step instructions, see [HOW_TO_USE.md](./HOW_TO_USE.md)**

### Quick Overview

### Getting Started Workflow

1. **Add Institutions**: Navigate to Institutions page and add participating universities/organizations
2. **Register Teams**: Add teams with their speakers and assign institutions
3. **Add Adjudicators**: Register judges with strength ratings and contact info
4. **Setup Rooms**: Create debate rooms with capacity information
5. **Create Tournament**: Set up a new tournament with format (BP/AP) and dates
6. **Create Rounds**: Add rounds with motions and info slides
7. **Generate Draws**: Automatically pair teams based on power-pairing
8. **Assign Adjudicators**: System assigns judges to debates
9. **Enter Results**: Record debate outcomes, speaker scores, and rankings
10. **View Standings**: Monitor live tournament standings and statistics

### Bulk Import Teams

1. Prepare a CSV file with columns: Team, Institution, Speakers (comma-separated)
2. Navigate to Teams page
3. Click "Import CSV"
4. Select your CSV file
5. Teams will be automatically imported and linked to institutions

### Generating Draws

The system uses a power-pairing algorithm that:
- Pairs teams with similar point totals (for seeded rounds)
- Randomizes for preliminary rounds
- Assigns 4 teams per debate (BP format)
- Distributes adjudicators with strength-based pairing

### Entering Results

1. Navigate to Rounds page
2. Expand a round to see debates
3. Click "Enter Results" for a debate
4. Enter:
   - Points (3 for 1st, 2 for 2nd, 1 for 3rd, 0 for 4th in BP)
   - Rank (1-4)
   - Speaker names and scores (60-100)
5. Save results - standings update automatically

### Viewing Standings

The Standings page shows:
- **Teams Tab**: Team rankings sorted by points, with average speaker scores
- **Speakers Tab**: Top individual speaker rankings
- **Adjudicators Tab**: Judge statistics and assignments
- Export to CSV functionality

## 🗄️ Database Schema

### Core Tables

- **profiles**: User accounts with roles
- **institutions**: Universities/organizations
- **teams**: Debate teams with speakers
- **adjudicators**: Judges with strength ratings
- **rooms**: Physical debate rooms
- **tournaments**: Tournament definitions
- **rounds**: Tournament rounds with motions
- **debates**: Individual debate matchups
- **debate_teams**: Team participation in debates
- **debate_adjudicators**: Judge assignments
- **speaker_scores**: Individual speaker scores

## 🔐 Security

- Row Level Security (RLS) enabled on all tables
- Role-based access control (Admin, Tabber, Public)
- Admin-only access for creating/modifying core data
- Authenticated users can view and enter results
- JWT-based authentication via Supabase

## 📝 Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## 🚢 Deployment

### Deploy Frontend (Vercel)

```bash
npm run build
# Deploy dist/ folder to Vercel
```

### Deploy Database

Run the migration in your Supabase project SQL editor.

## 🧪 Development

### Available Scripts

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run typecheck    # TypeScript type checking
```

### Project Structure

```
src/
├── components/       # Reusable components
│   ├── DashboardLayout.tsx
│   └── ProtectedRoute.tsx
├── contexts/        # React contexts
│   └── AuthContext.tsx
├── lib/            # Utilities and config
│   ├── supabase.ts
│   └── csv.ts
└── pages/          # Page components
    ├── Login.tsx
    ├── Register.tsx
    └── dashboard/
        ├── Home.tsx
        ├── Tournaments.tsx
        ├── Teams.tsx
        ├── Institutions.tsx
        ├── Adjudicators.tsx
        ├── Rooms.tsx
        ├── Rounds.tsx
        └── Standings.tsx
```

## 🐛 Troubleshooting

### Common Issues

1. **"Missing Supabase environment variables"**
   - Ensure `.env` file is in root directory
   - Check that variables are prefixed with `VITE_`

2. **RLS Policy Errors**
   - Verify migration was run successfully
   - Check that your user profile exists
   - Ensure you're logged in with proper role

3. **Import CSV Errors**
   - Check CSV format matches expected columns
   - Ensure institution names match existing institutions
   - Verify file encoding is UTF-8

## 🤝 Contributing

This is a Tabbycat-inspired debate tournament management system. Feel free to contribute!

## 📄 License

This project is open source and available for educational and tournament use.

## 🙏 Acknowledgments

Inspired by [Tabbycat](https://github.com/federations/tabbycat) - an excellent open-source debate tournament management system.
