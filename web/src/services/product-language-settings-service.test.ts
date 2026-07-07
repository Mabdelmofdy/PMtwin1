import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { updateProductLanguageSettings } from '@/services/product-language-settings-service.ts'

describe('updateProductLanguageSettings', () => {
  it('non-admin users cannot save overrides', () => {
    const result = updateProductLanguageSettings({
      tenantId: 'tenant-locked',
      locale: 'en',
      overrides: { entities: { opportunity: { label: 'Project' } } },
      updatedBy: 'user-1',
      role: 'professional',
    })
    assert.equal(result, null)
  })

  it('admin users can save overrides', () => {
    const result = updateProductLanguageSettings({
      tenantId: 'tenant-open',
      locale: 'en',
      overrides: { navigation: { opportunities: 'Projects' } },
      updatedBy: 'admin-1',
      role: 'admin',
    })
    assert.equal(result?.tenantId, 'tenant-open')
    assert.equal(result?.overrides.navigation?.opportunities, 'Projects')
  })
})
