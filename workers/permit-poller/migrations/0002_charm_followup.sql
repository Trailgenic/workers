-- Optional, separate consent for one follow-up text after the hiker's last permit date
-- that offers a Summit Charm. Never required to get permit alerts.
ALTER TABLE trackers ADD COLUMN charm_offer_consent_at TEXT;
ALTER TABLE trackers ADD COLUMN charm_offer_sent_at TEXT;
