import type { FieldGroupId } from './types.ts'

export const FIELD_GROUP_LABELS: Readonly<Record<FieldGroupId, string>> = {
  general: 'General',
  commercial: 'Commercial',
  timeline: 'Timeline',
  resources: 'Resources',
  technical: 'Technical',
  legal: 'Legal',
  risk: 'Risk',
  financial: 'Financial',
  location: 'Location',
  requirements: 'Requirements',
}
