# Family Fitness — Setup Guide (Phase 1)

You only do this once. Takes about 10 minutes. No coding involved — it's all
copy-paste and clicking.

## Step 1 — Create a Supabase account

1. Go to https://supabase.com and click **Start your project**.
2. Sign up (easiest with your Google account, or email + password).
3. If it asks you to create an **organization**, accept the default and continue.

## Step 2 — Create the project

1. Click **New project**.
2. Name: `family-fitness` (anything works).
3. **Database password**: click **Generate a password**, then save it somewhere
   safe (a password manager or note). You won't need it day-to-day, but don't lose it.
4. **Region**: pick the one closest to where your family lives (e.g. `eu-central-1`
   for Europe).
5. Click **Create new project** and wait a minute or two while it sets up.

## Step 3 — Turn OFF email confirmation

So family members can sign up and get straight in without clicking a link in
their email:

1. In the left sidebar click **Authentication**.
2. Click **Sign In / Providers** (under CONFIGURATION).
3. Click **Email**.
4. Turn **OFF** the toggle called **Confirm email**.
5. Click **Save**.

## Step 4 — Copy your two keys into the app

1. In the left sidebar click the **gear icon** (Project Settings), then **API Keys** —
   or go to **Settings → Data API** on older layouts.
2. You need two values:
   - **Project URL** — looks like `https://abcdefgh.supabase.co`
   - **anon / public key** — a long string starting with `eyJ...` (it may be called
     `anon` `public` or "publishable key"; it is safe to use in the app — it is not secret)
3. In the `family-fitness` folder, find the file `.env.example`. Make a copy of it
   and rename the copy to exactly: `.env.local`
4. Open `.env.local` in Notepad and paste your values so it looks like:

   ```
   VITE_SUPABASE_URL=https://abcdefgh.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...the-whole-long-string...
   ```

   No quotes, no spaces around the `=`.

## Step 5 — Create the database table

1. In the Supabase left sidebar click **SQL Editor**.
2. Open the file `supabase/phase1.sql` from the `family-fitness` folder.
3. Copy **everything** in it, paste it into the SQL Editor, and click **Run**.
4. You should see "Success. No rows returned". That's correct.

## Step 6 — Grant table access

Because "Automatically expose new tables" is off (the safer setting), logged-in
users need to be granted access to each table explicitly. In the SQL Editor,
paste the contents of `supabase/phase1-fix-grants.sql` and click **Run**.

(This is already included in `phase1.sql` now, so a fresh setup only needs
one script. This step is only for projects created before that fix.)

## Step 7 — Put it online

See `DEPLOY.md` to publish the app so your family can sign up from their phones.
