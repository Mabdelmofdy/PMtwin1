import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import type { Negotiation } from '@/types/domain.ts'
import type { CommercialTerms } from '@/types/commercial-terms.ts'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { PmContentCard } from '@/components/layout/pm-layout-index'
import {
  PmFormReadonly,
  PmFormReadonlyField,
  PmFormReadonlySection,
} from '@/components/forms/pm-form-index'
import { PmEmptyState, PmBadge } from '@/components/ui/pm-index'
import { PmTimeline } from '@/components/ui/pm-timeline'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/components/shared/pm-design-tokens'
import { pmResponsive } from '@/tokens'
import { buildNegotiationTranscriptReadModel } from '@/lib/negotiation-transcript-read-model.ts'
import {
  canAcceptNegotiationOffer,
  canRejectNegotiationOffer,
  canSendNegotiationMessage,
  canSubmitNegotiationCounterOffer,
  canSubmitNegotiationOffer,
  findLatestSubmittedOffer,
} from '@/lib/negotiation-room-ui-actions.ts'
import {
  acceptNegotiationOffer,
  rejectNegotiationOffer,
  sendNegotiationMessage,
  submitNegotiationOffer,
} from '@/services/negotiation-room-command-service.ts'
import { peopleApi } from '@/api/people.ts'
import { formatCollaborationExchangeMode } from '@/lib/collaboration-taxonomy-display.ts'
import {
  auditRepository,
  contractRepository,
  dealRepository,
  negotiationMessageRepository,
  negotiationOfferRepository,
  negotiationRepository,
  negotiationTranscriptRepository,
  postMatchRepository,
  applicationRepository,
} from '@/repositories/index.ts'
import type { ViewerContext } from '@/lib/entity-view-visibility.ts'
import { useDataStoreVersion } from '@/hooks/use-data-store'

export type NegotiationRoomPanelProps = {
  readonly negotiation: Negotiation
  readonly viewer: ViewerContext
}

export const NEGOTIATION_LINKED_COMMERCIAL_AGREEMENT_LABEL = 'Commercial Agreement'

function resolveSenderLabel(userId: string): string {
  const person = peopleApi.get(userId)
  return person?.profile?.name ? `${person.profile.name} (${userId})` : userId
}

export function NegotiationRoomPanel({
  negotiation,
  viewer,
}: NegotiationRoomPanelProps) {
  const version = useDataStoreVersion()
  const [messageBody, setMessageBody] = useState('')
  const [offerAmount, setOfferAmount] = useState('')
  const [pending, setPending] = useState(false)

  const roomContext = useMemo(
    () => ({
      userId: viewer.userId ?? null,
      canMutate: viewer.userId ? true : false,
      isParticipant: Boolean(
        viewer.userId
        && (negotiation.participants ?? negotiation.parties ?? []).some(
          (participant) => participant.userId === viewer.userId,
        ),
      ),
      roles: viewer.role ? [viewer.role] : undefined,
    }),
    [negotiation, viewer],
  )

  const readModel = useMemo(
    () =>
      buildNegotiationTranscriptReadModel(negotiation.id, viewer, {
        getNegotiation: (id) => negotiationRepository.getById(id),
        getMessages: (id) => negotiationMessageRepository.getByNegotiationId(id),
        getOffers: (id) => negotiationOfferRepository.getByNegotiationId(id),
        getTranscriptEvents: (id) =>
          negotiationTranscriptRepository.getByNegotiationId(id),
        getAuditEvents: (id) =>
          auditRepository
            .getAll()
            .filter(
              (entry) =>
                entry.entityType === 'negotiation' && entry.entityId === id,
            ),
        getPostMatch: (id) => postMatchRepository.getById(id),
        getApplication: (id) => applicationRepository.getById(id),
        getDealByNegotiation: (id) => dealRepository.findByNegotiationId(id),
        getContractByDeal: (dealId) =>
          contractRepository.getAll().find((contract) => contract.dealId === dealId),
      }),
    [negotiation.id, viewer, version],
  )

  if (!readModel?.canView) {
    return (
      <PmEmptyState
        title="Negotiation room unavailable"
        description="You do not have permission to view this negotiation room."
      />
    )
  }

  const latestSubmitted = findLatestSubmittedOffer(readModel.offers)
  const canWriteMessage = canSendNegotiationMessage(negotiation, roomContext)
  const canWriteOffer = canSubmitNegotiationOffer(negotiation, roomContext)
  const canCounter = canSubmitNegotiationCounterOffer(negotiation, roomContext)
  const canAccept = canAcceptNegotiationOffer(negotiation, roomContext)
  const canReject = canRejectNegotiationOffer(negotiation, roomContext)

  const handleSendMessage = () => {
    if (!viewer.userId || !messageBody.trim() || pending) return
    setPending(true)
    const result = sendNegotiationMessage(negotiation.id, viewer.userId, messageBody.trim())
    setPending(false)
    if (!result.success) {
      toast.error(result.errors?.join('. ') ?? 'Message could not be sent')
      return
    }
    setMessageBody('')
    toast.success('Message sent')
  }

  const buildOfferTerms = (): CommercialTerms => ({
    ...(negotiation.commercialTerms ?? {}),
    exchangeMode: negotiation.commercialTerms?.exchangeMode ?? 'cash',
    currency: negotiation.commercialTerms?.currency ?? 'SAR',
    amount: offerAmount ? Number(offerAmount) : negotiation.commercialTerms?.amount,
  })

  const handleSubmitOffer = (isCounter: boolean) => {
    if (!viewer.userId || pending) return
    setPending(true)
    const result = submitNegotiationOffer(
      negotiation.id,
      viewer.userId,
      buildOfferTerms(),
      isCounter ? 'Counter offer submitted from room' : 'Initial offer submitted from room',
      isCounter,
    )
    setPending(false)
    if (!result.success) {
      toast.error(result.errors?.join('. ') ?? 'Offer could not be submitted')
      return
    }
    toast.success(isCounter ? 'Counter offer submitted' : 'Offer submitted')
  }

  const handleAcceptOffer = (offerId: string) => {
    if (!viewer.userId || pending) return
    setPending(true)
    const result = acceptNegotiationOffer(negotiation.id, viewer.userId, offerId)
    setPending(false)
    if (!result.success) {
      toast.error(result.errors?.join('. ') ?? 'Offer could not be accepted')
      return
    }
    toast.success('Offer accepted — negotiation agreed')
  }

  const handleRejectOffer = (offerId: string) => {
    if (!viewer.userId || pending) return
    setPending(true)
    const result = rejectNegotiationOffer(negotiation.id, viewer.userId, offerId)
    setPending(false)
    if (!result.success) {
      toast.error(result.errors?.join('. ') ?? 'Offer could not be rejected')
      return
    }
    toast.success('Offer rejected')
  }

  return (
    <Tabs defaultValue="discussion" className="space-y-4">
      <TabsList className={cn('max-w-full', pmResponsive.scrollX)}>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="discussion">Discussion</TabsTrigger>
        <TabsTrigger value="offers">Offers &amp; Counter Offers</TabsTrigger>
        <TabsTrigger value="terms">Commercial Terms</TabsTrigger>
        <TabsTrigger value="attachments">Attachments</TabsTrigger>
        <TabsTrigger value="audit">Audit Trail</TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <PmContentCard title="Negotiation overview">
          <PmFormReadonly>
            <PmFormReadonlySection title="Status">
              <PmFormReadonlyField label="Status" value={negotiation.status} />
              <PmFormReadonlyField
                label="Mode"
                value={
                  negotiation.commercialTerms?.exchangeMode
                    ? formatCollaborationExchangeMode(
                        negotiation.commercialTerms.exchangeMode,
                      )
                    : '—'
                }
              />
              {readModel.isAuditor ? (
                <p className={cn(pmTypography.bodySm, 'text-muted-foreground')}>
                  Auditor read-only view — transcript and offers are visible but write actions are disabled.
                </p>
              ) : null}
            </PmFormReadonlySection>
            <PmFormReadonlySection title="Linked records">
              {readModel.linkedEntities.postMatch ? (
                <PmFormReadonlyField
                  label="PostMatch"
                  value={readModel.linkedEntities.postMatch.id}
                />
              ) : null}
              {readModel.linkedEntities.application ? (
                <PmFormReadonlyField
                  label="Application"
                  value={readModel.linkedEntities.application.id}
                />
              ) : null}
              {readModel.linkedEntities.deal ? (
                <PmFormReadonlyField
                  label={NEGOTIATION_LINKED_COMMERCIAL_AGREEMENT_LABEL}
                  value={readModel.linkedEntities.deal.id}
                />
              ) : null}
              {readModel.linkedEntities.contract ? (
                <PmFormReadonlyField
                  label="Contract"
                  value={readModel.linkedEntities.contract.id}
                />
              ) : null}
            </PmFormReadonlySection>
          </PmFormReadonly>
        </PmContentCard>
      </TabsContent>

      <TabsContent value="discussion">
        <PmContentCard title="Discussion">
          {readModel.messages.length === 0 ? (
            <p className={cn(pmTypography.bodySm, 'text-muted-foreground')}>
              No messages yet. Participants can start the negotiation discussion here.
            </p>
          ) : (
            <PmTimeline
              bare
              aria-label="Negotiation messages"
              events={readModel.messages.map((message) => ({
                id: message.id,
                label: resolveSenderLabel(message.senderId),
                description: `${message.body}${message.editedAt ? ' (edited)' : ''} · ${message.senderRole}`,
                timestamp: formatDate(message.createdAt),
                status: message.deletedAt ? ('upcoming' as const) : ('done' as const),
              }))}
            />
          )}
          {canWriteMessage ? (
            <div className="mt-4 space-y-2">
              <Textarea
                value={messageBody}
                onChange={(event) => setMessageBody(event.target.value)}
                placeholder="Write a message to the other party…"
                rows={3}
              />
              <Button disabled={pending || !messageBody.trim()} onClick={handleSendMessage}>
                Send message
              </Button>
            </div>
          ) : readModel.isReadOnly ? (
            <p className={cn(pmTypography.bodySm, 'mt-4 text-muted-foreground')}>
              This negotiation room is read-only.
            </p>
          ) : null}
        </PmContentCard>
      </TabsContent>

      <TabsContent value="offers">
        <PmContentCard title="Offers &amp; counter offers">
          {readModel.offers.length === 0 ? (
            <p className={cn(pmTypography.bodySm, 'text-muted-foreground')}>
              No formal offers submitted yet.
            </p>
          ) : (
            <div className="space-y-3">
              {readModel.offers.map((offer) => (
                <div
                  key={offer.id}
                  className="rounded-lg border border-border p-3 space-y-2"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={pmTypography.label}>v{offer.version}</span>
                    <PmBadge tone="neutral">{offer.status}</PmBadge>
                    {offer.status === 'accepted' ? (
                      <span className={cn(pmTypography.bodySm, 'text-emerald-600')}>
                        Accepted offer
                      </span>
                    ) : null}
                  </div>
                  <p className={cn(pmTypography.bodySm, 'text-muted-foreground')}>
                    {offer.changeSummary ?? 'No change summary'}
                  </p>
                  <p className={cn(pmTypography.caption, 'text-muted-foreground')}>
                    {resolveSenderLabel(offer.submittedBy)} · {formatDate(offer.createdAt)}
                  </p>
                  {offer.status === 'submitted' && (canAccept || canReject) ? (
                    <div className="flex gap-2">
                      {canAccept ? (
                        <Button
                          size="sm"
                          disabled={pending}
                          onClick={() => handleAcceptOffer(offer.id)}
                        >
                          Accept
                        </Button>
                      ) : null}
                      {canReject ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={pending}
                          onClick={() => handleRejectOffer(offer.id)}
                        >
                          Reject
                        </Button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
          {(canWriteOffer || canCounter) && !readModel.acceptedOffer ? (
            <div className="mt-4 space-y-2 border-t border-border pt-4">
              <Input
                type="number"
                value={offerAmount}
                onChange={(event) => setOfferAmount(event.target.value)}
                placeholder={
                  negotiation.commercialTerms?.amount != null
                    ? String(negotiation.commercialTerms.amount)
                    : 'Offer amount (SAR)'
                }
              />
              <div className="flex flex-wrap gap-2">
                {canWriteOffer ? (
                  <Button
                    disabled={pending}
                    onClick={() => handleSubmitOffer(false)}
                  >
                    Submit offer
                  </Button>
                ) : null}
                {canCounter ? (
                  <Button
                    variant="outline"
                    disabled={pending}
                    onClick={() => handleSubmitOffer(true)}
                  >
                    Submit counter offer
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}
          {latestSubmitted && readModel.isReadOnly ? (
            <p className={cn(pmTypography.bodySm, 'mt-4 text-muted-foreground')}>
              Latest submitted offer: v{latestSubmitted.version}
            </p>
          ) : null}
        </PmContentCard>
      </TabsContent>

      <TabsContent value="terms">
        <PmContentCard title="Commercial terms">
          {readModel.commercialTermsTimeline.length === 0 ? (
            <p className={cn(pmTypography.bodySm, 'text-muted-foreground')}>
              Commercial terms will appear when offers are submitted.
            </p>
          ) : (
            <div className="space-y-4">
              {readModel.commercialTermsTimeline.map((entry) => (
                <div key={entry.offerId} className="rounded-lg border border-border p-3">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={pmTypography.label}>v{entry.version}</span>
                    <PmBadge tone="neutral">{entry.status}</PmBadge>
                    {entry.terms.exchangeMode ? (
                      <span className={cn(pmTypography.caption, 'text-muted-foreground')}>
                        {formatCollaborationExchangeMode(entry.terms.exchangeMode)}
                      </span>
                    ) : null}
                  </div>
                  {entry.diffFromPrevious.length > 0 ? (
                    <ul className={cn(pmTypography.bodySm, 'list-disc pl-5 space-y-1')}>
                      {entry.diffFromPrevious.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className={cn(pmTypography.bodySm, 'text-muted-foreground')}>
                      No changes from previous version.
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </PmContentCard>
      </TabsContent>

      <TabsContent value="attachments">
        <PmContentCard title="Attachments">
          {readModel.messages.every((message) => !message.attachments?.length) ? (
            <p className={cn(pmTypography.bodySm, 'text-muted-foreground')}>
              No attachments in this negotiation room yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {readModel.messages.flatMap((message) =>
                (message.attachments ?? []).map((attachment) => (
                  <li
                    key={attachment.id}
                    className={cn(pmTypography.bodySm, 'rounded border border-border p-2')}
                  >
                    <span className="font-medium">{attachment.fileName}</span>
                    {attachment.mimeType ? (
                      <span className="text-muted-foreground"> · {attachment.mimeType}</span>
                    ) : null}
                    {attachment.sizeBytes != null ? (
                      <span className="text-muted-foreground">
                        {' '}
                        · {attachment.sizeBytes} bytes
                      </span>
                    ) : null}
                  </li>
                )),
              )}
            </ul>
          )}
        </PmContentCard>
      </TabsContent>

      <TabsContent value="audit">
        <PmContentCard title="Audit trail">
          <PmTimeline
            bare
            aria-label="Negotiation audit trail"
            events={[
              ...readModel.transcriptEvents.map((event) => ({
                id: event.id,
                label: event.summary,
                description: `${event.eventType} · ${event.actorRole}`,
                timestamp: formatDate(event.timestamp),
                status: 'done' as const,
              })),
              ...readModel.auditEvents.map((event) => ({
                id: event.id,
                label: event.action,
                description: event.entityType,
                timestamp: formatDate(event.timestamp),
                status: 'done' as const,
              })),
            ]}
          />
        </PmContentCard>
      </TabsContent>
    </Tabs>
  )
}
