/**
 * @fileoverview Future bridge: CommandGateway → data-service.js
 * Phase 2.0: stub only — no data-service imports, no behavior changes.
 */

/**
 * @typedef {object} CommandEnvelope
 * @property {string} commandType
 * @property {string} aggregateId
 * @property {string} clientRequestId
 */

/**
 * @typedef {object} CommandOutcome
 * @property {boolean} success
 * @property {string} aggregateId
 * @property {string} commandType
 * @property {string[]} [errors]
 */

export class PocCommandAdapter {
    /**
     * @param {CommandEnvelope} command
     * @returns {Promise<CommandOutcome>}
     */
    async execute(command) {
        return {
            success: false,
            aggregateId: command.aggregateId,
            commandType: command.commandType,
            errors: ['PocCommandAdapter: not implemented (Phase 2.0 foundation stub)'],
        };
    }
}
