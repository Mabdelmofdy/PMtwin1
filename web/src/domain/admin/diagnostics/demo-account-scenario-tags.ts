import { getDemoScenarioRegistry } from '@/infrastructure/environment/demo-scenario-registry.ts'

/** Scenario / cast tags shown on Demo Credentials rows. */
export function buildDemoAccountScenarioTags(): ReadonlyMap<string, readonly string[]> {
  const map = new Map<string, string[]>()

  function add(email: string, tag: string) {
    const key = email.toLowerCase()
    const existing = map.get(key) ?? []
    if (!existing.includes(tag)) existing.push(tag)
    map.set(key, existing)
  }

  for (const scenario of getDemoScenarioRegistry()) {
    for (const step of scenario.narrativeSteps) {
      if (step.loginAs?.email) {
        add(step.loginAs.email, scenario.title)
      }
    }
  }

  // Cast-coverage cohorts not always in registry loginAs
  add('noura.pending@pmtwin.test', 'Draft pending')
  add('omar.clarify@pmtwin.test', 'Draft pending')
  add('onboarding@najd-steelworks.test', 'Draft pending')
  add('admin@pmtwin.com', 'Walkthrough host')
  add('fahad.alotaibi@alriyadh-construction.test', 'Employee cast')
  add('noura.aldossary@alriyadh-construction.test', 'Employee cast')
  add('majed.alqahtani@alriyadh-construction.test', 'Employee cast')
  add('reem.alsalem@gulf-development.test', 'Employee cast')
  add('turki.alharbi@gulf-development.test', 'Employee cast')
  add('hassan.alshammari@eastern-equipment.test', 'Employee cast')
  add('lina.alzahrani@eastern-equipment.test', 'Employee cast')
  add('yousef.alghamdi@hijaz-contracting.test', 'Employee cast')
  add('hala.almutairi@hijaz-contracting.test', 'Employee cast')
  add('sami.alomari@riyadh-eng-consult.test', 'Employee cast')
  add('dana.alrashid@riyadh-eng-consult.test', 'Employee cast')
  add('bandar.alsubaie@diriyah-materials.test', 'Employee cast')
  add('maha.alanazi@qassim-builders.test', 'Employee cast')
  add('waleed.albalawi@tabuk-crane-plant.test', 'Employee cast')
  add('contact@hijaz-contracting.test', 'Cast coverage')
  add('contact@qassim-builders.test', 'Cast coverage')
  add('contact@najran-mep.test', 'Cast coverage')
  add('contact@asir-steel.test', 'Cast coverage')
  add('contact@riyadh-eng-consult.test', 'Cast coverage')
  add('contact@makkah-design.test', 'Cast coverage')
  add('contact@diriyah-materials.test', 'Cast coverage')
  add('contact@yanbu-industrial-supply.test', 'Cast coverage')
  add('contact@tabuk-crane-plant.test', 'Cast coverage')

  return map
}

export function scenarioTagsForEmail(
  email: string,
  catalog: ReadonlyMap<string, readonly string[]> = buildDemoAccountScenarioTags(),
): readonly string[] {
  return catalog.get(email.toLowerCase()) ?? []
}
