# Card Game Platform (Next.js)

Multiplayer card game platform built with Next.js, React, TypeScript, and Firebase.

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Run the development server:

```bash
npm run dev
```

3. Open http://localhost:3000

## Scripts

- `npm run dev` - start Next.js in development mode
- `npm run build` - create a production build
- `npm run start` - run the production server
- `npm run lint` - run ESLint

## Firebase Setup

Update Firebase credentials in `src/firebase/config.ts` before creating or joining games.

## Spec-Driven Development (SDD)

This project includes a lightweight SDD workflow in `docs/specs/`.

- Guide and workflow: `docs/specs/README.md`
- Project-level docs:
	- `docs/specs/project/vision.md`
	- `docs/specs/project/nfr.md`
- Reusable templates:
	- `docs/specs/templates/feature-spec.template.md`
	- `docs/specs/templates/adr.template.md`
	- `docs/specs/templates/test-plan.template.md`
	- `docs/specs/templates/release-checklist.template.md`
- Example filled docs:
	- `docs/specs/features/FEAT-001-game-room-lifecycle.md`
	- `docs/specs/adrs/ADR-0001-nextjs-app-router-migration.md`
	- `docs/specs/qa/TP-001-game-room-lifecycle.md`

### Suggested Feature Workflow

1. Copy `feature-spec.template.md` into `docs/specs/features/` and define requirements/ACs.
2. Add an ADR from template if architecture choices are involved.
3. Copy `test-plan.template.md` into `docs/specs/qa/` and define verification scenarios.
4. Implement against the approved spec.
5. Use release checklist before shipping.
