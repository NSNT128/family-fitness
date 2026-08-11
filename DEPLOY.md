# Deploying Family Fitness

This puts the app on the internet at a link you can open on your phone and
share with family. Free tier is plenty.

## One-time: create a Vercel account

1. Go to https://vercel.com/signup
2. Sign up — **Continue with GitHub** is easiest, or use email.
3. Choose the **Hobby** (free) plan when asked. Skip any "invite your team" steps.

## Deploy

Open a terminal in the `family-fitness` folder and run these two commands.

First, install the Vercel tool (only needed once):

```bash
npm install -g vercel
```

Then deploy:

```bash
vercel --prod
```

The first time, it will ask you a few questions. The answers:

- **Log in to Vercel** — pick your signup method; it opens your browser to confirm.
- *Set up and deploy?* — press **Enter** (yes)
- *Which scope?* — press **Enter** (your own account)
- *Link to existing project?* — type **n**, press Enter
- *Project name?* — press **Enter** (accepts `family-fitness`)
- *In which directory is your code located?* — press **Enter** (accepts `./`)
- *Want to modify these settings?* — type **n**, press Enter

After a minute you'll get a link like `https://family-fitness-xxxx.vercel.app`.
That's your app. Open it on your phone.

## Sharing with family

Send them that link. Each person taps **New here? Create an account**, enters
their name, email and a password, and they're in. They see only their own data —
that's enforced by the database, not just the app.

## Re-deploying after each phase

Once set up, shipping a new version is a single command from the same folder:

```bash
vercel --prod
```

## Note on your keys

`.env.production` holds your Supabase URL and anon key, and gets bundled into
the app. That's correct and safe: the anon key is *designed* to be public — it
ends up in the app's JavaScript no matter what, and Row-Level Security is what
actually protects each person's data (verified with a 10-point test).

The key you must **never** share or put in the app is the `service_role` key
from the Supabase dashboard. We don't use it anywhere.

## Security headers

`vercel.json` sets a Content-Security-Policy plus `X-Frame-Options: DENY`,
`X-Content-Type-Options: nosniff`, `Referrer-Policy` and `Permissions-Policy`.
These are applied by Vercel at the edge, so they only take effect on a deployed
build — `npm run dev` won't show them.

The CSP allows `'unsafe-inline'` for scripts and styles. That is deliberate:
`index.html` carries a small inline script that applies the saved theme before
first paint (without it the app flashes the wrong theme), and Tailwind injects
styles inline. Pinning a hash instead would silently break whenever that script
changed. Even with `'unsafe-inline'`, the policy still blocks script loads from
any other origin, framing (`frame-ancestors 'none'`), plugins (`object-src
'none'`), and form posts to third parties — and `connect-src` limits network
calls to this origin and Supabase.

After deploying, confirm the headers are live:

```bash
curl -sSI https://<your-app>.vercel.app/ | grep -i "content-security-policy\|x-frame-options"
```
