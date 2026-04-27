# Pawlife — App Store Connect Privacy Labels

Reference for the privacy nutrition labels in App Store Connect → App Privacy. Apple requires this disclosure for every released version.

**Tracking?** No. Pawlife does not use IDFA, does not call `requestTrackingAuthorization`, and does not share data with third parties for advertising. Apple's "Used for Tracking" column is **No** for every category below.

## Data collected

| Apple data category | Subtype | Linked to user? | Used for tracking? | Purpose | Source / processor |
|---|---|---|---|---|---|
| Contact Info | Email Address | Yes | No | App Functionality | Supabase Auth |
| Identifiers | User ID | Yes | No | App Functionality, Analytics, Diagnostics | Supabase user UUID, sent to PostHog as `distinct_id` |
| User Content | Photos | Yes | No | App Functionality | Pet profile photos (Supabase Storage) |
| User Content | Other User Content | Yes | No | App Functionality | Pet records (vaccinations, weight, food, medications, allergies, vet visits, notes) |
| Usage Data | Product Interaction | Yes | No | Analytics | PostHog events: `pet_created`, `vaccination_logged`, `medication_dose_logged`, `weight_entry_logged`, `food_entry_logged`, `auth_signup_started`, `auth_signup_failed`, screen views |
| Diagnostics | Crash Data | No | No | App Functionality, Analytics | PostHog `$exception` (caught render errors + Edge Function exceptions) |

## Data NOT collected

Explicitly omitted from the form (do not check these):

- Health & Fitness — Pawlife stores **pet** health records, not human health data. Apple's category is for human-health data only.
- Financial Info
- Location (precise or coarse)
- Sensitive Info
- Contacts
- User Content → Audio / Gameplay Content / Customer Support / Other User Content (beyond the pet records noted above)
- Search History
- Browsing History
- Identifiers → Device ID
- Purchases
- Usage Data → Advertising Data
- Diagnostics → Performance Data, Other Diagnostic Data

## Notes for the form

- For every "Yes — Collected" row, Apple asks "Linked to the user's identity?" and "Used to track the user?". Our answers are always **Linked: Yes / Tracking: No**, except Crash Data which is **Linked: No / Tracking: No** (PostHog buckets exceptions by an anonymous device fingerprint, not by user ID).
- "Purpose" answer per row uses Apple's allowed multi-select list — see the table above.
- For the "Privacy Policy URL" field at the top of the App Privacy section, paste the GitHub Pages URL once it resolves (see user-action checklist).
- For the "Privacy Choices URL" field, leave blank — we do not currently offer an in-app analytics opt-out (deferred to v1.1).

## Verification

Before submission:

1. `curl -I <privacy URL>` — confirm 200.
2. Open the URL in Safari on the same Mac you'll submit from — confirm renders + readable.
3. Re-read this doc against the form fields the day of submission — Apple occasionally renames categories.

## Change log

- 2026-04-27 — Initial draft, derived from `pawlife-v1-posthog-plan.md` §7. Performance Data row dropped per reviewer amendment §5 (PostHog RN does not auto-emit `$performance` events).
