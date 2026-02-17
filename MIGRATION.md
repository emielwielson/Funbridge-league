# Migrating to a New Supabase Database

Use this guide when moving your data to a new Supabase project (e.g. in a different account). The new project should already be created.

---

## 1. Get connection strings

- **Old project**: Supabase Dashboard → **Project Settings** → **Database** → **Connection string** (URI). Copy the URI (use the one that includes the password, or replace `[YOUR-PASSWORD]` with your DB password).
- **New project**: Same path; copy the new project’s connection string.

You’ll use these for migrations and for the data copy script.

---

## 2. Apply schema on the new database

The new database must have the same schema as the old one. Use the project’s migrations with the **new** database.

1. In your `.env`, set `DATABASE_URL` to the **new** project’s connection string (the one you want to migrate **to**).
2. From the project root run:
   ```bash
   node supabase/run-migrations.js
   ```
3. This runs all schema migrations (tables, RLS, triggers, functions). If the new project already has some schema (e.g. from the Supabase UI), fix any conflicts (e.g. skip or adjust migrations) and re-run until the schema matches what the app expects.

---

## 3. Copy data from old DB to new DB

Use the provided script to copy all app data in the correct order (respecting foreign keys).

1. In `.env` (or in the same env the script will use), set:
   - `OLD_DATABASE_URL` = connection string of the **current** Supabase project (source).
   - `NEW_DATABASE_URL` = connection string of the **new** Supabase project (destination).  
   You can keep `DATABASE_URL` for other tools; the script only reads `OLD_DATABASE_URL` and `NEW_DATABASE_URL`.

2. Run:
   ```bash
   node supabase/copy-data-to-new-db.js
   ```
3. The script copies, in order: `users`, `divisions`, `leagues`, `player_divisions`, `matches`, `match_results`. Check the script output for errors.

---

## 4. Point the app to the new Supabase project

1. In the **new** Supabase project: **Project Settings** → **API**.
2. Note:
   - **Project URL**
   - **anon** (public) key
   - **service_role** key (keep secret).
3. Update your app env (local `.env` and hosting, e.g. Vercel):
   - `NEXT_PUBLIC_SUPABASE_URL` = new Project URL  
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = new anon key  
   - `SUPABASE_SERVICE_ROLE_KEY` = new service_role key  
4. **JWT_SECRET**: You can keep the same value so existing sessions (cookies) still work. If you change it, all users will need to log in again.

---

## 5. Verify

- Log in with an existing user.
- Check that leagues, divisions, matches, and results look correct (e.g. one admin flow and one player flow).
- Optionally run: `node scripts/check-user.js 'Some User Name'` to confirm a user exists and has the expected role.

---

## Summary checklist

- [ ] New Supabase project created.
- [ ] `DATABASE_URL` set to **new** project → `node supabase/run-migrations.js` run.
- [ ] `OLD_DATABASE_URL` and `NEW_DATABASE_URL` set → `node supabase/copy-data-to-new-db.js` run.
- [ ] `.env` and hosting env updated with new `NEXT_PUBLIC_SUPABASE_*` and `SUPABASE_SERVICE_ROLE_KEY`.
- [ ] Login and one critical flow tested on the new DB.
