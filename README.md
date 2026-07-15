# Quiz Arcade

Quiz Arcade is an unofficial AI-901 exam-preparation app. It includes three curated 50-question mock papers, a timed serious mode, guided practice with explanations, local attempt history, and a secondary community quiz library.

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
```

`npm run content:build` regenerates the base AI-901 papers, applies the distractor pass, enriches every question with blueprint metadata and references, then runs the content audit.

## Curated exam format

Curated exams use `kind: "exam"` and include an exam code, blueprint version, duration, readiness target, domain weights, and question-level IDs, objectives, difficulty, explanations, and Microsoft Learn references. They may use `multiple-choice` or `multi-select` questions. Legacy community `multiple-choice`, `flashcard`, and `free-write` datasets remain supported.

The mock papers contain original practice content and are not Microsoft exam questions. The 70% readiness target is an app-specific study signal and is not a conversion to Microsoft’s scaled certification score.
