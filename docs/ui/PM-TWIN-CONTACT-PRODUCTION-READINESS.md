# PM-TWIN Contact Production Readiness (P5B)

## Selected Option

- **Option C (current runtime state) with Option A-ready wiring.**
- Current configured status is **no live channel by default** unless `VITE_PUBLIC_SALES_EMAIL` is provided.
- No backend contact endpoint or CRM/webhook path is wired in the active runtime.

## Channel Status

- Public contact channel now resolves from `VITE_PUBLIC_SALES_EMAIL`.
- When a valid email is configured, public contact CTAs use `mailto:` safely.
- When no email is configured, CTAs safely fall back to `/contact` and honest “coming soon” messaging remains.

## Pages and CTAs Wired

- `ContactPage`:
  - Contact Sales card uses `mailto:` with subject `PM-Twin sales inquiry` when email exists.
  - Request Demo card uses `mailto:` with subject `PM-Twin demo request` when email exists; otherwise keeps demo workspace path.
  - Added Pricing Inquiry card using `mailto:` with subject `PM-Twin pricing inquiry` when email exists.
  - Keeps explicit note that online message submission is unavailable without backend.
- `PricingPage`:
  - Tier-level Contact Sales CTAs use same resolved channel (`mailto:` when configured, `/contact` fallback).
  - CTA band Contact Sales button also uses same resolved channel logic.
- Footer and navigation:
  - Footer Contact remains `/contact`.
  - Mobile/header navigation contact links remain `/contact`.

## Fallback Behavior

- If `VITE_PUBLIC_SALES_EMAIL` is missing/invalid:
  - Contact and pricing CTAs remain non-fake and route to `/contact`.
  - No fake form, no fake submission, no fake CRM/webhook behavior.

## Security and Privacy Notes

- No personal email is hardcoded into source.
- No contact form submission endpoint is implied.
- No fake response-time or sales-availability claims are introduced.
- Mailto links only appear when a configured, valid email is present.

## Remaining for Full Contact Form Production

- Backend contact form endpoint with validation and abuse protection.
- CRM or routing integration (if required by business process).
- Operational ownership for SLA/response process.

## Recommendation

- **Go** for public contact channel only when `VITE_PUBLIC_SALES_EMAIL` is configured with an approved sales address.
- **No-go** for backend contact form claims until a real endpoint is implemented.
