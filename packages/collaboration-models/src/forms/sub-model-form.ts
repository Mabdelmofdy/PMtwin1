import { getSubModel } from '../registry/index.ts'
import type { SubModelFieldDefinition } from '../types.ts'

export type SubModelFormField = SubModelFieldDefinition & {
  readonly emphasis: 'required' | 'recommended'
}

/** Registry-driven wizard fields for a sub-model (required + recommended). */
export function resolveSubModelFormFields(
  subModelType: string,
): readonly SubModelFormField[] {
  const sub = getSubModel(subModelType)
  if (!sub) return []

  const required = new Set(sub.requiredFields)
  const recommended = new Set(sub.recommendedFields)
  const keys = new Set([...sub.requiredFields, ...sub.recommendedFields])

  return sub.attributes
    .filter((field) => keys.has(field.key))
    .map((field) => ({
      ...field,
      emphasis: required.has(field.key) ? 'required' : 'recommended',
    }))
}

export function listSubModelFormFieldKeys(subModelType: string): readonly string[] {
  return resolveSubModelFormFields(subModelType).map((field) => field.key)
}
