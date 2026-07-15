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
  await page.getByLabel('Headline').fill(headline)
  await page.getByRole('button', { name: 'Save profile' }).click()
  await expect(page.getByText('Profile updated')).toBeVisible()

  await page.reload()
  await expect(page.getByText(headline)).toBeVisible()

  await page.goto('/settings/privacy')
  await expect(page.getByRole('heading', { name: 'Profile privacy' })).toBeVisible()
  await expect(page.getByText(/Profiles are private by default/)).toBeVisible()

  await page.goto('/settings/security')
  await expect(page.getByText('Unavailable in browser-only preview')).toBeVisible()
})
