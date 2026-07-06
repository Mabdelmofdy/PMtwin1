/** UPX copy — single source for recommended action hub titles. */
export const PM_RECOMMENDED_NEXT_STEP = {
  title: 'Recommended next step',
  description: (entityLabel: string) =>
    `The most important action for this ${entityLabel}.`,
} as const
