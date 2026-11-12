# Command reference

Use `npm run content -- <command>`. Flags use `--name=value`; quote values containing spaces. `--json` returns full records. Human output trims long cells. Read a record before changing it. Every write requires `--actor="Name"`; the actor is an audit label, not authenticated identity.

## Reads

`publications`, `stories`, `morning-brief`, `declines`, `evergreen`, `low-engagement`, `search-led`, `section-review`, `author-review`, `refresh-queue`, `actions-due`, `workload`, `completed-actions`, `compliance`, `attention`, `imports`, `notes`, `audit`.

`story "Coastal freight"` includes all imported periods, actions and notes. References accept exact UUID, unique UUID prefix, case-insensitive title/name/code or a unique partial title/name/code. Exact matches win. An ambiguous or missing reference lists candidates and exits 1.

## Writes

```bash
npm run content -- add-publication --code=JOURNAL --name="Our journal" --purpose="Review story performance and editorial work" --privacy-due=2027-01-01 --access-due=2027-01-01 --actor="Editor"
npm run content -- add-story --publication=JOURNAL --url=https://journal.example/guide --title="Freight guide" --author="Mere Lane" --section=Guides --published=2026-01-01 --actor="Editor"
npm run content -- add-action --story="Freight guide" --code=REFRESH-1 --description="Check citations and update examples" --owner="Mere Lane" --due=2026-12-01 --actor="Editor"
npm run content -- complete-action --action=REFRESH-1 --completed=2026-11-12 --evidence="Checked every citation against the current sources" --actor="Editor"
npm run content -- log --story="Freight guide" --body="Reviewed the source links" --actor="Editor"
npm run content -- review-privacy --publication=JOURNAL --purpose="Review public bylines and editorial follow-up" --privacy-due=2027-01-01 --access-due=2027-01-01 --evidence="Reviewed access list, backup restoration and retention purpose" --actor="Editor"
```

Completion requires evidence and a real date no later than today. Completed actions stay complete. Record corrections as a note and a new action. No command publishes a story, changes the website, sends a message or deletes records.

## Import

```bash
npm run content -- import parsely --publication=JOURNAL --file=imports/posts.csv --start=2026-11-01 --end=2026-11-07 --timezone=Pacific/Auckland --scope="Posts, all traffic, all audiences" --coverage=partial --actor="Editor" --dry-run
```

Remove `--dry-run` to write. Add `--mapping=imports/columns.json` for different column labels. Mapping keys: url, title, author_credit, section, published_on, views, visitors, engaged_minutes, search_refs, social_refs, direct_refs. Values are exact CSV column labels. Required fields: URL, title, views. Dates use YYYY-MM-DD. Snapshot dates, timezone, scope and coverage are supplied explicitly because the CSV need not carry them. See [switching guide](replace-parsely.md).

Default aliases accept URL, Post URL or Link; Title or Post Title; Author or Authors; Section; Published, Publish Date or Publication Date. Metric names use the documented Views, Visitors, Engaged minutes, Search refs, Social refs and Direct refs headers. Optional blank metrics remain unknown, never zero. Raw source columns and original bytes are preserved privately. Check the source for personal information before loading it. Individual audience identifier columns are rejected, but this is not a general personal-information detector.

## Documents and export

`weekly-review`, `draft-refresh-list`, and `draft-story-brief "story reference"` create branded HTML in drafts. `npm run docs` renders a brief per story and an action register per publication. `npm run view` renders the editorial week and record checks. Set OUTPUT_DIR to keep generated files elsewhere. No server runs.

`export --out=exports/2026-11-12` writes seven JSON collections, including source bytes and audit history. It refuses an existing directory. This is a portable record archive, not a database restore utility. Back up the database separately and rehearse recovery.

## Interpretation

- Views are imported counts, never a new tracking measurement. Visitors stay at story-and-period level and are never added across stories.
- Seconds per view is engaged minutes multiplied by sixty and divided by views. It is not Parse.ly's average engaged time per visitor. Zero views produces unknown.
- The latest snapshot per publication supplies current reads. Older imports never replace a later period.
- Declines require two adjacent, equal-duration windows with identical timezone, scope and coverage. A missing story is not zero traffic. Baselines of zero have no percentage change.
- An author credit is kept exactly as supplied. Co-authored bylines are a single group, not split and counted twice. Section and author totals cover included stories only.
- Evergreen means at least 90 days old with 100 views in the latest period. Low engagement means under 30 seconds per view and at least 100 views. Refresh queue adds a decline of at least 20%. These are editable house rules, not industry benchmarks.
- Referral counts are shown as imported. No channel attribution, deduplication, user tracking or causal uplift calculation is invented.
- Immutable snapshots deliberately reject overlapping dates. A changed source or filtered report belongs in a separate publication series, with its scope labelled clearly.
