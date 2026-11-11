# In-app notification inbox: costs, capabilities, and operating demands

Research observed **2026-11-11**. Planning evidence, not an infrastructure decision or implementation.

Question: [Research first-party versus managed notification costs and capabilities](https://github.com/NorbertHipfl/cohort-005-project/issues/5), under [Plan an in-app notification inbox for Student progress and course conversations](https://github.com/NorbertHipfl/cohort-005-project/issues/1).

This document lives only on the throwaway [research/in-app-notification-costs branch](https://github.com/NorbertHipfl/cohort-005-project/tree/research/in-app-notification-costs). No PR; never merge it. There was no existing research-notes directory, so `docs\research` is used.

## Result in brief

- **First-party SQLite/Drizzle is a credible baseline**, not an already-existing inbox: persist per-recipient rows and read state, expose authenticated fetching/actions, and optionally poll. No incremental database licence subscription is required, but design, testing, backups, retention, capacity and incident response remain application work. This is a feasibility assessment, not a selection. [L1–L5, S1–S5]
- **Novu Community is a credible open-source/self-hosted alternative**, with inbox components, state, digests and realtime. Its MIT core is distinct from proprietary enterprise code. It adds MongoDB, Redis, API/worker/websocket/dashboard operations to this one-process SQLite app; cloud features are not all available in Community. Zero Novu core licence fee does not mean zero hosting or maintenance. [N3–N7, N10]
- **Knock**, suggested prospectively by this repo's README, provides a managed per-user feed and realtime. Observed Free: 10,000 sent messages/month. Starter: $250/month including 50,000, then $0.005 per additional message. **Novu Cloud** observed Free: 10,000 recipient workflow runs/month; Pro from $30 including 30,000, Team from $250 including 250,000; both advertise $1.20/1,000 additional runs. These are different units, not interchangeable forecasts. [L1, K1, N1–N2]
- Neither managed provider knows this application's course-access rules automatically. Signed recipient authentication, server-selected recipients, source authorization, stale-content handling and reliable submission from the app still need explicit design. [L4–L5, K3, N8–N9]
- No hosting, budget, volume, retention or provider has been chosen. Email, mobile push, SMS, competitive points and leaderboards are excluded. Existing Postmark changes none of that.

## Evidence and price confidence

Primary sources were fetched directly on the observation date. Pricing pages do not establish a contractual effective date or guarantee future charges. Treat these as **observed advertised prices**, not a quote valid indefinitely or an archived historical price schedule. Recheck before any human commitment; taxes, currency conversion, negotiated discounts and additional contractual terms are not verified.

A separate direct HTTP fetch returned Knock pricing `Date: Wed, 11 Nov 2026 12:51:45 GMT`, `Age: 74`, and `Last-Modified: Wed, 11 Nov 2026 12:50:30 GMT`; Novu pricing returned `Date: Wed, 11 Nov 2026 12:28:25 GMT`, `Age: 70`. These show cached responses, not independently authenticated price-change dates. The session's date is 2026-11-11; date headers alone cannot prove commercial freshness. No future availability promise is treated as shipped functionality.

Novu's pricing grid was checked against its HTML `aria-label` cells to avoid confusing **Activity feed retention** (execution/debug logs) with **Inbox feed retention** (recipient-visible messages). Some Novu docs disagree on digest-window limits: pricing advertises Team 90 days while the digest guide says 30 days. This comparison therefore does not promise a particular maximum digest window; obtain confirmation if it matters. [N1, N12]

No accounts were provisioned, software deployed or vendor behaviour load-tested. Findings describe documented capabilities; integration, failure recovery and complete export need acceptance tests before selection. Initial guessed documentation URLs that returned 404 were replaced by canonical links discovered in the providers' indexes; they are not evidence of missing product capabilities.

## Verified local baseline

Local revision: [`08ed53f3339705b0d2f2c72366be3de95d75bbac`](https://github.com/NorbertHipfl/cohort-005-project/tree/08ed53f3339705b0d2f2c72366be3de95d75bbac).

| Evidence | What it establishes |
| --- | --- |
| README and package manifest [L1–L2] | React Router SSR/TypeScript, Drizzle and better-sqlite3; React UI. README suggests signing up to Knock later, not an implemented integration or user commitment. |
| SQLite ADR and connection module [L3] | One application server process and a local `data.db`; synchronous better-sqlite3 accessed through Drizzle; connection enables WAL and foreign keys. A separate service is not required merely to store an inbox. |
| Schema [L4] | Student lesson progress/completion, enrollment `completedAt`, quiz attempts, and lesson comments with one-level replies exist. Comments have edit/soft-delete timestamps. Those are potential event inputs, not agreed notification triggers. |
| Lesson route, access module and Instructor queue [L5] | Course content/comments have access checks; access considers session, enrollment, staff ownership and PPP country restrictions. An existing Instructor unanswered-questions queue queries discussion state. Notification read state must not silently replace this queue or imply a reply. |
| Inspected schema, dependencies, connection and routes [L2–L5] | No persistent notification inbox, queue or realtime facility was found in this inspected scope. This is not a claim that every repository file was exhaustively audited. |
| Mailer [L6] | Postmark transport exists for current transactional mail; no email channel is included in this research's design or costs. |

## Capability comparison

“Would build” below is proposed first-party work, **not current functionality**.

| Dimension | First-party in existing app | Novu Community self-hosted | Knock managed | Novu Cloud managed |
| --- | --- | --- | --- | --- |
| Inbox and read state | Would build recipient-owned persistent rows/read timestamp, pagination, unread count and actions; no sender-visible receipts required. | Inbox/bell/preferences components documented in Community; SDK supports read/unread, archive and counts. Check selected release for parity. [N4, N9] | Per-user feed, counts, read/seen/archive status, filters; prebuilt React or headless. [K2] | Inbox or headless hooks, read/unread/archive/bulk actions and counts; seen is distinct from read. [N9] |
| Recipient authorization | Would derive recipient identity from authenticated session and scope every list/count/mutation by ownership; recheck source-course access. | Enable HMAC and mint subscriber signatures only after app authentication; constrain any context server-side. Community dashboard roles are separate from end-user access. [N4, N8] | Enable enhanced security mode before production: default public-key mode can act as any user. Backend-signed JWT with expiry and explicit grants; scope feed access. [K3] | Enable HMAC; otherwise public app ID plus guessed subscriber ID can expose inboxes. Context signatures needed when context is used. [N8] |
| Event ingestion | Would call shared app logic at agreed domain transitions; same-file transaction can persist source change and notification together. Time-based reminders require scheduling not currently found. [L3–L5, S4] | Backend trigger API/SDK, subscribers/topics, queued worker processing. Point SDK at own API. [N5, N11] | Backend trigger API with recipients/data/actor/tenant; workflows generate messages. [K4] | Same trigger model; one run per matching recipient, not per HTTP request. [N2, N11] |
| Grouping | Would implement deduplication/grouping per recipient/course/thread if desired. UI grouping is not a durable timed digest. | Digest supported in Community. Windows and release-specific flags need verification. [N4, N12] | Batch by recipient plus optional data key; digest windows delay output. [K5] | Digest by subscriber plus optional payload key. Every digested input run remains billable. [N11–N12] |
| Retention | Would define expiry/purge plus read-state retention; retained rows and WAL/backups consume disk. Unlimited is not a cost-free default. | Activity retention is infrastructure-dependent; do not assume Cloud TTLs or unlimited inbox history. Inspect/configure expiry in chosen release and test restore. [N4, N10] | Pricing advertises unlimited feed retention, configurable; retention docs confirm old feed items remain fetchable after message logs expire. Logs normally 30 days, Enterprise 90. Exact custom retention control requires confirmation because retention docs warn custom windows are unsupported. [K1, K6] | Inbox: Free 30 days, Pro/Team 90 days, Enterprise custom. Activity logs: Free 24h, Pro 7 days, Team 90 days. Persistent does not mean indefinite. [N1] |
| Polling/realtime | Would begin with navigation/on-open fetch or periodic polling if accepted; SSE/websockets are additional connection/reconnect/proxy work, not necessary for persistence. | API fetching plus own WS service; maintain ingress, TLS, reconnect and capacity. [N3, N5, N9] | REST feed fetching and managed websocket updates. Prebuilt or custom UI. [K2, K8] | Fetch/list APIs plus websocket-driven UI/count updates; cloud and self-hosted socket implementations differ. [N9] |
| Reliability | Could make immediate source+notification writes atomic, with a durable uniqueness key. Failed transactions must not silently lose domain work; test chosen policy. Scheduled/asynchronous or remote work needs durable outbox/retry/reconciliation. | Queue/worker/job states provided; Redis persistence, MongoDB backups and recovery are operator responsibilities. Compose alone is not a durable production design. [N3, N6, N11, N13] | Documented trigger idempotency window 24h; sending pipeline has retry policy. This does not close the app-commit/API-call gap or prove browser receipt/read. [K4, K7] | Inbox is stored internally and pushed via WS, not sent to an external channel provider. API idempotency is documented but not enabled for all organizations; verify activation. Do not equate transaction ID with API-layer deduplication. [N11, N13–N14] |
| Licence/subscription | SQLite public domain; better-sqlite3 MIT; Drizzle Apache-2.0. No new notification licence fee for this baseline; existing app licence remains separate. [S1–S3, L1] | MIT core; enterprise folder/code and EE packages have separate commercial/proprietary terms. Community features are not all Cloud features. Enterprise self-hosted price unknown, quote required. [N2, N4, N7] | Managed commercial service. Public SDKs are not a licence to self-host the backend; no community backend deployment option established by reviewed docs. [K1–K2] | Commercial managed service with a free tier; open-source Community is a different hosting/feature offering. Enterprise on-prem is separately licensed. [N2, N4] |
| Hosting | Existing persistent filesystem/single-host model; cannot move WAL onto a shared network filesystem. Additional load can compete with lesson requests and writes. [L3, S5] | Separate notification stack; chosen hardware/region, backup, security and upgrades belong to operator. Not a SQLite plugin. [N3–N6, N10] | Vendor-hosted; dedicated infrastructure is contact-sales. EU residency is documented as “coming soon” by end of 2026, **not verified available**. Confirm region/DPA before sending course/user data. [K1, K10] | US/EU residency advertised; production docs specify EU API/socket endpoints. Other regions/enterprise deployments require agreement. [N1, N8] |
| Exit/export | Own SQL rows/read state, source IDs and backup/export; schema migration and replacement UI still cost effort. | Own MongoDB data/backups and MIT code; remapping vendor schema, templates and read state is still work. Enterprise-code rights do not transfer with an MIT core. [N6–N7] | Paginated feed API can extract available feed items; full account export/faithful state reimport not established. Warehouse analytics export is Enterprise-only and is not proof of portable inbox restore. [K8–K9] | SDK can list/paginate notifications with state filters; this is not a guaranteed bulk archive or migration service. Verify complete retained-state export/reimport with vendor; expired inbox items cannot be assumed recoverable. [N1, N9] |

### Reliability boundaries that matter for in-app only

An API success, persisted inbox message, websocket notification, fetched feed and human read are different milestones. Neither vendor nor first-party fetching can reach a Student who is not visiting the app.

First-party same-transaction storage avoids the particular “source committed but external trigger never sent” gap for immediate same-database events. It does not create exactly-once domain events automatically: browser/action retries, fan-out and source edits still require uniqueness and policy. Drizzle documents transactions; the current synchronous driver needs its own compatible transaction usage, not blindly copied async examples. [S4, L3]

For either remote notification service, a naive “commit source, then call provider” can lose events on process failure; reversing that order can notify for rolled-back changes. A transactional outbox with stable event IDs, bounded backoff, reconciliation and observable failures is one possible remedy, not a chosen implementation. It introduces work even when the vendor owns its downstream queue. Idempotency cache expiry means replaying after 24 hours needs application-level care. [K4, N14]

Knock documents up to 8 sending retries over 30 minutes for retryable failures. Those are sending-pipeline/provider semantics, **not a promise to replay a missed in-app websocket frame**. Novu documents stored in-app messages plus WS push, and no external-provider send retry is involved for Inbox. Its separate bridge retry policy and external-channel send policy must not be marketed as an in-app exactly-once guarantee. Re-fetch authoritative persisted state after reconnect and define acceptable latency/loss/duplication; neither was load-tested here. [K2, K7, N13]

Neither service grants course membership. Minimize any copied comment content; a notification can leak information before a protected link is clicked. Recipient changes, edited/deleted comments, country/access changes and stale links need a policy for feed content as well as destination authorization. Client-side tabs/filters are not authorization. These questions already belong to the open human tickets, rather than a new duplicate ticket.

## Dated price ledger: separate fees from operations

All managed amounts below are advertised **USD/month**, observed 2026-11-11, before unverified taxes/conversion. In-app inbox only: **no guides, agents, email, push, SMS or downstream Postmark charges**.

| Option | Licence/service fee | Infrastructure expenses | Ongoing operational effort |
| --- | --- | --- | --- |
| First-party | $0 incremental notification/database licence fee for described existing stack. [S1–S3] | **Unknown** incremental CPU/RAM, persistent disk, WAL, backup copies, storage requests and transfer; existing spare capacity can reduce marginal expense but is not assumed. | Implement/maintain auth, state/UI, events, queries, dedupe, retention, migrations, observability and restore. Scheduler/queue/realtime only if requirements justify them. No exact hours estimated. |
| Novu Community | $0 Novu core licence fee; licence obligations remain. Enterprise/on-prem additions: **unknown quote**. [N2, N7] | **Unknown** compute for API/worker/WS/dashboard, MongoDB, Redis, backup/monitoring, network and optional object storage. | Patch multiple services/datastores, secure dashboard/API, preserve queues, run migrations, test restore, handle failed jobs and upgrade SDKs. [N3–N6, N10] |
| Knock Free | $0, up to 10,000 **sent messages**, unlimited stored profiles/workflows; branding remains. [K1] | Inbox provider infrastructure included; application integration/hosting/outbox and network still remain. | Vendor runs notification platform; app owns source events, authorization, signed tokens, usage monitoring and recovery. |
| Knock Starter | $250 includes 50,000 sent messages; $0.005/additional sent message. Enterprise volume/user-based pricing is a quote. [K1] | As above; dedicated infrastructure requires sales. | Same app obligations plus billing/contract/exit management. |
| Novu Cloud Free | $0, 10,000 **recipient workflow runs**, 5 workflows, 2 environments; 60 trigger RPS advertised. Free stops at limit with HTTP 402. [N1–N2] | Managed platform included; app remains. | App integration/monitoring; react to cap rather than silently losing notifications. |
| Novu Cloud Pro / Team | Pro **from** $30 with 30,000 runs; Team **from** $250 with 250,000 runs; $1.20/1,000 additional runs advertised on both. Pro 20 workflows; Team 100 subject to pricing footnote/contract. [N1] | Managed platform included; app remains. | Paid overages normally continue, unless configured usage limit pauses runs. All environments aggregate into organization usage. [N2] |

**Free-tier policies differ.** Knock says it does not hard-cap messages and will contact an over-limit Free customer about billing next month. Its reviewed page does not specify a self-contained permanent Free overage tariff or guarantee remaining free after 10,000; obtain confirmation rather than extrapolating one. Novu explicitly rejects new runs on Free after 10,000. A free-tier limit is therefore a reliability/budget boundary, not just a price comparison. [K1, N2]

**Self-hosting sizing is not a price quote.** Novu recommends a single-VM setup with 4 vCPU/8 GB for its services, plus MongoDB 2 GB RAM/20 GB disk and Redis 2 GB with AOF; it also describes object-storage capacity and a larger multi-VM topology. These are vendor recommendations, not measured requirements for these scenarios or an assurance all resources fit inside 8 GB. Object storage is used for attachments/assets; no attachments are assumed for this inbox. The Docker guide says attachment-free triggers succeed without a reachable attachment bucket, while recommending production storage configuration. Confirm the selected build's needs rather than inventing a monthly VM figure. [N3, N5]

**Specific production caveat:** the inspected Community Compose revision pins Novu services to `3.19.0`, but its Redis service has no AOF command or persistent volume; only MongoDB has a named volume. The docs recommend AOF for queue durability. Treat that sample as a starting point, not verified durable deployment. No deployment was performed. [N3, N6]

### Cost formulas when hosting/rates are unknown

For each option, compare costs over the **same chosen horizon**, including migration/exit:

`total = initial engineering effort × agreed internal rate + monthly licence/service fees + incremental infrastructure + ongoing effort × internal rate + exit effort/cost`

For first-party:

`monthly infrastructure delta = extra compute + disk/WAL + backup storage/requests + transfer + monitoring`

For self-hosted Novu:

`monthly infrastructure = service compute + MongoDB + Redis + persistent volumes + backups + optional object storage + transfer + monitoring`

Do not double-count separately billed datastores if included on a VM, or assume a free hosting allowance exists. Needed quote inputs: region, HA requirement, compute/memory, disk/IOPS, backups/retention, traffic/egress, support and operator responsibility. Existing hosting price/capacity is unknown.

At steady state, a planning storage approximation is:

`retained recipient rows ≈ monthly delivered recipient messages × retention days / 30`

`storage ≈ retained rows × measured bytes per indexed row + WAL headroom + backup copies`

For Novu, include subscriber, workflow/job/log metadata and datastore overhead rather than treating one workflow run as one SQL row. No bytes-per-message or dollar storage rate was measured. Benchmark query latency, write contention and restore time before declaring a growth capacity.

## Illustrative scenarios — not forecasts or budgets

Assumptions for **all** rows: a 30-day month, one immediate in-app-only workflow/notification per matching recipient, no grouping, preferences suppression, retries causing new billable runs, guides, agents or other channels. Fan-out is counted; active users do not themselves determine either bill. Development/test traffic is set to zero solely for this arithmetic, not promised free. Actual event frequency/recipients must come from the human event matrix.

Let `E` = source events/month, `f` = average recipients/event, `R = E × f` = recipient workflow runs. Here `M = R` delivered inbox messages only because the scenario assumes every run delivers one. This equality breaks with batching, suppression or multiple in-app channels.

| Scenario | Illustrative active users | Source events/month × recipients/event | Recipient runs and delivered messages/month | First-party licence / 90-day retained-row illustration | Community licence / hosting | Knock advertised plan calculation | Novu Cloud advertised calculation |
| --- | ---: | ---: | ---: | --- | --- | --- | --- |
| Small | 100 | 1,000 × 2 | 2,000 | $0 / about 6,000 rows; hosting/effort unknown | $0 core; hosting/effort unknown | Free $0, if branding/other requirements fit | Free $0, if 5-workflow and 30-day inbox retention fit |
| Medium | 1,000 | 10,000 × 3 | 30,000 | $0 / about 90,000 rows; hosting/effort unknown | $0 core; hosting/effort unknown | Starter $250; Free allowance exceeded | Pro starting-price calculation: $30, no run overage |
| Growth | 10,000 | 100,000 × 5 | 500,000 | $0 / about 1,500,000 rows; capacity unproven, hosting/effort unknown | $0 core; sizing/operations quote needed | $250 + 450,000 × $0.005 = **$2,500** | Pro: $30 + 470 × $1.20 = **$594**; Team: $250 + 250 × $1.20 = **$550** |

Managed figures are advertised base-plan arithmetic [K1, N1–N2], not recommendations, account quotes or an assertion the cheapest plan meets access/retention/feature requirements. The first-party 90-day figure is a sizing illustration, **not a retention decision**. It is not equivalent to Novu Free's 30-day retention or Knock's advertised unbounded feed history.

### Thresholds and sensitivity

- With one output per recipient, both advertised free volume allowances are crossed at `E × f > 10,000`. At fan-out 5, 2,000 source events exhaust that allowance. Knock bills **delivered messages**, Novu bills **recipient runs**; suppressed workflow steps can still count for Novu. Novu development/production runs share the allowance. [K1, N2, N11]
- Knock Starter formula for this scope: `$250 + $0.005 × max(M − 50,000, 0)`. This is not a verified Free-overage tariff. [K1]
- Novu Pro formula: `$30 + $1.20 × max((R − 30,000) / 1,000, 0)`; Team: `$250 + $1.20 × max((R − 250,000) / 1,000, 0)`. These use advertised starting tiers; billing rounding/selected volume-package terms need confirmation. Scenario overages use whole thousands. [N1]
- Under those base formulas alone, Team's $250 equals Pro at about **213,334 runs/month**; above that Team costs less, assuming identical required features and no negotiated volume package. Team may be needed earlier for non-volume reasons. This is arithmetic, not a buying recommendation.
- Grouping 10 inputs per recipient into one delivered inbox message could reduce Knock's delivered-message count approximately tenfold **if implemented as one output**, but Novu explicitly bills all 10 input runs. A grouped UI alone reduces neither unit. Recalculate from actual outputs and workflow structure. [K1, K5, N11–N12]
- There is **no verified first-party/self-hosted versus SaaS break-even volume**: hosting quotes and valued development/maintenance time are missing. Solve `first-party/self-host total cost = managed total cost` using the horizon and agreed internal rate, not licence fee alone.

### Polling load is separate from notification generation

For an illustrative **60-second polling** interval and average 5 / 50 / 500 simultaneously visible inbox clients, each present for 8 hours/day over 30 days:

`poll requests/month = clients × 8 × 3,600 × 30 / 60`

This yields **72,000 / 720,000 / 7,200,000 requests/month**, about **0.083 / 0.833 / 8.333 requests/second during that window**. These clients/time assumptions are invented sensitivity inputs, not usage estimates tied to the active-user scenarios. Navigation-only/on-open fetching avoids background polling but changes freshness; visibility-aware polling reduces waste. Network/hosting costs require real request/response sizes and rates.

Websockets trade polling for connection management, heartbeats, reconnect/refetch and proxy/service capacity. They do not eliminate storage, fetching or authorization. Provider price pages meter messages/runs, not the hypothetical poll count; this does not establish unlimited request rate or waive API rate limits. [K2, K8, N1, N9]

## Integration, maintenance and exit work

**Common work regardless of vendor:** choose trigger/recipient rules; distinguish current personal progress from discussion events; enforce course access and recipient ownership; preserve the Instructor unanswered queue; define unread/read semantics; integrate accessible UI with React Router SSR/client hydration; handle stale links and source deletions; test cross-user isolation; monitor failures; specify retention/privacy/deletion. No vendor signup replaces these decisions.

**First-party emphasis:** own schema/index design, transaction semantics, pagination, read/count consistency, dedupe and eventual purge. Own database backup/restore and capacity. SQLite's online backup API or other documented live-backup mechanism should be considered; casually copying an active WAL database is not a restore strategy. The existing single-host constraint remains even if notification volume is modest. [L3, S4–S6]

**Community emphasis:** operate the app **and** notification stack. Secure API/dashboard ingress and secrets, HMAC, TLS, durable Redis, MongoDB backups, telemetry/privacy settings, upgrades, migrations and rollback. Novu docs say self-hosted migrations are manual and not automatically run by images, and warn release notes are not exhaustive. Match source/image/SDK versions; do not treat Cloud documentation as proof a chosen Community build has every feature. [N4–N6, N8, N10]

**Managed emphasis:** own integration, identity signing, outbox/recovery, vendor outage behaviour, rate limits, privacy agreement, billing alerts and price-change review. Vendor owns its platform operations, not this application's source-event durability. Neither Free branding nor future paid plans should be accepted implicitly.

**Exit acceptance checklist before any commitment:**

1. Keep application-owned stable event/source/recipient IDs and document mappings to provider IDs; agree whether read state/history must survive replacement.
2. Verify extraction of all **retained** items, unread/read/archive state, grouping members and custom payloads, with pagination and rate-limit handling. Read APIs are extraction primitives, not an all-account export guarantee.
3. Verify destination import can preserve state/timestamps and prevent replay duplicates. Test a representative sample including grouped, archived and access-revoked items.
4. Account for expired data, retained logs versus inbox items, contract/transfer charges, temporary dual running and deletion confirmation.
5. Managed bulk export charges and migration services are **unknown** unless contracted; request scope/price rather than assuming free. Knock's Enterprise warehouse export is analytics-oriented, not automatically a portable replacement inbox. [K6, K8–K9, N1, N9]

## Remaining uncertainty and human-owned next steps

No new fog ticket is necessary: the relevant live tickets already cover the newly exposed conditions.

- [Choose notification triggers and recipients](https://github.com/NorbertHipfl/cohort-005-project/issues/2): event matrix, fan-out, self-notifications, progress milestones and time-based reminders determine actual work/volume.
- [Define inbox behavior and access boundaries](https://github.com/NorbertHipfl/cohort-005-project/issues/3): read versus seen, grouping, retention, changed access, removed comments and portable history; determine whether 30/90-day vendor retention fits.
- [Set notification workload, reliability, and budget expectations](https://github.com/NorbertHipfl/cohort-005-project/issues/4): latency, peak rate, acceptable loss/duplication, hosting region/privacy, maintenance owner, capacity quotes and recurring-spend ceiling. Include free-tier exhaustion and outbox recovery policy.
- [Choose first-party or managed notification infrastructure](https://github.com/NorbertHipfl/cohort-005-project/issues/6): human choice only after prerequisites; compare dislike of recurring paid services against valued operating effort. Open-source is welcome but not automatically chosen.

Specific procurement/verification uncertainties: actual account price and overage rounding; Knock Free over-limit arrangement and EU residency availability; exact configurable retention controls; Novu idempotency activation/Community release support and digest-limit discrepancy; complete export/reimport and any fees; hosting/support quotes. These are visible limits of this factual research, not a claim every operational requirement is already specified. No access limitation prevented answering the ticket's comparative question.

## Primary-source register

Local sources are pinned to the inspected revision. External docs/prices were observed 2026-11-11; moving documentation may change.

### Local architecture

- **L1:** [README, including prospective Knock signup and repository licence](https://github.com/NorbertHipfl/cohort-005-project/blob/08ed53f3339705b0d2f2c72366be3de95d75bbac/README.md).
- **L2:** [package.json](https://github.com/NorbertHipfl/cohort-005-project/blob/08ed53f3339705b0d2f2c72366be3de95d75bbac/package.json).
- **L3:** [SQLite/Drizzle ADR](https://github.com/NorbertHipfl/cohort-005-project/blob/08ed53f3339705b0d2f2c72366be3de95d75bbac/docs/adr/0006-one-sqlite-file-through-drizzle.md); [database connection](https://github.com/NorbertHipfl/cohort-005-project/blob/08ed53f3339705b0d2f2c72366be3de95d75bbac/app/db/index.ts).
- **L4:** [Schema: progress, enrollment, quiz attempts and comments](https://github.com/NorbertHipfl/cohort-005-project/blob/08ed53f3339705b0d2f2c72366be3de95d75bbac/app/db/schema.ts).
- **L5:** [Access rules](https://github.com/NorbertHipfl/cohort-005-project/blob/08ed53f3339705b0d2f2c72366be3de95d75bbac/app/lib/access.server.ts); [lesson/discussion route](https://github.com/NorbertHipfl/cohort-005-project/blob/08ed53f3339705b0d2f2c72366be3de95d75bbac/app/routes/courses.%24slug.lessons.%24lessonId.tsx); [Instructor unanswered-questions queue](https://github.com/NorbertHipfl/cohort-005-project/blob/08ed53f3339705b0d2f2c72366be3de95d75bbac/app/routes/instructor.questions.tsx).
- **L6:** [Existing mail transport](https://github.com/NorbertHipfl/cohort-005-project/blob/08ed53f3339705b0d2f2c72366be3de95d75bbac/app/lib/mailer.server.ts).

### SQLite and current libraries

- **S1:** [SQLite public-domain dedication](https://www.sqlite.org/copyright.html).
- **S2:** [better-sqlite3 MIT licence](https://github.com/WiseLibs/better-sqlite3/blob/master/LICENSE).
- **S3:** [Drizzle Apache-2.0 licence](https://github.com/drizzle-team/drizzle-orm/blob/main/LICENSE).
- **S4:** [Drizzle transaction documentation](https://orm.drizzle.team/docs/transactions).
- **S5:** [SQLite WAL constraints and concurrency](https://www.sqlite.org/wal.html).
- **S6:** [SQLite online backup guidance](https://www.sqlite.org/backup.html).

### Knock

- **K1:** [Pricing: message units, Free/Starter allowances, overages, features and Free-limit FAQ](https://knock.app/pricing).
- **K2:** [In-app overview](https://docs.knock.app/in-app-ui/overview); [feeds, state, realtime and immutable sent content](https://docs.knock.app/in-app-ui/feeds/overview).
- **K3:** [In-app security, enhanced security mode and JWT grants](https://docs.knock.app/in-app-ui/security-and-authentication).
- **K4:** [Trigger API, recipient data and 24-hour idempotency](https://docs.knock.app/send-notifications/triggering-workflows/api).
- **K5:** [Batch function and grouping keys](https://docs.knock.app/designing-workflows/batch-function).
- **K6:** [Retention: logs versus recipient feeds](https://docs.knock.app/manage-your-account/data-retention).
- **K7:** [Sending pipeline retries and status tracking](https://docs.knock.app/send-notifications/delivering-notifications).
- **K8:** [Paginated feed API, filters and rate-limit scope](https://docs.knock.app/api-reference/users/feeds/list_items).
- **K9:** [Enterprise-only warehouse export and available data](https://docs.knock.app/integrations/extensions/warehouse-export).
- **K10:** [Security and EU residency roadmap statement](https://docs.knock.app/developer-tools/security).

### Novu

- **N1:** [Pricing: plans, overages, limits, inbox versus activity retention and regions](https://www.novu.co/pricing/).
- **N2:** [Billing: run units, all-environment aggregation, caps, paid usage limits and enterprise on-prem](https://docs.novu.co/platform/account/billing.md).
- **N3:** [Self-hosting requirements and recommended resource topologies](https://docs.novu.co/community/self-hosting-novu/overview.md).
- **N4:** [Community versus Cloud capability matrix](https://docs.novu.co/community/self-hosted-and-novu-cloud.md).
- **N5:** [Docker deployment, storage dependencies and own API/socket integration](https://docs.novu.co/community/self-hosting-novu/deploy-with-docker.md).
- **N6:** [Community Compose at inspected upstream revision, including Redis and image configuration](https://github.com/novuhq/novu/blob/8b57966892d5aaa5e1ee404582364e3667b13a90/docker/community/docker-compose.yml).
- **N7:** [Open-core scope in upstream README](https://github.com/novuhq/novu/blob/8b57966892d5aaa5e1ee404582364e3667b13a90/README.md#%EF%B8%8F-license); [MIT core licence](https://github.com/novuhq/novu/blob/8b57966892d5aaa5e1ee404582364e3667b13a90/LICENSE-MIT); [EE packages proprietary licence](https://github.com/novuhq/novu/blob/8b57966892d5aaa5e1ee404582364e3667b13a90/EE-PACKAGES-LICENSE).
- **N8:** [Production HMAC, context signing and EU endpoints](https://docs.novu.co/platform/inbox/prepare-for-production.md).
- **N9:** [Headless inbox hooks and realtime](https://docs.novu.co/platform/inbox/headless-mode.md); [browser SDK list/filter/state/actions and socket options](https://docs.novu.co/platform/sdks/javascript.md).
- **N10:** [Manual self-hosted migrations and version caveats](https://docs.novu.co/community/self-hosting-novu/data-migrations.md).
- **N11:** [Trigger lifecycle, queues/jobs, per-recipient billing, digestion and deduplication](https://docs.novu.co/platform/concepts/trigger.md); [backend workflow ingestion](https://docs.novu.co/platform/workflow/trigger-workflow.md).
- **N12:** [Digest grouping/window configuration and stated plan limits](https://docs.novu.co/platform/workflow/add-and-configure-steps/configure-action-steps/digest.md).
- **N13:** [Delivery retry policy, including stored Inbox versus external-provider sends](https://docs.novu.co/platform/developer/delivery-retries.md); [workflow execution debugging/statuses](https://docs.novu.co/platform/workflow/monitor-and-debug-workflow.md).
- **N14:** [API idempotency availability, cache windows, transaction ID distinction and retry responses](https://docs.novu.co/api-reference/idempotency.md).
