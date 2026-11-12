# Content Performance for Claude Code

Story results, evergreen refresh decisions and editorial follow-up in a database you own. MIT-licensed software from Enterprise DNA. Works with Claude Code, Codex, OpenCode or Cursor.

| Do it yourself | We customise it | We run it for you |
|---|---|---|
| Free source code. Install, import and run the editorial review. | Your publications, reporting rules, source exports and branded papers. [Get your version built](https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_campaign=parsely). | Installed, connected and operated through Omni by Enterprise DNA. One setup fee, then a retainer. [Book a call](https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_campaign=parsely). |

## What this replaces

The reporting and follow-up desk around published content: import aggregate story results, identify declines, decide what to refresh, assign an editor and keep the evidence. Parse.ly's [WordPress demo page](https://www.parse.ly/wordpress-demo/) lists plans from $3,000 a month, or $36,000 over twelve months. The page does not specify the dollar currency. Its [main pricing page](https://www.parse.ly/pricing/) requests a sales discussion. Checked 12 November 2026. This is a published starting price, not a customer invoice or a personalised quote.

The free base is an independent editorial review system. It does not install a website tracker, attribution engine, live overlay or headline experiment service. Keep an ongoing measurement source and bring its aggregate exports into the review desk. Enterprise DNA can build the continuing feed into your version. No claim is made that this base replaces every Parse.ly feature or that Parse.ly cannot answer a similar analytics question.

## Quick start

Node 22.13 or later. No server or account needed for the demo.

```bash
git clone https://github.com/Enterprise-DNA-OS/content-performance-for-claude-code.git
cd content-performance-for-claude-code
npm install
npm test
npm run demo
npm run content -- morning-brief
npm run content -- declines
npm run content -- actions-due
npm run view
npm run docs
```

The fictional demo contains four stories, two comparable weeks, an old publication with no current export, overdue editorial work and a privacy review date in the past. Seed is idempotent. Never seed production. Shared database seeding requires the explicit --demo-database option to scripts/seed.mjs.

Without DATABASE_URL, PGlite persists under .data/db or DATA_DIR. With DATABASE_URL, the same migration runs on Postgres. Run npm run migrate to create the database. Shared access is for a trusted operator, with row security enabled and public privileges revoked. Named actors are audit labels, not logins. Arrange database roles, backups and tested recovery before shared use.

## The weekly rituals

- `/morning-brief`: the latest story results, reporting period, coverage and open editorial work.
- `/declines`: stories that lost views between comparable adjacent periods.
- `/refresh-queue`: older, still-read stories whose views fell and need an editorial decision.
- `/actions-due`: named owners, agreed dates and late follow-up.
- `/weekly-review`: the morning picture, declines, due work and record checks in one branded draft.

## Ten questions to ask

The CLI answers these today. Editorial ownership and review dates are local records joined to imported metrics, not claims about missing vendor functionality.

1. Which declining story already has an editor assigned? `declines`
2. Which evergreen story still earns views but has no refresh action? `evergreen`
3. Which older stories fell by at least twenty percent? `refresh-queue`
4. Which high-view story has less than thirty seconds of recorded engagement per view? `low-engagement`
5. Which section has the most open editorial work beside its current views? `section-review`
6. Which byline groups have the most views and outstanding actions? `author-review`
7. Which editor owns overdue follow-up? `workload`
8. What evidence closed a refresh task? `completed-actions`
9. Which publication lacks a current export or a comparable prior week? `compliance`
10. Which exact source file and period supplied this story's counts? `story` and `imports`

There are 32 recipes in .claude/commands, including /customise and /new-view. The single CLI exposes 31 commands including help. See [complete syntax](docs/cli.md). Read commands, mutations, import, export and drafts support --json. Exact identifiers, unique prefixes and case-insensitive names resolve records. Ambiguity lists candidates and exits 1.

## Your first hour: ten things to ask for

1. Put our name, logo and colours in brand.json.
2. Run the fictional morning review.
3. Show the source periods behind the declining freight guide.
4. Produce the weekly review paper.
5. Add our publication and its record-retention purpose.
6. Inspect and map one actual Parse.ly posts export.
7. Test the import without writing and reconcile its row count.
8. Bring in the preceding comparable period.
9. Assign an evergreen refresh with its actual owner and date.
10. Add a read-only report for our editorial meeting and arrange backups.

## Source records and calculations

[Switching guide](docs/replace-parsely.md). One import command loads a posts CSV after its dates, timezone, scope and coverage are supplied. A dry run writes nothing. Identical files and settings skip. Any malformed row aborts the batch. Original bytes, raw columns, mapping, hash and source row numbers remain in the database. Tests use a synthetic fixture; validate your real export before switching.

One publication series has non-overlapping immutable reporting windows. Comparisons require equal-length adjacent windows with matching timezone, scope and coverage. Missing stories never become zero views. Blank optional metrics remain unknown. Unique visitors are not summed across stories. Co-authored credits are kept as a group. Seconds per view is a local calculation, not Parse.ly's average engaged time per visitor. Partial exports describe included stories only.

## Branded paperwork and read-only views

npm run docs creates an editorial brief per story and an action register per publication. npm run view creates the editorial week and record-quality report. Change brand.json once. All outputs are escaped HTML, written as private local files. CLI drafts go to drafts/. These files show records and do not change them. [Why no front end](docs/why-no-front-end.md).

## Record checks

[Compliance sources and limits](docs/compliance.md) explains purpose, retention and access-review prompts based on the NZ Privacy Commissioner's principles, plus house rules for stale data, partial coverage, comparable periods and due actions. A clean report means these record checks passed. It is not a legal certification or proof that tracking is lawful. Operators remain responsible for their records and actual safeguards.

Source snapshots, metrics, notes and audit history are append-only through database triggers. Administrators can alter controls, so this is not tamper-proof. Exports contain the complete seven record collections and original source files. This archive is not a restore command. Back up and test recovery separately.

## Validation

npm test runs in a temporary database, clears inherited DATABASE_URL and exercises all commands. It checks arithmetic, real dates, numeric validation, malformed and duplicate CSV rows, unknown optional metrics, original file retention, dry runs, duplicate imports, overlap refusal, transaction rollback, incompatible comparisons, immutable records, audit history, ambiguous names, document generation and HTML escaping. CI runs Node 22 and 24 on Windows and Linux, plus PostgreSQL 16. CONTENT_TEST_POSTGRES_URL is only for an empty disposable test database.

## Installed for you

Enterprise DNA can map the exports, connect ongoing measurement, adapt the editorial rules and operate the system. Omni by Enterprise DNA is one setup fee, then a retainer. [Book Sam's 30-minute call](https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_campaign=parsely).

Independent software, not affiliated with Parse.ly. MIT. Copyright 2026 Enterprise DNA.
