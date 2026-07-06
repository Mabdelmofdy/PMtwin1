import {
  MAIN_MODEL_REGISTRY,
  MODEL_TYPE_REGISTRY,
  SUB_MODEL_REGISTRY,
} from './registry-data.ts'
import type {
  MainCollaborationModel,
  MainCollaborationModelDefinition,
  ModelType,
  ModelTypeDefinition,
  SubModelDefinition,
} from '../types.ts'

export function getMainCollaborationModel(
  key: string,
): MainCollaborationModelDefinition | undefined {
  return MAIN_MODEL_REGISTRY[key]
}

export function getModelType(key: string): ModelTypeDefinition | undefined {
  return MODEL_TYPE_REGISTRY[key]
}

export function getSubModel(key: string): SubModelDefinition | undefined {
  return SUB_MODEL_REGISTRY[key]
}

export function listMainCollaborationModels(): readonly MainCollaborationModelDefinition[] {
  return Object.values(MAIN_MODEL_REGISTRY)
}

export function listModelTypes(): readonly ModelTypeDefinition[] {
  return Object.values(MODEL_TYPE_REGISTRY)
}

export function listSubModels(): readonly SubModelDefinition[] {
  return Object.values(SUB_MODEL_REGISTRY)
}

export function listSubModelsForMain(
  mainKey: MainCollaborationModel | string,
): readonly SubModelDefinition[] {
  const main = MAIN_MODEL_REGISTRY[mainKey]
  if (!main) return []
  return main.subModelKeys
    .map((key: string) => SUB_MODEL_REGISTRY[key])
    .filter((entry): entry is SubModelDefinition => Boolean(entry))
}

export function listSubModelsForModelType(
  modelType: ModelType | string,
): readonly SubModelDefinition[] {
  const model = MODEL_TYPE_REGISTRY[modelType]
  if (!model) return []
  return model.subModelKeys
    .map((key: string) => SUB_MODEL_REGISTRY[key])
    .filter((entry): entry is SubModelDefinition => Boolean(entry))
}

export function resolveMainCollaborationModelLabel(key: string): string {
  return MAIN_MODEL_REGISTRY[key]?.name ?? key.replace(/_/g, ' ')
}

export function resolveSubModelLabel(key: string): string {
  return SUB_MODEL_REGISTRY[key]?.name ?? key.replace(/_/g, ' ')
}

export function resolveModelTypeLabel(key: string): string {
  return MODEL_TYPE_REGISTRY[key]?.name ?? key.replace(/_/g, ' ')
}

export {
  MAIN_MODEL_REGISTRY,
  MODEL_TYPE_REGISTRY,
  SUB_MODEL_REGISTRY,
}
