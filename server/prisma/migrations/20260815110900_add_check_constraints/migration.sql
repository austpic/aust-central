-- Integrity rules Prisma's schema language cannot express.
--
-- These live in the database rather than only in Zod because application
-- validation is one bug (or one direct psql session, or one future admin
-- script) away from being bypassed. A CHECK constraint holds regardless of
-- which code path writes the row.

-- A SALE listing must be priced; SWAP and FREE listings must not be.
-- Without this, "free" books can carry a stale price from an earlier edit.
ALTER TABLE "book_listings"
  ADD CONSTRAINT "book_listings_price_matches_type"
  CHECK (
    ("listingType" = 'SALE' AND "priceBdt" IS NOT NULL AND "priceBdt" >= 0)
    OR ("listingType" <> 'SALE' AND "priceBdt" IS NULL)
  );

-- Ratings are a 1-5 scale. Anything outside it silently corrupts the average
-- shown on every seller card.
ALTER TABLE "seller_reviews"
  ADD CONSTRAINT "seller_reviews_rating_range"
  CHECK ("rating" BETWEEN 1 AND 5);

-- Nobody reviews themselves.
ALTER TABLE "seller_reviews"
  ADD CONSTRAINT "seller_reviews_no_self_review"
  CHECK ("raterId" <> "sellerId");

-- A blood request for zero units is meaningless; the upper bound is a sanity
-- cap that also blunts a nuisance-request denial-of-service.
ALTER TABLE "blood_requests"
  ADD CONSTRAINT "blood_requests_units_positive"
  CHECK ("units" > 0 AND "units" <= 20);

-- A conversation needs two distinct participants.
ALTER TABLE "conversations"
  ADD CONSTRAINT "conversations_distinct_participants"
  CHECK ("buyerId" <> "sellerId");

-- Reminder lead time: negative is nonsense, and a full day is the practical
-- ceiling for "remind me before this class".
ALTER TABLE "class_reminders"
  ADD CONSTRAINT "class_reminders_minutes_before_range"
  CHECK ("minutesBefore" >= 0 AND "minutesBefore" <= 1440);

-- Course credits are positive and bounded.
ALTER TABLE "course_grades"
  ADD CONSTRAINT "course_grades_credits_range"
  CHECK ("credits" > 0 AND "credits" <= 30);

-- Wall-clock strings must actually be "HH:mm" in 24-hour form. These columns
-- are compared and sorted as text, so a stray "9:00" or "09:00 AM" would order
-- incorrectly rather than fail loudly.
ALTER TABLE "class_reminders"
  ADD CONSTRAINT "class_reminders_time_format"
  CHECK ("classTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');

ALTER TABLE "departures"
  ADD CONSTRAINT "departures_time_format"
  CHECK ("departureTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');

-- Route positions are ordinals starting at zero.
ALTER TABLE "route_stops"
  ADD CONSTRAINT "route_stops_position_non_negative"
  CHECK ("position" >= 0);

-- Uploaded files always have real bytes behind them.
ALTER TABLE "file_objects"
  ADD CONSTRAINT "file_objects_size_positive"
  CHECK ("sizeBytes" > 0);
