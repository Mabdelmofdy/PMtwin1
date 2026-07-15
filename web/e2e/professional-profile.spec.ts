import { expect, test } from '@playwright/test'

async function signIn(page: import('@playwright/test').Page) {
  await page.goto('/login')
  await page.getByLabel('Email').fill('khalid.alharbi@pmtwin.test')
  await page.getByLabel('Password').fill('Pmtwin@2026')
  await page.getByRole('button', { name: 'Login' }).click()
  await expect(page).toHaveURL(/\/dashboard/)
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
