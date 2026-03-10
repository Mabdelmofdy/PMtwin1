# Missing Entities Report

Generated: 2026-03-06T12:50:46.835Z

## Industries / sectors

- **Canonical list:** targetSectors in lookups.json plus validSectors in data-service.
- **Current targetSectors:** Construction, Energy, Real Estate, Manufacturing, Technology, Infrastructure, Building, Commercial, Utilities, Oil and Gas, Industrial, Architecture, Engineering, Other.
- **Gaps:** None critical; Building, Commercial, Utilities, Oil and Gas were added to targetSectors during cleanup.

## Skills

- **skill-canonical.json skillSynonyms:** 144 entries.
- **Gaps:** All skills present in seed were added as canonical (self-mapping or synonym). New skills added in future seed or by users should be added to skillSynonyms if normalization is required.

## Opportunity types

- **Published opportunities by model:** project_based, hiring, resource_pooling, competition, strategic_partnership all have at least one published opportunity.
- **Gaps:** None. All relevant model/subModel combinations used in the platform have representative data.

## Company roles / members

- **Current state:** Company membership (user linked to company) is not modeled in platform seed; no companyId on users.
- **Gap:** Optional future enhancement: add companyId to professional users and backfill from context so company members can be listed.

## Subscription / plans

- **subscription_plans, subscriptions:** No seed files; storage keys exist but are empty. Documented as "no seed data" in audit; not required for core marketplace workflows.
