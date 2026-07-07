import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  PRODUCT_LANGUAGE,
  configureProductLanguageRuntime,
  productLanguage,
} from '@/lib/product-language'
import { resolveProductLanguageCatalog } from '../../../packages/product-language/src/index.ts'

describe('PRODUCT_LANGUAGE vocabulary', () => {
  it('renders default labels when no override exists', () => {
    configureProductLanguageRuntime({ locale: 'en', tenantId: 'tenant-default' })
    assert.equal(productLanguage.label('commercialAgreement'), 'Commercial Agreement')
    assert.equal(productLanguage.plural('commercialAgreement'), 'Commercial Agreements')
    assert.equal(productLanguage.actionLabel('createCommercialAgreement'), 'Create Commercial Agreement')
  })

  it('applies tenant overrides to user-facing labels', () => {
    configureProductLanguageRuntime({
      locale: 'en',
      tenantId: 'tenant-a',
      overrides: {
        entities: {
          commercialAgreement: {
            label: 'Partnership Agreement',
            plural: 'Partnership Agreements',
          },
        },
      },
    })
    assert.equal(productLanguage.label('commercialAgreement'), 'Partnership Agreement')
    assert.equal(PRODUCT_LANGUAGE.OPEN_COMMERCIAL_AGREEMENT, 'Open partnership agreement')
  })

  it('resolves Arabic and English catalogs correctly', () => {
    assert.equal(resolveProductLanguageCatalog({ locale: 'en' }).entities.contract.label, 'Contract')
    assert.equal(resolveProductLanguageCatalog({ locale: 'ar' }).entities.contract.label, 'عقد')
  })

  it('keeps workflow action labels sourced from registry API', () => {
    configureProductLanguageRuntime({
      locale: 'en',
      tenantId: 'tenant-actions',
      overrides: {
        actions: {
          createOpportunity: 'Publish Opportunity',
        },
      },
    })
    assert.equal(productLanguage.actionLabel('createOpportunity'), 'Publish Opportunity')
  })
})
