export type {
  CollaborationTaxonomyInput,
  CollaborationValidationResult,
  DerivedMatchingTopology,
  ExchangeMode,
  FieldConditional,
  FieldType,
  MainCollaborationModel,
  MainCollaborationModelDefinition,
  MatchTopology,
  ModelType,
  ModelTypeDefinition,
  SubModelDefinition,
  SubModelEligibility,
  SubModelFieldDefinition,
  SubModelType,
  ValueExchangeFieldGroup,
} from './types.ts'

export {
  EXCHANGE_MODE_KEYS,
  MAIN_COLLABORATION_MODEL_KEYS,
  MATCH_TOPOLOGY_KEYS,
  MODEL_TYPE_KEYS,
  SUB_MODEL_TYPE_KEYS,
} from './types.ts'

export {
  getMainCollaborationModel,
  getModelType,
  getSubModel,
  listMainCollaborationModels,
  listModelTypes,
  listSubModels,
  listSubModelsForMain,
  listSubModelsForModelType,
  resolveMainCollaborationModelLabel,
  resolveModelTypeLabel,
  resolveSubModelLabel,
  MAIN_MODEL_REGISTRY,
  MODEL_TYPE_REGISTRY,
  SUB_MODEL_REGISTRY,
} from './registry/index.ts'

export {
  LEGACY_SUB_MODEL_ALIASES,
  MATCH_TOPOLOGY_SUBMODEL_ALIASES,
  inferMainCollaborationModel,
  isMatchTopologyValue,
  normalizeSubModelType,
} from './legacy/normalize.ts'

export {
  deriveMatchingTopology,
  recommendMatchingTopology,
  validateCollaborationTaxonomy,
  validateOpportunityCollaborationModel,
  validateSubModelAttributes,
} from './validation/index.ts'

export {
  VALUE_EXCHANGE_FIELD_GROUPS,
  buildValueExchangePayload,
  extractCommercialTermsFromExchange,
} from './exchange/value-exchange.ts'

export {
  resolveSubModelFormFields,
  listSubModelFormFieldKeys,
  type SubModelFormField,
} from './forms/sub-model-form.ts'
