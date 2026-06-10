# Register — Page Overrides

**Pattern:** Multi-step wizard with clear progress

## UX rules
- Step nav shows named steps (not only "Step X of 6")
- Form sections grouped under sub-headings
- Account type cards: equal visual weight, `cursor-pointer`, selected state with CTA border
- Step transitions: 300ms fade-in-left; respect `prefers-reduced-motion`
- Inline validation on blur where possible
- Focus rings on all inputs: `box-shadow` CTA ring

## Spacing
- Section padding: `1rem 1.25rem` inside bordered groups
- Gap between sections: consistent `space-y-4`
