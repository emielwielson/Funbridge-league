# Supabase Setup Guide

## Environment Variables

Create a `.env` file in the root of the project with the following variables:

```env
# Supabase Project URL
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co

# Supabase Anon/Public Key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Supabase Service Role Key (server-side only)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## Getting Your Supabase Credentials

1. Go to your Supabase project dashboard
2. Navigate to Settings -> API
3. Copy the following:
   - **Project URL**: Use this for `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key**: Use this for `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key**: Use this for `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

## Running Migrations

### Using Supabase CLI

1. Install Supabase CLI: `npm install -g supabase` or use `npx supabase`
2. Initialize Supabase: `supabase init`
3. Link to your project: `supabase link --project-ref <your-project-ref>`
4. Run migrations: `supabase db push`

### Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run each migration file in order:
   - `001_initial_schema.sql`
   - `002_rls_policies.sql`
   - `003_initial_admin.sql` (see notes in file)

## Session Pooling

To enable session pooling:

1. Go to your Supabase project settings
2. Navigate to Database -> Connection Pooling
3. Enable connection pooling
4. Use the pooled connection URL if provided (optional, the regular URL works too)

## Creating the Initial Admin

See `003_initial_admin.sql` for detailed instructions on creating the first admin user.

## Testing the Setup

After running migrations, test the connection:

```typescript
import { supabase } from '@/lib/supabase/client';

// Test connection
const { data, error } = await supabase.from('users').select('count');
console.log('Connection test:', { data, error });
```

