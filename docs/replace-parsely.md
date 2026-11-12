# Move the editorial review desk from Parse.ly

Checked 12 November 2026 against Parse.ly's [Top Performers Export](https://docs.parse.ly/user-handbook/measuring-reporting-performance/reports-guide/top-performers-export/) and [data sharing and exports](https://docs.parse.ly/user-handbook/tools-features/data-outside-parsely/) documentation.

1. In Parse.ly, use Reports > Top Performers Export, choose posts and CSV, or export from the Posts dashboard. Choose the reporting dates and audience filters deliberately. Record the site timezone. Dashboard exports are limited to 10,000 rows according to the vendor. Use partial coverage unless you have reconciled the export against the intended full set of posts.
2. Save the export privately under imports/. Check that it contains public story metadata and aggregate counts, not audience identifiers or sensitive notes. Canonical story URLs must contain no query strings, fragments or credentials. If your export uses different column labels, write a small mapping file. Retain a separate original before any manual cleaning.
3. Add a publication using `add-publication`. Run the single `import parsely` command in [the CLI guide](cli.md) with `--dry-run`. Inspect row count, dates and coverage. Remove that flag to load the file.
4. Compare the loaded story count, individual views, engaged minutes and source rows against the export. Export the preceding adjacent period with the same duration and filters to enable declines. Read the record checks before trusting a comparison.
5. Run the editorial review alongside your existing process. Keep Parse.ly or another measurement source until the ongoing collection and export feed is agreed, tested and reconciled. Importing history does not continue measuring your website. Enterprise DNA can build that connection into your version.

## What moves

Post URL, title, author credit, section, publication date, views, visitors, engaged minutes and search/social/direct referral counts. Every source row, original file, mapping, hash, reporting window and importer name remain available. Identical bytes plus identical settings skip safely. Malformed rows fail the whole import. Overlapping windows cannot silently inflate counts.

The fixture is synthetic and uses labels documented by Parse.ly. It is not a captured vendor account export. Test your actual export and mapping before switching. The importer accepts CSV, including a BOM, commas inside quotes, doubled quotes and embedded line breaks. XLSX must first be saved as CSV. It does not pretend to accept every Parse.ly report or guess a report's period.

## What needs separate work

Tracking scripts, live collection, conversion attribution, headline experiments, saved filters, permissions, scheduled deliveries and publisher overlays are separate capabilities. The free base is the editorial review record and its weekly paperwork. It is useful with manually supplied aggregate exports. Enterprise DNA can connect a continuing measurement source and build the owner-facing views required by the business.

Original source files can contain personal information, even when the mapped metrics are aggregate. Review the complete export before import. The database and generated documents belong on an access-controlled machine. Do not commit business exports, database files or credentials.
