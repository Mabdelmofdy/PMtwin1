export type ProductLanguageEntityKey =
  | 'opportunity'
  | 'negotiation'
  | 'commercialAgreement'
  | 'contract'
  | 'execution'

export type ProductLanguageActionKey =
  | 'createOpportunity'
  | 'startNegotiation'
  | 'createCommercialAgreement'
  | 'generateContract'
  | 'startExecution'

export type ProductLanguageNavKey =
  | 'opportunities'
  | 'negotiations'
  | 'commercialAgreements'
  | 'contracts'
  | 'execution'

export type ProductLanguageLocale = 'en' | 'ar'

export type ProductLanguageEntityLabels = {
  readonly label: string
  readonly plural: string
  readonly short: string
  readonly description: string
}

export type ProductLanguageCatalog = {
  readonly entities: Record<ProductLanguageEntityKey, ProductLanguageEntityLabels>
  readonly actions: Record<ProductLanguageActionKey, string>
  readonly navigation: Record<ProductLanguageNavKey, string>
}

export type ProductLanguageOverrides = Partial<{
  entities: Partial<Record<ProductLanguageEntityKey, Partial<ProductLanguageEntityLabels>>>
  actions: Partial<Record<ProductLanguageActionKey, string>>
  navigation: Partial<Record<ProductLanguageNavKey, string>>
}>

export const PRODUCT_LANGUAGE_DEFAULTS: Record<ProductLanguageLocale, ProductLanguageCatalog> = {
  en: {
    entities: {
      opportunity: {
        label: 'Opportunity',
        plural: 'Opportunities',
        short: 'Opp',
        description: 'A published need or offer ready for matching.',
      },
      negotiation: {
        label: 'Negotiation',
        plural: 'Negotiations',
        short: 'Neg',
        description: 'A discussion thread for agreeing collaboration terms.',
      },
      commercialAgreement: {
        label: 'Commercial Agreement',
        plural: 'Commercial Agreements',
        short: 'Agreement',
        description: 'Structured agreement created from negotiation outcomes.',
      },
      contract: {
        label: 'Contract',
        plural: 'Contracts',
        short: 'Contract',
        description: 'Formal legal contract generated from a commercial agreement.',
      },
      execution: {
        label: 'Execution',
        plural: 'Executions',
        short: 'Exec',
        description: 'Delivery phase after contracts are active.',
      },
    },
    actions: {
      createOpportunity: 'Create Opportunity',
      startNegotiation: 'Start Negotiation',
      createCommercialAgreement: 'Create Commercial Agreement',
      generateContract: 'Generate Contract',
      startExecution: 'Start Execution',
    },
    navigation: {
      opportunities: 'Opportunities',
      negotiations: 'Negotiations',
      commercialAgreements: 'Commercial Agreements',
      contracts: 'Contracts',
      execution: 'Execution',
    },
  },
  ar: {
    entities: {
      opportunity: {
        label: 'فرصة',
        plural: 'الفرص',
        short: 'فرصة',
        description: 'فرصة منشورة لعرض أو طلب جاهزة للمطابقة.',
      },
      negotiation: {
        label: 'تفاوض',
        plural: 'المفاوضات',
        short: 'تفاوض',
        description: 'مساحة نقاش للاتفاق على شروط التعاون.',
      },
      commercialAgreement: {
        label: 'اتفاقية تجارية',
        plural: 'الاتفاقيات التجارية',
        short: 'اتفاقية',
        description: 'اتفاقية ناتجة عن مخرجات التفاوض.',
      },
      contract: {
        label: 'عقد',
        plural: 'العقود',
        short: 'عقد',
        description: 'عقد قانوني رسمي مُنشأ من اتفاقية تجارية.',
      },
      execution: {
        label: 'تنفيذ',
        plural: 'التنفيذات',
        short: 'تنفيذ',
        description: 'مرحلة التنفيذ بعد تفعيل العقود.',
      },
    },
    actions: {
      createOpportunity: 'إنشاء فرصة',
      startNegotiation: 'بدء التفاوض',
      createCommercialAgreement: 'إنشاء اتفاقية تجارية',
      generateContract: 'إنشاء عقد',
      startExecution: 'بدء التنفيذ',
    },
    navigation: {
      opportunities: 'الفرص',
      negotiations: 'المفاوضات',
      commercialAgreements: 'الاتفاقيات التجارية',
      contracts: 'العقود',
      execution: 'التنفيذ',
    },
  },
}

function mergeCatalog(
  base: ProductLanguageCatalog,
  overrides: ProductLanguageOverrides | undefined,
): ProductLanguageCatalog {
  return {
    entities: {
      opportunity: { ...base.entities.opportunity, ...overrides?.entities?.opportunity },
      negotiation: { ...base.entities.negotiation, ...overrides?.entities?.negotiation },
      commercialAgreement: {
        ...base.entities.commercialAgreement,
        ...overrides?.entities?.commercialAgreement,
      },
      contract: { ...base.entities.contract, ...overrides?.entities?.contract },
      execution: { ...base.entities.execution, ...overrides?.entities?.execution },
    },
    actions: {
      ...base.actions,
      ...overrides?.actions,
    },
    navigation: {
      ...base.navigation,
      ...overrides?.navigation,
    },
  }
}

export function resolveProductLanguageCatalog(input: {
  locale: ProductLanguageLocale
  overrides?: ProductLanguageOverrides
}): ProductLanguageCatalog {
  return mergeCatalog(PRODUCT_LANGUAGE_DEFAULTS[input.locale], input.overrides)
}
