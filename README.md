# Quiz Arcade

Quiz Arcade is an unofficial certification-preparation app. It includes curated 50-question papers for AI-901 and AZ-900, a timed serious mode, guided practice with explanations, a detailed RevisionWiki, private account progress, and a secondary community quiz library.

Each built-in certification also has a smart study hub. It combines objective-level results, answer confidence, and RevisionWiki progress into a next-best action, certification-wide targeted drills, bookmarks, personal question notes, score trends, XP levels, and meaningful daily streaks.

Arcade Academy turns that evidence into an open certification campaign for both AI-901 and AZ-900. Learners earn study, practice, and mastery stars; complete daily and weekly quests; face exam-style domain and final bosses; collect titles and map tokens; and earn capped rerolls and streak shields. No lessons or challenges are locked. Signed-in progress syncs privately through the account API; guests can explore without persistent progress.

RevisionWiki currently provides 7 AI-901 and 11 AZ-900 objective guides. Pages include blueprint checklists, teaching notes, comparisons, exam traps, quick recall, and official Microsoft Learn references. Reviewed pages, highlights, and notes are part of signed-in account sync and remain exportable as JSON.

The current Semantic Versioning number is shown in the site footer. A new release opens its changelog once per browser, and every release remains available through **Changelog History**. `package.json` is the version source of truth; each feature release adds a matching newest entry to `src/changelog.ts`.

The top-bar appearance picker provides light, light-contrast, dark, dark-contrast, dark-purple, and light-mint themes. The selected palette applies across exams, RevisionWiki, uploads, and admin views and follows a signed-in account across devices.

## What's in Development

This is a directional roadmap rather than a delivery commitment. **Now** covers work actively shipping, **Next** contains the intended follow-on bets, and **Later** holds exploratory ideas. Priorities may move as learner feedback, certification blueprints, and technical discoveries change.

_Last reviewed: 22 July 2026._

| Horizon | Initiative | Outcome | State |
| --- | --- | --- | --- |
| Now | Secure hosted accounts | Add verified email/Google sign-in, private profiles, server sessions, cross-device progress, self-service data controls, and transparent legal pages. | In development — `feature/secure-accounts` |
| Now | Progress migration and portability | Let existing players claim or export frozen browser-local attempts, Study and Academy progress, RevisionWiki data, and preferences. | In development with accounts |
| Next | Another certification campaign | Add a complete Microsoft Fundamentals track spanning mock papers, RevisionWiki, smart study, and Arcade Academy. | Candidate |
| Later | Broader certification catalogue | Make adding and maintaining blueprint-aligned certification content more repeatable. | Exploratory |
| Later | Public player profiles | Explore opt-in public profile pages and discovery; v0.5 keeps profiles private except optional approved-set attribution. | Exploratory |
| Later | Community library improvements | Strengthen discovery, quality signals, and moderation beyond signed-in creator ownership. | Exploratory |
| Later | Social challenges | Explore opt-in friends, shared challenges, and private leaderboards. | Exploratory |
| Later | Offline and mobile | Explore installable offline study and further mobile experience improvements. | Exploratory |

## Development

```powershell
npm install
npm run dev
```

The React client is served by Vite. Vercel functions under `api/` own all Firestore access; checked-in Firestore rules deny direct client access. Copy `.env.example` to your local environment when testing account, community, or admin APIs.

## Account deployment checklist

1. Use separate Firebase projects for development and production. Enable Email/Password and Google providers, enforce the Firebase password policy and email-enumeration protection, and add only the expected authorized domains.
2. Register the web app with reCAPTCHA Enterprise App Check. Deploy first with `FIREBASE_APP_CHECK_ENFORCED=false`, verify valid tokens in logs, then enable enforcement.
3. Deploy `firestore.rules`, confirm the immutable Firestore region, and set `VITE_FIRESTORE_REGION` so the Privacy Policy publishes the correct location.
4. Generate independent high-entropy `CSRF_SECRET` and `CRON_SECRET` values. Configure Vercel firewall rate limits for session creation, account writes, uploads, and the retention endpoint.
5. Verify a Resend sending domain and configure the retention sender. Review Firebase backup retention and deletion behavior before launch.
6. Create the first verified Firebase account, copy its exact UID, then run `npm run admin:grant -- <uid>` from a trusted operator machine. Claims are never assigned from an email address.
7. Have the security-sensitive implementation and the Privacy Policy, Terms, and Community Guidelines independently reviewed before production.

Server sessions use a five-day Secure/HttpOnly/SameSite cookie. State-changing APIs additionally require a signed CSRF token, a matching same-origin request, and App Check when enforcement is enabled. Sensitive profile and deletion operations require a Firebase sign-in less than five minutes old.

## Checks

```powershell
npm run test
npm run lint
npm run build
npm run content:audit
npm run revision:audit
```

`npm run content:build` rebuilds the AI-901 and AZ-900 papers, enriches every question with blueprint metadata and references, then runs the six-paper content audit. Use `npm run content:az900` when only the AZ-900 papers need regenerating.

## Curated exam format

Curated exams use `kind: "exam"` and include an exam code, blueprint version, duration, readiness target, domain weights, and question-level IDs, objectives, difficulty, explanations, and Microsoft Learn references. They may use `multiple-choice` or `multi-select` questions. Legacy community `multiple-choice`, `flashcard`, and `free-write` datasets remain supported.

The mock papers contain original practice content and are not Microsoft exam questions. The 70% readiness target is an app-specific study signal and is not a conversion to Microsoft’s scaled certification score.

RevisionWiki articles are original exam-focused summaries rather than copies of Microsoft Learn. Each course is registered by exam code and uses the same objective IDs as its curated papers, allowing practice feedback and result reviews to deep-link into the matching study page.
