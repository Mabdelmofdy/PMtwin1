import {
  getWorkflowDefinition,
  WORKFLOW_DEFINITIONS,
} from '@/domain/workflow/definitions/index.ts'
import type {
  WorkflowEntityType,
  WorkflowGraph,
  WorkflowGraphEdge,
  WorkflowGraphNode,
} from '@/domain/workflow/types.ts'

export function buildWorkflowGraph(
  entityType: WorkflowEntityType,
): WorkflowGraph {
  const def = getWorkflowDefinition(entityType)
  const nodes: WorkflowGraphNode[] = def.states.map((id) => ({
    id,
    terminal: def.terminalStates.includes(id),
  }))

  const edges: WorkflowGraphEdge[] = []
  for (const [from, targets] of Object.entries(def.transitions)) {
    for (const to of targets) {
      edges.push({ from, to })
    }
  }

  return {
    entityType,
    workflow: def.name,
    nodes,
    edges,
    adjacencyList: def.transitions,
  }
}

export function buildAllWorkflowGraphs(): Record<
  WorkflowEntityType,
  WorkflowGraph
> {
  return {
    application: buildWorkflowGraph('application'),
    opportunity: buildWorkflowGraph('opportunity'),
    match: buildWorkflowGraph('match'),
    negotiation: buildWorkflowGraph('negotiation'),
    deal: buildWorkflowGraph('deal'),
    contract: buildWorkflowGraph('contract'),
  }
}

export function getAdjacencyList(
  entityType: WorkflowEntityType,
): Readonly<Record<string, readonly string[]>> {
  return getWorkflowDefinition(entityType).transitions
}

/** Mermaid-friendly edge list for future UI visualization. */
export function toMermaidDiagram(entityType: WorkflowEntityType): string {
  const graph = buildWorkflowGraph(entityType)
  const lines = [`stateDiagram-v2`, `  direction LR`]
  for (const edge of graph.edges) {
    lines.push(`  ${edge.from} --> ${edge.to}`)
  }
  for (const node of graph.nodes.filter((n) => n.terminal)) {
    lines.push(`  ${node.id} --> [*]`)
  }
  return lines.join('\n')
}

export { WORKFLOW_DEFINITIONS }
