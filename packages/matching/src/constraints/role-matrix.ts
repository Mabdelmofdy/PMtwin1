export const ROLE_COMPATIBILITY: Readonly<Record<string, readonly string[]>> = {
  Architect: ['Architect', 'Interior Designer'],
  'Architectural Design': ['Architect', 'Interior Designer', 'Architectural Design'],
  'Interior Designer': ['Interior Designer', 'Architect'],
  'Civil Engineer': ['Civil Engineer', 'Structural Engineer'],
  'Civil Engineering': ['Civil Engineer', 'Structural Engineer', 'Civil Engineering'],
  'Structural Engineer': ['Structural Engineer', 'Civil Engineer'],
  'Structural Engineering': ['Structural Engineer', 'Civil Engineer', 'Structural Engineering'],
}

export const ROLE_ALIASES: Readonly<Record<string, string>> = {
  'architectural design': 'Architect',
  'interior design': 'Interior Designer',
  'civil engineering': 'Civil Engineer',
  'structural engineering': 'Structural Engineer',
}
