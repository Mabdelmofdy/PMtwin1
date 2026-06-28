import type { Command, CommandResult } from '@pm-twin/commands'

/**
 * Write-boundary entry point for command execution.
 * Phase 2.0: interface only — no handlers, workflow, or repository wiring.
 */
export interface CommandGateway {
  execute(command: Command): Promise<CommandResult> | CommandResult
}
