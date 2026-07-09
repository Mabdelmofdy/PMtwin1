import { Link } from 'react-router-dom'
import { ArrowLeftRight, ArrowRight, RefreshCw, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'
import { PmBadge, type PmBadgeTone } from '@/components/ui/pm-badge'

export type PmTopologyKind = 'one_way' | 'two_way' | 'consortium' | 'circular'

export type PmTopologyNodeKind = 'need' | 'offer' | 'participant' | 'role'

export type PmTopologyGraphNode = {
  readonly id: string
  readonly label: string
  readonly kind: PmTopologyNodeKind
  readonly href?: string
  readonly subtitle?: string
}

export type PmTopologyGraphProps = {
  topology: PmTopologyKind
  nodes: readonly PmTopologyGraphNode[]
  className?: string
  /** Compact node sizing for cards and list rows. */
  compact?: boolean
  'aria-label'?: string
}

const NODE_TONE: Record<PmTopologyNodeKind, PmBadgeTone> = {
  need: 'info',
  offer: 'success',
  participant: 'neutral',
  role: 'neutral',
}

const NODE_KIND_LABEL: Record<PmTopologyNodeKind, string> = {
  need: 'Need',
  offer: 'Offer',
  participant: 'Party',
  role: 'Role',
}

const TOPOLOGY_DESCRIPTION: Record<PmTopologyKind, string> = {
  one_way: 'One-way match: a need is fulfilled by an offer.',
  two_way: 'Two-way match: both sides exchange value with each other.',
  consortium: 'Consortium: a lead need is fulfilled by multiple partners together.',
  circular: 'Circular exchange: each party offers to the next, closing a loop.',
}

function TopologyNodeCard({
  node,
  emphasized = false,
  compact = false,
}: {
  readonly node: PmTopologyGraphNode
  readonly emphasized?: boolean
  readonly compact?: boolean
}) {
  const inner = (
    <div
      data-slot="pm-topology-node"
      data-kind={node.kind}
      className={cn(
        'rounded-lg border text-center transition-colors',
        compact ? 'min-w-[6.5rem] px-2.5 py-2' : 'min-w-[8rem] p-3',
        emphasized
          ? 'border-primary/40 bg-primary/5'
          : 'border-border/60 bg-background',
        node.href && 'hover:border-primary/40 hover:bg-primary/[0.03]',
      )}
    >
      {node.subtitle ? (
        <p className={cn(pmTypography.caption, 'truncate text-muted-foreground')}>
          {node.subtitle}
        </p>
      ) : null}
      <p className={cn(pmTypography.bodySm, 'truncate font-medium')}>{node.label}</p>
      <PmBadge tone={NODE_TONE[node.kind]} size="sm" className={compact ? 'mt-1' : 'mt-2'}>
        {NODE_KIND_LABEL[node.kind]}
      </PmBadge>
    </div>
  )

  if (node.href) {
    return (
      <Link
        to={node.href}
        className="cursor-pointer rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
      >
        {inner}
      </Link>
    )
  }

  return inner
}

function EdgeIcon({
  topology,
  compact,
}: {
  readonly topology: PmTopologyKind
  readonly compact: boolean
}) {
  const sizeClass = compact ? 'size-3.5' : 'size-4'
  if (topology === 'two_way') {
    return <ArrowLeftRight className={cn(sizeClass, 'shrink-0 text-primary')} aria-hidden />
  }
  return (
    <ArrowRight
      className={cn(sizeClass, 'shrink-0 text-muted-foreground rtl:rotate-180')}
      aria-hidden
    />
  )
}

/**
 * Reusable match topology visual (DS v2) — makes one_way, two_way,
 * consortium, and circular structurally distinct and screen-reader friendly.
 */
export function PmTopologyGraph({
  topology,
  nodes,
  className,
  compact = false,
  'aria-label': ariaLabel,
}: PmTopologyGraphProps) {
  if (nodes.length === 0) return null

  const description = TOPOLOGY_DESCRIPTION[topology]

  let body: React.ReactNode

  if (topology === 'consortium') {
    const leads = nodes.filter((node) => node.kind === 'need')
    const partners = nodes.filter((node) => node.kind !== 'need')
    body = (
      <div className="space-y-3">
        {leads.map((lead) => (
          <div key={lead.id} className="flex justify-center">
            <TopologyNodeCard node={lead} emphasized compact={compact} />
          </div>
        ))}
        {partners.length > 0 ? (
          <>
            <div className="flex justify-center" aria-hidden>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Users className={compact ? 'size-3.5' : 'size-4'} />
                <span className={pmTypography.caption}>
                  {partners.length} partner{partners.length === 1 ? '' : 's'}
                </span>
              </span>
            </div>
            <div className={cn('grid gap-2', compact ? 'sm:grid-cols-3' : 'sm:grid-cols-2')}>
              {partners.map((partner) => (
                <TopologyNodeCard key={partner.id} node={partner} compact={compact} />
              ))}
            </div>
          </>
        ) : null}
      </div>
    )
  } else if (topology === 'circular') {
    body = (
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-center gap-2 py-1">
          {nodes.map((node, index) => (
            <div key={node.id} className="flex items-center gap-2">
              <TopologyNodeCard node={node} compact={compact} />
              {index < nodes.length - 1 ? (
                <EdgeIcon topology={topology} compact={compact} />
              ) : null}
            </div>
          ))}
        </div>
        <p
          className={cn(
            pmTypography.caption,
            'flex items-center justify-center gap-1.5 text-muted-foreground',
          )}
        >
          <RefreshCw className="size-3.5" aria-hidden />
          <span>Closes back to {nodes[0]?.label}</span>
        </p>
      </div>
    )
  } else {
    body = (
      <div className="flex flex-wrap items-center justify-center gap-3 py-1">
        {nodes.map((node, index) => (
          <div key={node.id} className="flex items-center gap-3">
            <TopologyNodeCard node={node} compact={compact} />
            {index < nodes.length - 1 ? (
              <EdgeIcon topology={topology} compact={compact} />
            ) : null}
          </div>
        ))}
      </div>
    )
  }

  return (
    <figure
      data-slot="pm-topology-graph"
      data-topology={topology}
      className={className}
      aria-label={ariaLabel ?? description}
    >
      {body}
      <figcaption className="sr-only">{description}</figcaption>
    </figure>
  )
}
