import type { Command, CommandResult } from '@pm-twin/commands'

/**
 * Future web-runtime adapter contract.
 * Phase 2.0: interface only — no repository access or side effects.
 */
export interface WebCommandAdapter {
  execute(command: Command): Promise<CommandResult> | CommandResult
}
