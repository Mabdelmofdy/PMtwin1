import {
  resolveProductLanguageCatalog,
  type ProductLanguageActionKey,
  type ProductLanguageEntityKey,
  type ProductLanguageLocale,
  type ProductLanguageNavKey,
  type ProductLanguageOverrides,
} from '../../../packages/product-language/src/index.ts'

type ProductLanguageRuntimeState = {
  readonly locale: ProductLanguageLocale
  readonly tenantId: string
  readonly overrides?: ProductLanguageOverrides
}

let runtimeState: ProductLanguageRuntimeState = {
  locale: 'en',
  tenantId: 'default',
  overrides: undefined,
}

function catalog() {
  return resolveProductLanguageCatalog({
    locale: runtimeState.locale,
    overrides: runtimeState.overrides,
  })
}

export function configureProductLanguageRuntime(next: ProductLanguageRuntimeState): void {
  runtimeState = next
}

export const productLanguage = {
  label(entityKey: ProductLanguageEntityKey): string {
    return catalog().entities[entityKey].label
  },
  plural(entityKey: ProductLanguageEntityKey): string {
    return catalog().entities[entityKey].plural
  },
  short(entityKey: ProductLanguageEntityKey): string {
    return catalog().entities[entityKey].short
  },
  description(entityKey: ProductLanguageEntityKey): string {
    return catalog().entities[entityKey].description
  },
  actionLabel(actionKey: ProductLanguageActionKey): string {
    return catalog().actions[actionKey]
  },
  navigationLabel(navKey: ProductLanguageNavKey): string {
    return catalog().navigation[navKey]
  },
}

/**
 * Backward-compatible static object while new UI migrates to productLanguage.* API.
 */
export const PRODUCT_LANGUAGE = {
  get OPEN() { return 'Open' },
  get OPEN_MATCH() { return 'Open match' },
  get OPEN_NEGOTIATION() { return `Open ${productLanguage.label('negotiation').toLowerCase()}` },
  get OPEN_COMMERCIAL_AGREEMENT() { return `Open ${productLanguage.label('commercialAgreement').toLowerCase()}` },
  get OPEN_DEAL() { return `Open ${productLanguage.label('commercialAgreement').toLowerCase()}` },
  get OPEN_CONTRACT() { return `Open ${productLanguage.label('contract').toLowerCase()}` },
  get OPEN_PROFILE() { return 'Open profile' },
  get OPEN_OPPORTUNITIES() { return `Open ${productLanguage.plural('opportunity').toLowerCase()}` },
  get OPEN_PIPELINE() { return 'Open pipeline' },
  get VIEW_ALL() { return 'View all' },
  get VIEW_ALL_MATCHES() { return 'View all matches' },
}

export type ProductLanguageKey = keyof typeof PRODUCT_LANGUAGE
