# import

Read docs/cli.md. Read docs/replace-parsely.md. Confirm the export is posts, with aggregate metrics. Record dates, timezone, scope and coverage from the source. Inspect the dry run, then remove --dry-run within the operator's import instruction. Never claim a fresh measurement feed was installed.

Run:

```bash
npm run content -- import parsely --publication=<code> --file=imports/posts.csv --start=YYYY-MM-DD --end=YYYY-MM-DD --timezone=Pacific/Auckland --scope="<actual report filters>" --coverage=partial --actor="<operator>" --dry-run
```

Use --json for full values when the human output is trimmed. Never invent data or quietly change reporting scope.
