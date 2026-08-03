import { expect, test } from '@playwright/test'

async function signIn(
  page: import('@playwright/test').Page,
  accountType: 'individual' | 'company' = 'individual',
) {
  await page.goto('/login')
  if (accountType === 'company') {
    await page
      .locator('label.pm-account-type-option')
      .filter({ hasText: 'Company' })
      .click()
  }
  await page.getByLabel('Email').fill(
    accountType === 'company'
      ? 'contact@alriyadh-construction.test'
      : 'khalid.alharbi@pmtwin.test',
  )
  await page.getByLabel('Password').fill('Pmtwin@2026')
  await page.getByRole('button', { name: 'Login' }).click()
  // Company accounts land on /company-dashboard, individuals on /dashboard.
  await expect(page).toHaveURL(/dashboard/)
}

test('professional profile edits persist and settings remain private by default', async ({
  page,
}) => {
  await signIn(page)

  await page.goto('/profile')
  await page.getByRole('button', { name: /Edit profile|Create profile/ }).click()
  const headline = `Project Delivery Leader ${Date.now()}`
  const xProfile = `https://x.com/pmtwin_${Date.now()}`
  await page.getByLabel('Headline').fill(headline)
  await page.getByRole('tab', { name: 'Social & links' }).click()
  await page.getByRole('textbox', { name: 'X', exact: true }).fill(xProfile)
  await page.getByRole('button', { name: 'Save profile' }).click()
  await expect(page.getByText('Profile updated')).toBeVisible()

  await page.reload()
  await expect(page.getByText(headline).first()).toBeVisible()

  await page.goto('/settings/privacy')
  await expect(page.getByRole('heading', { name: 'Profile privacy' })).toBeVisible()
  await expect(page.getByText(/Profiles are private by default/)).toBeVisible()
  await page.getByRole('switch', { name: 'Show social media links' }).check()
  await page.getByRole('button', { name: 'Save settings' }).click()
  await expect(page.getByText('Settings saved')).toBeVisible()

  await page.goto('/profile/preview')
  await expect(page.getByRole('heading', { name: 'Public profile preview' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'X', exact: true })).toHaveAttribute('href', xProfile)

  await page.goto('/settings/security')
  await expect(page.getByText('Unavailable in browser-only preview')).toBeVisible()
})

test('company registration, address, hours, and VAT fields persist', async ({
  page,
}) => {
  await signIn(page, 'company')
  await page.goto('/profile')
  await page.getByRole('button', { name: /Edit profile|Create profile/ }).click()
  await page.getByRole('tab', { name: 'Company' }).click()

  await page.getByLabel('Registered address').fill('King Fahd Road, Al Olaya')
  await page.getByLabel('City', { exact: true }).fill('Riyadh')
  await page.getByLabel('Region / province').fill('Riyadh Province')
  await page.getByLabel('Postal code').fill('12214')
  await page.getByLabel('Country', { exact: true }).fill('Saudi Arabia')
  await page.getByLabel('Working day starts').fill('08:00')
  await page.getByLabel('Working day ends').fill('17:00')
  await page.getByLabel('Timezone').fill('Asia/Riyadh')
  await page.getByLabel('Commercial Registration number').fill('1010000000')
  await page.getByLabel('Unified National Number (700)').fill('7000000000')
  await page.getByLabel('CR expiry date').fill('2028-12-31')
  await page.getByRole('switch', { name: 'Registered for Saudi VAT' }).check()
  await page.getByLabel('VAT registration number').fill('300000000000003')
  await page.getByRole('button', { name: 'Save profile' }).click()
  await expect(page.getByText('Profile updated')).toBeVisible()

  await page.reload()
  await page.getByRole('tab', { name: 'Company' }).click()
  await expect(page.getByText('7000000000')).toBeVisible()
  await expect(page.getByText('Registered — 15% VAT')).toBeVisible()
})
