# Knock in-app feed vs. the Cadence inbox contract

Retrieved: 2026-11-12. Public docs only (docs.knock.app, knock.app). No account, token, or repo content used. Not a plan recommendation.

Labels: **DOCUMENTED** (cited), **INFERENCE** (my design proposal), **UNVERIFIED/GAP** (docs silent), **BLOCKER** (documented conflict).

## Summary

Contract under test: provider holds only opaque recipient/source IDs, event type/time, minimal facts. No names, emails, course titles or comment text. Cadence stays authoritative and resolves display data after access checks.

| # | Requirement | Verdict |
|---|---|---|
| 1 | Server-mediated feed access with per-request authorization | DOCUMENTED (server calls; secret-key use implied, not stated). Per-item filtering is INFERENCE. |
| 2 | Server-side counts filtered by app-defined access | GAP. Counts are whole-feed; a client-filtered count would be wrong. |
| 3 | Mark-all-read with cutoff; read/seen/unread | DOCUMENTED (bulk endpoint with `newer_than`/`older_than`; `read` bulk action not shown). |
| 4 | Non-destructive hide/restore | DOCUMENTED archive/unarchive. Effect on read state and expiry is a GAP. Not access control. |
| 5 | Display data without stored text | DOCUMENTED as feasible with IDs only. Knock stores the `data` payload on the message record. |
| 6 | 90-day visibility and physical deletion within 24h | **BLOCKER/GAP.** Feed items retained indefinitely; no per-message delete API or 24h SLA documented. |
| 7 | Idempotency, retry, cancel | DOCUMENTED (24h key window, trigger endpoint only). Cancel is deferred and cannot affect finished runs. |
| 8 | Export/exit | Partial. List APIs exist; warehouse export is Enterprise only. |
| 9 | Plans, region, DPA | DOCUMENTED. US-only subprocessors; EU residency "coming soon". |
| 10 | Opaque-ID-only users | DOCUMENTED: only `id` is required. |

Main risk: item 6. In-app feed items persist indefinitely per the docs, with no documented way to delete one message or force a purge within 24h. The only documented hard delete is deleting the whole user.

## Method

Pages fetched with `web_fetch`, preferring the `.md` form of docs paths. Some page tails were truncated and the rate-limit tier table did not fully render; these are marked GAP where relevant. Nothing was tested against a live account, so all behavior is as documented, not observed.

## 1. Server-mediated vs browser access

- DOCUMENTED, https://docs.knock.app/in-app-ui/security-and-authentication: browsers use a public key. In enhanced security mode they must also send a signed user token (RS256 JWT, `sub` claim, signed server-side). Without enhanced security "a request with your public key can act as any user".
- DOCUMENTED, same page: the browser can call `GET /v1/users/:id/feeds/:channel_id`, the message status endpoints, `POST /v1/messages/batch/:status` and `POST /v1/channels/:channel_id/messages/bulk/:action` with the public key. Token `grants` (`user/feed_read`, `user/feed_write`, with `explicit_grants: true`) can restrict this; tokens can also be scoped to tenants.
- DOCUMENTED, https://docs.knock.app/api-reference/users/feeds/list_items.md: "When making this call from a client-side environment, use your publishable key along with a user token." This implies server-side calls use the secret key, but the page does not say so explicitly (GAP, minor). Rate limit is per user and per environment.
- DOCUMENTED, same page: response has `entries` (with `blocks`, `data`, `source`, `tenant`), `meta` and `page_info`. Filters: `status`, `source`, `tenant`, `archived`, `trigger_data`, `inserted_at.*`, `after`/`before`, `page_size` (default 50). Example `activities`/`actors` include recipient email and name when those were stored.
- INFERENCE: proxy all feed reads and writes through Cadence endpoints and issue no browser tokens. Cadence authorizes each request against current access, calls Knock with the secret key, and drops items the user may not see. Token grants cannot express Cadence's dynamic permissions; documented scoping is only by endpoint type and tenant.
- GAP: no documented callback for Knock to ask Cadence per item. Dynamic authorization is entirely Cadence-side filtering.

## 2. Counts, badge, pagination

- DOCUMENTED, https://docs.knock.app/in-app-ui/api-overview.md: `FeedMetadata` has `total_count`, `unread_count`, `unseen_count`, described as totals "the user has on the in-app channel". Archived messages are excluded by default.
- DOCUMENTED, https://docs.knock.app/in-app-ui/feeds/overview.md: aggregates are provided "for use in feed badge UIs".
- GAP: whether `meta` counts respect the `status`, `source`, `tenant` or `trigger_data` request filters is not stated.
- Counts cannot be filtered by Cadence access rules. If Cadence hides an item Knock counts, the Knock badge is wrong.
- INFERENCE: if access can change after delivery, compute the badge in Cadence (its own durable intent plus Knock read state). Client-side filtering of a paginated list cannot give a correct total.
- Pagination is cursor-based (`after`/`before`, `page_size`). Filtering after fetch can return short or empty pages.

## 3. Mark-all-read, read/seen/archived

- DOCUMENTED, https://docs.knock.app/send-notifications/message-statuses.md: engagement statuses are independent. `seen` = retrieved for display (set implicitly for in-app). `read`, `interacted` (cell click) and `archived` are separate timestamps (`read_at`, `interacted_at`, `archived_at`).
- DOCUMENTED, https://docs.knock.app/api-reference/messages.md: per-message PUT/DELETE for `seen`, `read`, `archived`; `interacted` has PUT only. So unread, unseen and unarchive are supported.
- DOCUMENTED, https://docs.knock.app/api-reference/messages/batch.md: batch endpoints for seen, unseen, read, unread, interacted, archived, unarchived. Maximum batch size not stated (GAP). Message list `message_ids` is capped at 50.
- DOCUMENTED, https://docs.knock.app/api-reference/channels/bulk/update_message_status.md: `POST /v1/channels/{channel_id}/messages/bulk/{action}` with filters `newer_than`, `older_than`, `recipient_ids`, `tenants`, `workflows`, `archived`, `engagement_status`, `trigger_data`; runs as an async `BulkOperation`. The page's examples list only `archive`/`unarchive`. Whether `read` is a valid bulk action is UNVERIFIED.
- DOCUMENTED, https://docs.knock.app/integrations/in-app/feeds.md: the Knock UI "mark all as read" marks all feed items read.
- INFERENCE: for a cutoff, list the feed server-side, record the IDs shown, then batch-read those IDs (or bulk with `older_than`). Later arrivals stay unread. Docs do not promise atomic cutoff semantics; needs a live test.

## 4. Hide/restore

- DOCUMENTED, https://docs.knock.app/integrations/in-app/feeds.md: archive removes a message from the feed; it is "no longer visible to the end user". `archived: only` lists them.
- DOCUMENTED, https://docs.knock.app/api-reference/messages/unarchive.md: unarchive "removes a message from the archived state, making it visible in the default message list". The example response keeps `seen_at` but that is one example only.
- GAP: no explicit statement that archive/unarchive leave `read_at`/`seen_at` untouched. Archive's interaction with retention is also not documented.
- Archive is user-facing state, and the browser can set and unset it with the public key. Do not use it as access control.
- INFERENCE: enforce access in Cadence at read time (section 1); use archive only for user dismissal.

## 5. Display data with no stored text

- DOCUMENTED, https://docs.knock.app/in-app-ui/api-overview.md (Passing through data): all workflow `data` is included in the feed item, so IDs such as `project_id` can be passed through to drive custom UI. `blocks` hold rendered template content.
- DOCUMENTED, https://docs.knock.app/in-app-ui/feeds/overview.md: feed messages cannot be updated after generation.
- DOCUMENTED, https://docs.knock.app/send-notifications/triggering-workflows/api.md: `data` up to 10MB; strings over 1024 bytes are truncated only in logs.
- DOCUMENTED, https://docs.knock.app/manage-your-account/data-obfuscation.md: filtered log keys replace values in logs with `[filtered]`, but "don't change the data Knock stores on the records your requests ... create or update". Obfuscation only hides data in the dashboard.
- DOCUMENTED, https://docs.knock.app/api-reference/messages.md: `GET /v1/messages/{id}` returns `data` and a `recipient_snapshot` (name, email) when those exist on the recipient.
- DOCUMENTED, https://docs.knock.app/integrations/in-app/feeds.md: the API response filter (`vars`, `actor`, `recipient`, `data`) can strip returned keys.
- INFERENCE: workable if the template is static or non-personal and Cadence sends only IDs in `data`. Don't store `name`/`email` on identify so snapshots hold none.
- GAP: the response filter affects what is returned, not what is stored.

## 6. Retention and deletion

- DOCUMENTED, https://docs.knock.app/manage-your-account/data-retention.md: message log data (contents, events, delivery logs) kept 90 days (Enterprise) or 30 days (other plans). "Custom retention policies are not currently supported."
- DOCUMENTED, same page: "In-app feed notifications are available indefinitely", still fetchable and updatable after logs expire. Expired data is "eventually pruned".
- DOCUMENTED, https://knock.app/pricing: "Feed retention ... Unlimited ... No limit, but can be configured" on all plans. Conflicts with the retention page (GAP; ask Knock).
- **BLOCKER** for a hard 90-day guarantee: without documented configurable feed retention, items older than 90 days stay fetchable. Cadence can still hide them by filtering `inserted_at.gte`, but that is not deletion.
- **BLOCKER/GAP** for physical deletion within 24h: no per-message or bulk message delete in https://docs.knock.app/api-reference/messages.md (listed: get, list, events, delivery logs, activities, seen, read, interacted, archive). Only user deletion is documented.
- DOCUMENTED, https://docs.knock.app/managing-recipients/deleting-users.md: `DELETE /v1/users/{id}` hard-deletes properties, preferences, channel data, subscriptions, schedules, all messages and content, and workflow run logs. Can take up to 10 minutes, irreversible, ID reusable afterwards. A bulk delete endpoint is mentioned there.
- DOCUMENTED, https://docs.knock.app/developer-tools/security.md: server logs kept up to 1 year. API logs have universal 30-day retention (data-retention page).
- GAP: whether user delete reaches API logs, backups and analytics subprocessors within 24h.
- INFERENCE: deleting only one user's old items is not possible via documented APIs. Options: delete and re-identify the user (loses preferences, read state, history), or ask Knock about an undocumented purge.

## 7. Idempotency, retry, bulk, cancel

- DOCUMENTED, https://docs.knock.app/api-reference/overview/idempotent-requests.md: `Idempotency-Key` header, up to 255 chars, 24h window, only `POST /workflows/:key/trigger`. Replay returns the original response (`idempotent-replayed: true`). Only 2xx cached. Changed parameters with the same key return an error.
- DOCUMENTED, https://docs.knock.app/send-notifications/triggering-workflows/api.md: up to 1000 recipients per trigger; no bulk trigger endpoint.
- GAP: dedup beyond 24h. Cadence's durable intent, with a stable key from its own event ID, must carry this.
- DOCUMENTED, https://docs.knock.app/send-notifications/canceling-workflows.md: `cancellation_key` cancels only paused runs; cancellation is deferred (204 = enqueued), avoid within 5 seconds of trigger; finished runs cannot be canceled, and for in-app "you can archive a message instead".
- DOCUMENTED, https://docs.knock.app/api-reference/overview/rate-limits.md: five tiers, scoped by environment (API key) or environment plus user (signed user token). Values appear to be 1/5/60/200/1000 req/s but the tier-to-value mapping did not render (UNVERIFIED). Feed list is tier 2, identify tier 3, get user and list messages tier 4.
- GAP: Knock-side retry behavior for in-app delivery (statuses page says in-app messages always deliver to the Feed API).

## 8. Export and exit

- DOCUMENTED, https://docs.knock.app/api-reference/users.md: `GET /v1/users` (cursor paginated, 50 default), `GET /v1/users/{id}/messages`. `GET /v1/messages` filters by status, workflow and date.
- DOCUMENTED, https://docs.knock.app/integrations/extensions/warehouse-export.md: warehouse export of the `messages` table is Enterprise only, via support.
- GAP: after log expiry, messages leave the dashboard and API list; feed items remain retrievable only via the feed endpoint.
- INFERENCE: Cadence holds authoritative history, so exit mostly means exporting per-user read state via the feed API.

## 9. Pricing, region, terms (snapshot 2026-11-12)

- DOCUMENTED, https://knock.app/pricing: Free $0 (10,000 messages/month, 500 guide recipients). Starter $250/month (50,000 messages, then $0.005 each; 2,500 guide recipients, then $0.05). Enterprise custom. Unlimited stored profiles, workflows, in-app feeds per recipient, team members and environments on all plans. A "message" is one delivery to one user on one channel. No hard cap on overage for Free.
- DOCUMENTED, same page: logs 30 days (Free/Starter), 90 days (Enterprise). Audit logs, SAML, SCIM, analytics streaming, BAA and dedicated infrastructure are Enterprise-only. Uptime SLA 99.9% (Free/Starter).
- DOCUMENTED, https://knock.app/legal/subprocessors: all subprocessors in the USA (AWS, ClickHouse, Datadog, Segment, PostHog, Sentry, OpenAI, Anthropic, Postmark, Stripe, others).
- DOCUMENTED, https://docs.knock.app/developer-tools/security.md and https://docs.knock.app/manage-your-account/knock-plans.md: "EU data residency is coming soon", expected "by the end of 2026". Not available at this date.
- DOCUMENTED, https://knock.app/legal/data-processing-addendum: DPA with SCCs and UK Addendum, Knock as Processor, subprocessor-change notice with 30-day objection window. Text after section 6 not read (GAP).
- DOCUMENTED, https://knock.app/legal/privacy-policy: Knock is Processor for customers' end-user data. Pricing page lists SOC 2 Type 2, GDPR, CCPA.
- UNVERIFIED: terms of service (https://knock.app/legal/terms-of-service) and https://trust.knock.app were not fetched; data return and deletion on termination are unverified.

## 10. Users and recipients

- DOCUMENTED, https://docs.knock.app/managing-recipients/identifying-recipients.md: "We recommend using your internal user identifier for the `id` value, which is the only required property." Email and phone are required only for channels that need them. In-app feed needs neither. Identify is an upsert; client-side inline identify with only `{ id }` works.
- DOCUMENTED, https://docs.knock.app/api-reference/users.md: user `id` is stored and returned by the API. Delete API: section 6.
- DOCUMENTED: objects (`collection` + `id`) and tenants exist; a trigger can pass `tenant` to scope feed items.
- INFERENCE: use Cadence-generated opaque recipient IDs rather than raw internal user IDs. Tenant scoping is not an access-control substitute.

## Blockers and gaps to resolve with Knock

1. No documented single-message or bulk message delete; 24h physical deletion unverified.
2. Feed retention: "indefinite" in docs vs "configurable" on pricing.
3. Whether feed `meta` counts honor request filters; whether `read` is a bulk action; batch size limit.
4. Archive/unarchive effect on read state and retention.
5. Whether user deletion reaches logs, backups and analytics within 24h.
6. Terms of service, DPA annexes and data-return terms not reviewed.

## Design inferences (not documented guarantees)

- Server-proxy the feed; issue no browser tokens.
- Cadence-side filtering by current access and `inserted_at.gte` (90 days).
- Opaque recipient IDs; ID-only `data`; static template text.
- Cadence-computed badge; Knock holds only read/seen state.
- Cadence-derived `Idempotency-Key`; Cadence durable intent is the dedup source beyond 24h.
- No Knock built-in implements Cadence business rules (authorization, milestone history, pending intent).
