# Record checks and their sources

These checks prompt a person to review the records. They do not certify Privacy Act compliance, consent, lawful tracking or editorial accuracy. The database contains public author credits and staff notes as well as aggregate audience counts. An organisation must assess which laws and exemptions apply to its activities, including news-media activities. The three privacy checks are conservative operating prompts, not a legal conclusion about that organisation.

Sources checked 12 November 2026:

| Rule | What the command checks | Source and boundary |
|---|---|---|
| P01 | Missing purpose for retained bylines and editorial notes | NZ Privacy Commissioner [Principle 1](https://www.privacy.org.nz/privacy-principles/1/): collect only information needed for a lawful organisational purpose. A recorded purpose is not proof of lawfulness. |
| P09 | Missing or overdue retention review date | [Principle 9](https://www.privacy.org.nz/privacy-principles/9/): personal information must not be kept longer than required. The review date is operator-set, not a statutory retention period. Nothing is automatically deleted. |
| P05 | Missing or overdue access and backup review date | [Principle 5](https://www.privacy.org.nz/privacy-principles/5/): reasonable safeguards against loss and unauthorised access or disclosure. The command checks the review record, not the actual effectiveness of safeguards. |
| D01 | No export or latest period over fourteen days old | House freshness rule. Fourteen days is not a legal deadline. |
| D02 | Partial export | [Parse.ly exports](https://docs.parse.ly/user-handbook/tools-features/data-outside-parsely/) can be bounded. Partial data cannot establish whole-site totals. |
| D03 | No adjacent comparable reporting period | House arithmetic rule: same duration, timezone, scope and coverage. No comparison across a gap or changed audience filters. |
| D04 | Open editorial action past its due date | The owner's recorded commitment, not a statutory deadline. |

## Access and evidence

All application tables have row security enabled and public privileges revoked. The intended connection is a trusted database owner/operator. The free base is not a multi-user access-control service. Named actors are labels, not verified identities. Configure roles, backups and access controls before shared use. Source snapshots, metrics, notes and audit entries are append-only through database triggers. A database administrator can change these controls; do not call the system tamper-proof.

Do not enter reader-level tracking data. The importer rejects common audience-identifier headers and URLs with queries, fragments or credentials. That is an input boundary, not an exhaustive personal-information scanner. Operators review all raw columns before import. Review source retention separately, then handle any approved disposal under the organisation's own procedure.
