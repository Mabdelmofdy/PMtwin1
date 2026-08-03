import { expect, test, type Page } from '@playwright/test'

/**
 * UAT verification scenarios for match expiration on Close/Archive.
 *
 * The matched Need/Offer pair is seeded into `pmtwin_web_overrides` rather than
 * driven through the five-step wizard twice: auto-matching itself is covered
 * end to end by `src/services/matching/publish-matching.test.ts`, so these
 * specs exist to verify the UI surface and the participant notifications that
 * Close/Archive produce at runtime.
 */

/**
 * Overrides are namespaced per runtime mode (`PMTWIN_DEMO_`, `PMTWIN_UAT_`, or
 * unprefixed), so the spec resolves the key at runtime instead of assuming
 * which mode the dev server was started in.
 */
const OVERRIDES_KEYS = [
  'PMTWIN_DEMO_pmtwin_web_overrides',
  'PMTWIN_UAT_pmtwin_web_overrides',
  'pmtwin_web_overrides',
]
const SEED_FLAG_KEY = 'pmtwin_uat_expiry_seeded'
const PASSWORD = 'Pmtwin@2026'

const NEED_OPPORTUNITY_ID = 'seed-opp-001'
const OFFER_OPPORTUNITY_ID = 'seed-opp-002'
const MATCH_ID = 'pm-uat-expiry'

const KHALID = { id: 'seed-user-001', email: 'khalid.alharbi@pmtwin.test' }
const SARA = { id: 'seed-user-002', email: 'sara.almutairi@pmtwin.test' }

const CLOSED_MESSAGE = 'The opportunity has been closed. Your match has expired.'
const ARCHIVED_MESSAGE = 'The opportunity has been archived. Your match has expired.'

/**
 * Publish the seeded Need and attach one open PostMatch between both users.
 * Guarded by a sentinel so re-running on every navigation does not wipe the
 * expiration that the scenario under test just produced.
 */
async function seedOpenMatch(page: Page): Promise<void> {
  await page.addInitScript(
    (input) => {
      if (window.localStorage.getItem(input.flagKey) === 'yes') return
      window.localStorage.setItem(input.flagKey, 'yes')

      const overrides: Record<string, unknown> = {}

      overrides.opportunities = {
        [input.needId]: { status: 'published', visibilityStatus: 'published' },
        [input.offerId]: { status: 'published', visibilityStatus: 'published' },
      }
      overrides.newPostMatches = [
        {
          id: input.matchId,
          matchType: 'one_way',
          status: 'discovered',
          matchScore: 0.91,
          needOpportunityId: input.needId,
          offerOpportunityId: input.offerId,
          participants: [
            {
              userId: input.khalidId,
              role: 'need_owner',
              opportunityId: input.needId,
              participantStatus: 'pending',
            },
            {
              userId: input.saraId,
              role: 'offer_provider',
              opportunityId: input.offerId,
              participantStatus: 'pending',
            },
          ],
          payload: {
            needOpportunityId: input.needId,
            offerOpportunityId: input.offerId,
            breakdown: { skillMatch: 0.91 },
          },
        },
      ]

      // Write every candidate namespace so the seed lands regardless of mode.
      for (const key of input.overridesKeys) {
        window.localStorage.setItem(key, JSON.stringify(overrides))
      }
    },
    {
      overridesKeys: OVERRIDES_KEYS,
      flagKey: SEED_FLAG_KEY,
      needId: NEED_OPPORTUNITY_ID,
      offerId: OFFER_OPPORTUNITY_ID,
      matchId: MATCH_ID,
      khalidId: KHALID.id,
      saraId: SARA.id,
    },
  )
}

async function signIn(page: Page, email: string): Promise<void> {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Login' }).click()
  // The app returns to the last requested route after login, so assert only
  // that the login screen was left behind.
  await expect(page).not.toHaveURL(/\/login/)
}

async function signOut(page: Page): Promise<void> {
  await page.getByRole('button', { name: /Sign out/ }).first().click()
  await expect(page).toHaveURL(/\/login/)
}

/** Read the PostMatch status straight from the persisted overrides blob. */
async function readMatchStatus(page: Page): Promise<string | undefined> {
  return page.evaluate(
    (input) => {
      for (const key of input.overridesKeys) {
        const raw = window.localStorage.getItem(key)
        if (!raw) continue
        const overrides = JSON.parse(raw)
        const patched = overrides.postMatches?.[input.matchId]?.status
        if (patched) return patched as string
        const seeded = (overrides.newPostMatches ?? []).find(
          (match: { id: string }) => match.id === input.matchId,
        )
        if (seeded?.status) return seeded.status as string
      }
      return undefined
    },
    { overridesKeys: OVERRIDES_KEYS, matchId: MATCH_ID },
  )
}

async function withdrawOpportunity(
  page: Page,
  action: 'Close Opportunity' | 'Archive',
): Promise<void> {
  await page.goto(`/opportunities/${NEED_OPPORTUNITY_ID}`)
  page.once('dialog', (dialog) => {
    void dialog.accept()
  })
  await page.getByRole('button', { name: action, exact: true }).first().click()
}

async function expectExpiryNotification(page: Page, message: string): Promise<void> {
  await page.goto('/notifications')
  await expect(page.getByText(message).first()).toBeVisible()
}

test.beforeEach(async ({ page }) => {
  await seedOpenMatch(page)
})

test('Scenario 1: the matched need/offer pair is visible to both participants', async ({
  page,
}) => {
  await signIn(page, KHALID.email)
  await page.goto('/matches')
  expect(await readMatchStatus(page)).toBe('discovered')

  await signOut(page)
  await signIn(page, SARA.email)
  await page.goto('/matches')
  expect(await readMatchStatus(page)).toBe('discovered')
})

test('Scenario 2: closing the opportunity expires open matches and notifies both participants', async ({
  page,
}) => {
  await signIn(page, KHALID.email)
  await withdrawOpportunity(page, 'Close Opportunity')

  await expect
    .poll(async () => readMatchStatus(page), { timeout: 15_000 })
    .toBe('expired')
  await expectExpiryNotification(page, CLOSED_MESSAGE)

  await signOut(page)
  await signIn(page, SARA.email)
  await expectExpiryNotification(page, CLOSED_MESSAGE)
})

test('Scenario 3: archiving the opportunity behaves the same as close', async ({
  page,
}) => {
  await signIn(page, KHALID.email)
  await withdrawOpportunity(page, 'Archive')

  await expect
    .poll(async () => readMatchStatus(page), { timeout: 15_000 })
    .toBe('expired')
  await expectExpiryNotification(page, ARCHIVED_MESSAGE)

  await signOut(page)
  await signIn(page, SARA.email)
  await expectExpiryNotification(page, ARCHIVED_MESSAGE)
})
