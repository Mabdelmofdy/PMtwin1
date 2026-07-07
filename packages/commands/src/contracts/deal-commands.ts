import type {
  CreateCommercialAgreementFromApplicationCommand,
  CreateCommercialAgreementFromNegotiationCommand,
  CreateCommercialAgreementFromPostMatchCommand,
} from './commercial-agreement-commands.ts'

/** @deprecated use `CreateCommercialAgreementFromNegotiationCommand` */
export type CreateDealFromNegotiationCommand =
  Omit<CreateCommercialAgreementFromNegotiationCommand, 'commandType'> & {
  readonly commandType: 'CreateDealFromNegotiation'
}

/** @deprecated use `CreateCommercialAgreementFromPostMatchCommand` */
export type CreateDealFromPostMatchCommand =
  Omit<CreateCommercialAgreementFromPostMatchCommand, 'commandType'> & {
  readonly commandType: 'CreateDealFromPostMatch'
}

/** @deprecated use `CreateCommercialAgreementFromApplicationCommand` */
export type CreateDealFromApplicationCommand =
  Omit<CreateCommercialAgreementFromApplicationCommand, 'commandType'> & {
  readonly commandType: 'CreateDealFromApplication'
}
