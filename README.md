# Family Trace - Real-time Location Sharing

A premium, real-time family location sharing app built with React, Vite, Leaflet, and Supabase.

## Supabase Setup Requirements

To make this app functional, you need to set up a Supabase project with the following:

### 1. Database Table: `profiles`
Create a table named `profiles` with the following columns:
- `id`: uuid (Primary Key, references auth.users.id)
- `name`: text
- `lat`: float8
- `lng`: float8
- `updated_at`: timestamptz (default: now())

### 2. Enable Real-time
Go to **Database > Replication** and enable the `locations` channel for the `profiles` table.

### 3. Row Level Security (RLS)
Enable RLS on the `profiles` table and add policies:
- **Select**: Users can read all profiles (or profiles within their family group).
- **Insert/Update**: Users can only modify their own profile based on `auth.uid()`.

### 4. Environment Variables
Copy `.env.example` to `.env` and fill in your Supabase credentials:
```env
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## Getting Started

1. Install dependencies: `npm install`
2. Run development server: `npm run dev`
