import { LegacyFindPage } from '@/pages/public/legacy-find-page'

import { LegacyKnowledgeBasePage } from '@/pages/public/legacy-knowledge-base-page'

import { LegacyWorkflowPage } from '@/pages/public/legacy-workflow-page'

import { LegacyHomePage } from '@/pages/public/legacy-home-page'

import { CollaborationModelsPage } from '@/pages/public/collaboration-models-page'

import { CollaborationWizardPage } from '@/pages/public/collaboration-wizard-page'



export function HomePage() {

  return <LegacyHomePage />

}



export function FindPage() {

  return <LegacyFindPage />

}



export function WorkflowPage() {

  return <LegacyWorkflowPage />

}



export function KnowledgeBasePage() {

  return <LegacyKnowledgeBasePage />

}



export { CollaborationWizardPage }

export { CollaborationModelsPage }


