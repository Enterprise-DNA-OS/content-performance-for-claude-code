# Content Performance for Claude Code

For a publication's editorial review desk. Read docs/cli.md and the matching recipe. Every answer about records starts with the CLI.

## Rules

- Never send, publish stories, alter tracking, or delete records. Draft locally.
- Read the source period, timezone, scope and coverage before interpreting metrics. Partial exports cover included stories only.
- Never sum unique visitors across stories, treat missing stories as zero, or claim a refresh caused an uplift.
- Source snapshots and notes are immutable. Record corrections in a new labelled series or a new note.
- All writes need a named actor. Names are audit labels, not authenticated identity.
- Never seed a live database. Keep business imports, generated files and credentials out of Git.
- Shared use requires controlled database access, backups and tested recovery.
- PGlite is the local database. DATABASE_URL selects Postgres. These are trusted-operator connections.

## Routing

| Job | Recipe |
|---|---|
| publications | /publications |
| stories | /stories |
| morning-brief | /morning-brief |
| declines | /declines |
| evergreen | /evergreen |
| low-engagement | /low-engagement |
| search-led | /search-led |
| section-review | /section-review |
| author-review | /author-review |
| refresh-queue | /refresh-queue |
| actions-due | /actions-due |
| workload | /workload |
| completed-actions | /completed-actions |
| compliance | /compliance |
| attention | /attention |
| imports | /imports |
| notes | /notes |
| audit | /audit |
| story | /story |
| add-publication | /add-publication |
| add-story | /add-story |
| add-action | /add-action |
| complete-action | /complete-action |
| log | /log |
| review-privacy | /review-privacy |
| import | /import |
| weekly-review | /weekly-review |
| draft-story-brief | /draft-story-brief |
| draft-refresh-list | /draft-refresh-list |
| export | /export |
| customise | /customise |
| new-view | /new-view |

The one CLI is scripts/content.mjs. Run npm run content -- help. Migrations live in supabase/migrations. Documents and views use documents.json, views.json and brand.json.
