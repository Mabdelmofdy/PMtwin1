# Matching Readiness Report

Generated: 2026-03-06T12:50:46.835Z

## One-way matching (need → offers)

- **Status:** Ready
- **Needs (published, intent=request):** 22
- **Offers (published, intent=offer):** 16
- **Requirement:** At least one need and one offer with overlapping skills/sectors so the matcher can return results.

## Two-way barter matching

- **Status:** Ready
- **Barter opportunities:** 5 (exchangeMode or paymentModes include barter)
- **Requirement:** At least two creators each with one need and one offer that mutually satisfy (A’s offer fits B’s need, B’s offer fits A’s need).

## Consortium (group formation)

- **Status:** Ready
- **Consortium lead needs:** 6 (memberRoles or subModelType=consortium)
- **Other published offers:** 16
- **Requirement:** At least one lead need with memberRoles and enough published offers from different creators to fill roles.

## Circular exchange

- **Status:** Ready
- **Requirement:** At least three creators forming a cycle: A’s offer satisfies B’s need, B’s offer satisfies C’s need, C’s offer satisfies A’s need. Dataset includes dedicated circular need/offer pairs for user-pro-002, user-pro-003, user-pro-004.

## Summary

| Model | Ready |
|-------|-------|
| One-way | Yes |
| Two-way barter | Yes |
| Consortium | Yes |
| Circular | Yes |
