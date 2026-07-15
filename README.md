# Quiz Arcade

Quiz Arcade is an unofficial certification-preparation app. It includes curated 50-question papers for AI-901 and AZ-900, a timed serious mode, guided practice with explanations, a detailed RevisionWiki, local progress, and a secondary community quiz library.

RevisionWiki currently provides 7 AI-901 and 11 AZ-900 objective guides. Pages include blueprint checklists, teaching notes, comparisons, exam traps, quick recall, and official Microsoft Learn references. Reviewed pages, highlights, and notes are stored locally under `quiz-arcade:revision:v1` and can be exported or imported as JSON.

## Development

```powershell
npm install
npm run dev
```

The React client is served by Vite. Vercel functions under `api/` serve the built-in curated papers and use Firestore for community submissions. Copy `.env.example` to your local environment when testing the community or admin APIs.

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
