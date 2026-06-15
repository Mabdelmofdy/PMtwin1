/**
 * Build unified negotiation transcripts for export (Phase 5).
 */

function sortByAt(items) {
    return (items || []).slice().sort((a, b) => new Date(a.at || 0) - new Date(b.at || 0));
}

/**
 * @param {object} opts
 * @param {object} opts.negotiation
 * @param {object|null} [opts.dispute]
 * @param {string} [opts.opportunityTitle]
 * @param {Function} [opts.resolveName] async (userId) => string
 * @param {boolean} [opts.includeAdminNotes]
 */
async function buildNegotiationTranscript(opts) {
    const negotiation = opts.negotiation || {};
    const dispute = opts.dispute || null;
    const resolveName = typeof opts.resolveName === 'function'
        ? opts.resolveName
        : async (id) => id || 'Unknown';
    const includeAdminNotes = opts.includeAdminNotes === true;

    const timeline = [];

    timeline.push({
        at: negotiation.createdAt,
        kind: 'system',
        actor: 'System',
        summary: 'Negotiation opened',
        body: ''
    });

    for (const msg of (negotiation.discussionThread || [])) {
        timeline.push({
            at: msg.at,
            kind: 'discussion',
            actor: await resolveName(msg.by),
            actorId: msg.by,
            summary: 'Discussion message',
            body: msg.body || ''
        });
    }

    let prevTerms = { ...(negotiation.initialTerms || {}) };
    const nt = typeof globalThis !== 'undefined' ? globalThis.negotiationTerms : null;
    for (let i = 0; i < (negotiation.rounds || []).length; i++) {
        const round = negotiation.rounds[i];
        const nextTerms = round.proposal && nt?.mergeProposalTerms
            ? nt.mergeProposalTerms(prevTerms, round.proposal)
            : prevTerms;
        const deltas = nt?.computeTermDeltas
            ? nt.computeTermDeltas(prevTerms, nextTerms)
            : [];
        prevTerms = nextTerms;
        timeline.push({
            at: round.at,
            kind: 'formal_proposal',
            actor: await resolveName(round.by),
            actorId: round.by,
            round: i + 1,
            summary: 'Formal counter-proposal (round ' + (i + 1) + ')',
            body: round.message || '',
            deltas: deltas.map(d => d.label + ': ' + d.from + ' → ' + d.to).join('; ')
        });
    }

    if ((negotiation.status || '').toLowerCase() === 'agreed') {
        timeline.push({
            at: negotiation.agreedAt || negotiation.updatedAt,
            kind: 'system',
            actor: 'System',
            summary: 'Terms agreed by all required parties',
            body: ''
        });
    }

    if (dispute) {
        timeline.push({
            at: dispute.raisedAt,
            kind: 'dispute',
            actor: await resolveName(dispute.raisedBy),
            actorId: dispute.raisedBy,
            summary: 'Dispute raised — ' + (dispute.category || 'other'),
            body: dispute.description || ''
        });
        for (const msg of (dispute.thread || [])) {
            if (msg.at === dispute.raisedAt && msg.body === dispute.description) continue;
            timeline.push({
                at: msg.at,
                kind: 'dispute_message',
                actor: await resolveName(msg.by),
                actorId: msg.by,
                summary: 'Dispute thread message',
                body: msg.body || ''
            });
        }
        if (dispute.resolution) {
            timeline.push({
                at: dispute.resolution.resolvedAt || dispute.updatedAt,
                kind: 'dispute_resolution',
                actor: await resolveName(dispute.resolution.resolvedBy),
                actorId: dispute.resolution.resolvedBy,
                summary: 'Dispute resolved — ' + (dispute.resolution.outcome || ''),
                body: dispute.resolution.notes || ''
            });
        }
    }

    if (includeAdminNotes) {
        for (const note of (negotiation.adminNotes || [])) {
            timeline.push({
                at: note.at,
                kind: 'admin_note',
                actor: await resolveName(note.by),
                actorId: note.by,
                summary: 'Internal admin note',
                body: note.note || ''
            });
        }
    }

    const terms = nt?.getEffectiveTerms
        ? nt.getEffectiveTerms(negotiation)
        : (negotiation.currentTerms || negotiation.initialTerms || {});

    return {
        exportedAt: new Date().toISOString(),
        negotiationId: negotiation.id,
        opportunityId: negotiation.opportunityId || null,
        opportunityTitle: opts.opportunityTitle || negotiation.opportunityId || '—',
        matchId: negotiation.matchId || null,
        status: negotiation.status,
        parties: (negotiation.parties || []).map(p => ({
            userId: p.userId,
            role: p.role || 'participant'
        })),
        terms,
        agreedTerms: negotiation.agreedTerms || null,
        disputeId: dispute?.id || negotiation.disputeId || null,
        disputeStatus: dispute?.status || null,
        timeline: sortByAt(timeline)
    };
}

function transcriptTimelineToCsv(transcript) {
    const headers = ['at', 'kind', 'actor', 'summary', 'body', 'deltas', 'round'];
    const rows = [headers.join(',')];
    (transcript.timeline || []).forEach(item => {
        const cells = headers.map(h => {
            const val = item[h] != null ? String(item[h]) : '';
            return '"' + val.replace(/"/g, '""') + '"';
        });
        rows.push(cells.join(','));
    });
    return rows.join('\n');
}

function transcriptToJson(transcript) {
    return JSON.stringify(transcript, null, 2);
}

function downloadTextFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType || 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

export {
    buildNegotiationTranscript,
    transcriptTimelineToCsv,
    transcriptToJson,
    downloadTextFile
};

if (typeof window !== 'undefined') {
    window.negotiationTranscriptExport = {
        buildNegotiationTranscript,
        transcriptTimelineToCsv,
        transcriptToJson,
        downloadTextFile
    };
}
