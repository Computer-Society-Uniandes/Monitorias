# Repository Guidelines

## Project Structure & Module Organization
Source lives under `src/app` following Next.js App Router conventions. Route folders such as `home`, `auth`, and `tutor` expose `page.jsx` entries; shared UI sits in `src/app/components`, contexts in `src/app/context`, hooks in `src/app/hooks`, and service wrappers in `src/app/services`. Styles reside in `src/app/style` plus `globals.css`, while public assets ship from `public/`. Firebase helpers (`src/firebaseConfig.js`, `firestore.rules`) stay at the project root. Add new features inside their route folder first; promote shared logic only after reuse emerges.

## Build, Test, and Development Commands
Use `npm run dev` to boot the Next.js dev server on `http://localhost:3000`. Run `npm run build` to generate the production bundle, then `npm run start` for a local smoke test of that build. `npm run lint` enforces the `core-web-vitals` ESLint preset. Initialize Firebase mocks once with `npm run firebase-init` after supplying `scripts/firebase-init-data.js`.

## Coding Style & Naming Conventions
Match the existing four-space indentation, single-quoted imports/props, and mandatory semicolons. Tailwind classes should flow layout → spacing → color to minimize churn. Components and providers use PascalCase (`TutorDashboard`), hooks start with `use` (`useSchedules`), and config files favor camelCase (`firebaseConfig`).

## Testing Guidelines
Tests rely on Jest with React Testing Library, configured via `src/setupTests.js`. Co-locate specs as `*.test.jsx` beside the component or hook. Favor user-centric assertions (`screen.findByText`) and snapshot only when behavior stabilizes. Run coverage-critical suites with `npx jest --watch` before opening a PR.

## Commit & Pull Request Guidelines
Keep commits concise, present-tense, and often in Spanish imperatives (e.g., `Arreglo tutor redirect`). Squash noisy WIP history. PR descriptions should summarize the change, link the Linear/Jira ticket, confirm lint/build status, list smoke-test steps, and attach UI screenshots when visuals shift. Tag a teammate familiar with the impacted route for review.

## Security & Configuration Tips
Copy `.env.local` from `CALENDAR_ENV_EXAMPLE.md` and never commit secrets. Use the Firebase service account noted in `CALICO_CALENDAR_INTEGRATION.md`, rotating credentials through the shared vault.
