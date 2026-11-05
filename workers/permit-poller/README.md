# Summit Charms Permit Cancellation Alerts (free)

This Worker powers one product: SMS alerts when validated, immediately bookable
permit inventory satisfies a tracker's exact permit, selected date, and party size.

## Initial verified products

- Mt. Whitney Day Use — Recreation.gov facility `445860`, division `406`
- Mt. Whitney Overnight — Recreation.gov facility `445860`, division `166`
- Half Dome Daily — Recreation.gov facility `234652`, division `31`
- King Range Wilderness (Lost Coast) — Recreation.gov facility `445864`, division `445864001`
- Mt. St. Helens Climbing Permit — Recreation.gov facility `4675309`, division `999` (added Nov 5, 2026)
- Enchantments Core Zone — Recreation.gov facility `233273`, division `30`, group quota (added Nov 5, 2026)
- Yosemite Wilderness, Happy Isles to Little Yosemite Valley (Half Dome overnight) — facility `445859`, entry point `44585917` (added Nov 5, 2026)

Checked and left out because nothing cancelled becomes bookable: Angels Landing (lottery only;
cancellations go back into the day-before lottery) and The Wave / Coyote Buttes North (lottery only).

Products without a verified bookable-inventory response are intentionally excluded.
Lottery calendars and release-deadline reminders are out of scope.

## Architecture

1. Cron identifies permit products with active, non-expired trackers.
2. The poll queue serializes product checks.
3. Product-specific adapters validate Recreation.gov responses.
4. Twilio Verify confirms ownership before a tracker becomes active.
5. D1 stores inventory snapshots and detects inventory increases.
6. Trackers match when `previous_remaining < party_size <= current_remaining`, or
   when their first validated observation already has sufficient inventory.
7. An idempotent notification outbox feeds the notification queue.
8. The notification consumer sends Twilio SMS with retries and a dead-letter queue.

Trackers with no current or future dates are automatically paused. They do not make
the health endpoint degraded: a deployed poller with no actionable trackers reports
`healthy` / `idle`. Twilio error `21610` is treated as a recipient opt-out, so the
recipient's active trackers are paused and the notification is not retried.

Lost Coast alerts include a safety reminder because Recreation.gov inventory does not
mean the coastal route is passable. Hikers must check official tides, marine forecasts,
and weather before booking.

Missing dates and malformed payloads are treated as unknown. They never overwrite the
last good snapshot or create availability alerts.

## Brand, pages and the off-season switch

Public pages (sign-up, terms, privacy, help) live on mysummitcharms.com/permit-alerts/, which
proxies `/api/permit-alerts/*` to this Worker. The Worker's own `/`, `/terms`, `/privacy` and
`/help` redirect there. Internal names (Worker, D1, queues, alerts.trailgenic.com) are unchanged
so the existing database and queues keep working; no visitor sees them.

- `SIGNUPS_OPEN` — `"false"` closes `POST /trackers` with a 503 "open again in spring". Set to `"true"` to launch.
- `CHARM_FOLLOWUP_ENABLED` — `"false"` by default. When `"true"`, hikers who ticked the separate
  optional box get one text 2 to 14 days after their last permit date (sent 17:00 UTC) offering a charm.
- `SOURCE_DELAY_MS` — gap between Recreation.gov requests (default 10,000 ms, matching its crawl delay).
  Requests carry an honest `SummitCharmsPermitAlerts` user agent.

## Deployment

The GitHub Actions deployment is idempotent. It creates the D1 database and four queues
when absent, resolves the live database ID into a temporary ignored config, applies D1
migrations, installs Worker secrets, and deploys the Worker. The placeholder
`database_id` in the committed config is never used for production deployment.

For a manual deployment with the five secrets exported in the environment:

```sh
npm run deploy:permit-poller
```

Configure these secrets before enabling the public tracker endpoint:

- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_FROM_NUMBER`
- `TWILIO_VERIFY_SERVICE_SID`
- `TURNSTILE_SECRET_KEY`

The public site must include the Turnstile response as `turnstile_token` and explicit
SMS consent as `consent: true` when calling `POST /trackers`.

## HTTP API

- `GET /permits` — supported inventory products
- `POST /trackers` — create an exact date/party-size tracker
- `POST /trackers/verify` — confirm the Twilio Verify code and activate the tracker
- `GET /trackers/manage` — inspect a tracker with a bearer management token
- `DELETE /trackers/manage` — cancel a tracker with the same token
- `GET /health` — database, poller, and Twilio configuration health

Tracker responses never expose the full phone number. All responses use `no-store`.
