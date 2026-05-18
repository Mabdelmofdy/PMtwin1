# Matching Readiness Report

Generated: 2026-05-18T11:39:27.740Z

## One-way matching (need → offers)

- **Status:** Not ready
- **Needs (published, intent=request):** 0
- **Offers (published, intent=offer):** 0
- **Requirement:** At least one need and one offer with overlapping skills/sectors so the matcher can return results.

## Two-way barter matching

- **Status:** Not ready
- **Barter opportunities:** 0 (exchangeMode or paymentModes include barter)
- **Requirement:** At least two creators each with one need and one offer that mutually satisfy (A’s offer fits B’s need, B’s offer fits A’s need).

## Consortium (group formation)

- **Status:** Not ready
- **Consortium lead needs:** 0 (memberRoles or subModelType=consortium)
- **Other published offers:** 0
- **Requirement:** At least one lead need with memberRoles and enough published offers from different creators to fill roles.

## Circular exchange

- **Status:** Not ready
- **Requirement:** At least three creators forming a cycle: A’s offer satisfies B’s need, B’s offer satisfies C’s need, C’s offer satisfies A’s need. Dataset includes dedicated circular need/offer pairs for user-pro-002, user-pro-003, user-pro-004.

## Summary

| Model | Ready |
|-------|-------|
| One-way | No |
| Two-way barter | No |
| Consortium | No |
| Circular | No |
