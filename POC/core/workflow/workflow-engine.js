/**
 * Workflow transition enforcement (POC).
 * Loaded via absolute URL /core/workflow/workflow-engine.js from data-service (ES module).
 * Stub: allow transitions; production would validate against CONFIG state machines.
 */
export function enforceTransition(entityType, currentRecord, nextStatus) {
    if (nextStatus == null) return;
    // POC: permissive — no throw. Add strict rules when backend enforces lifecycle.
    void entityType;
    void currentRecord;
    void nextStatus;
}
