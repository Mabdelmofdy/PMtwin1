/**
 * Centralized status labels + badge variants (soft pill design in main.css).
 * Internal/storage status strings stay lowercase snake_case; UI uses friendly labels.
 */
(function (global) {
    const CONTEXTS = {
        VETTING: 'vetting',
        PROFILE: 'profile',
        OPPORTUNITY: 'opportunity',
        APPLICATION: 'application',
        DEAL: 'deal',
        CONTRACT: 'contract',
        MATCH: 'match',
        USER: 'user',
        SYSTEM: 'system',
        NOTIFICATION: 'notification'
    };

    const VARIANTS = ['success', 'warning', 'info', 'purple', 'danger', 'neutral', 'teal', 'orange'];

    function normalizeStatus(status) {
        if (status == null || status === '') return '';
        return String(status).trim().toLowerCase().replace(/\s+/g, '_');
    }

    function humanize(status) {
        const s = normalizeStatus(status);
        if (!s) return '—';
        return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    }

    /** Default variant when context does not override */
    function defaultVariantForStatus(s) {
        const map = {
            active: 'success',
            approved: 'success',
            accepted: 'success',
            completed: 'success',
            published: 'success',
            healthy: 'success',
            confirmed: 'success',
            contracted: 'success',
            in_execution: 'success',
            pending: 'warning',
            pending_signature: 'warning',
            pending_review: 'warning',
            reviewing: 'info',
            clarification_requested: 'info',
            in_review: 'info',
            shortlisted: 'purple',
            resubmitted: 'purple',
            delivery: 'purple',
            consultant: 'purple',
            rejected: 'danger',
            suspended: 'danger',
            cancelled: 'danger',
            terminated: 'danger',
            critical: 'danger',
            declined: 'danger',
            draft: 'neutral',
            closed: 'neutral',
            read: 'neutral',
            inactive: 'neutral',
            archived: 'neutral',
            withdrawn: 'neutral',
            expired: 'neutral',
            company: 'teal',
            need: 'teal',
            consortium: 'teal',
            barter: 'orange',
            circular: 'orange',
            hiring: 'orange',
            negotiating: 'warning',
            in_negotiation: 'warning',
            signing: 'warning',
            review: 'info',
            execution: 'success'
        };
        return map[s] || 'neutral';
    }

    function resolveVariant(status, context) {
        const s = normalizeStatus(status);
        const ctx = normalizeStatus(context) || 'system';

        if (ctx === 'contract' && s === 'pending') return 'warning';
        if (ctx === 'contract' && s === 'active') return 'success';

        if (ctx === 'deal') {
            if (s === 'delivery') return 'purple';
            if (s === 'negotiating') return 'warning';
            if (s === 'signing') return 'warning';
            if (s === 'review') return 'info';
            if (s === 'draft') return 'neutral';
            if (s === 'closed') return 'neutral';
            if (s === 'cancelled') return 'danger';
            if (s === 'completed') return 'success';
            if (s === 'active' || s === 'execution') return 'success';
        }

        if (ctx === 'opportunity') {
            if (s === 'closed') return 'neutral';
            if (s === 'cancelled') return 'danger';
            if (s === 'in_negotiation') return 'warning';
            if (s === 'draft') return 'neutral';
            if (s === 'published' || s === 'contracted' || s === 'in_execution' || s === 'completed') return 'success';
        }

        if (ctx === 'application') {
            if (s === 'shortlisted') return 'purple';
            if (s === 'reviewing') return 'info';
            if (s === 'pending') return 'warning';
            if (s === 'in_negotiation') return 'warning';
            if (s === 'accepted') return 'success';
            if (s === 'rejected') return 'danger';
            if (s === 'withdrawn') return 'neutral';
        }

        if (ctx === 'match') {
            if (s === 'pending') return 'warning';
            if (s === 'accepted' || s === 'confirmed') return 'success';
            if (s === 'declined') return 'danger';
            if (s === 'expired') return 'neutral';
        }

        if (ctx === 'system') {
            if (s === 'healthy') return 'success';
            if (s === 'warning') return 'warning';
            if (s === 'critical') return 'danger';
        }

        return defaultVariantForStatus(s);
    }

    function getStatusLabel(status, context) {
        const s = normalizeStatus(status);
        const ctx = normalizeStatus(context) || 'opportunity';

        if (ctx === 'vetting' || ctx === 'user') {
            if (s === 'pending') return 'Pending Review';
            if (s === 'clarification_requested') return 'Waiting for Updates';
            if (s === 'active') return 'Active';
            if (s === 'rejected') return 'Rejected';
            if (s === 'suspended') return 'Suspended';
            return humanize(s);
        }

        if (ctx === 'profile') {
            if (s === 'pending') return 'Pending Review';
            if (s === 'clarification_requested') return 'Needs Updates';
            if (s === 'active') return 'Active';
            if (s === 'rejected') return 'Rejected';
            if (s === 'suspended') return 'Suspended';
            return humanize(s);
        }

        if (ctx === 'opportunity') {
            const labels = {
                draft: 'Draft',
                published: 'Published',
                in_negotiation: 'In negotiation',
                contracted: 'Contracted',
                in_execution: 'In execution',
                completed: 'Completed',
                closed: 'Closed',
                cancelled: 'Cancelled',
                reviewing: 'In review',
                pending: 'Pending review',
                shortlisted: 'Shortlisted',
                accepted: 'Accepted',
                rejected: 'Rejected',
                withdrawn: 'Withdrawn'
            };
            return labels[s] || humanize(s);
        }

        if (ctx === 'application') {
            const labels = {
                pending: 'Pending review',
                reviewing: 'Under review',
                shortlisted: 'Shortlisted',
                in_negotiation: 'In negotiation',
                accepted: 'Accepted',
                rejected: 'Rejected',
                withdrawn: 'Withdrawn'
            };
            return labels[s] || humanize(s);
        }

        if (ctx === 'deal') {
            const labels = {
                negotiating: 'Negotiating',
                draft: 'Draft',
                review: 'In review',
                signing: 'Waiting for Signatures',
                active: 'Active Deal',
                execution: 'In execution',
                delivery: 'In delivery',
                completed: 'Completed',
                closed: 'Closed',
                cancelled: 'Cancelled'
            };
            return labels[s] || humanize(s);
        }

        if (ctx === 'contract') {
            const labels = {
                pending: 'Pending Signature',
                active: 'Active Contract',
                completed: 'Completed',
                terminated: 'Terminated'
            };
            return labels[s] || humanize(s);
        }

        if (ctx === 'match') {
            if (!s) return 'Pending Response';
            const labels = {
                pending: 'Pending Response',
                accepted: 'Accepted',
                declined: 'Declined',
                confirmed: 'Confirmed',
                expired: 'Expired',
                converted_to_deal: 'Converted to Deal'
            };
            return labels[s] || humanize(s);
        }

        if (ctx === 'negotiation') {
            const labels = {
                open: 'Negotiation Open',
                counter_offered: 'Negotiation Open',
                agreed: 'Terms Agreed',
                cancelled: 'Negotiation Cancelled'
            };
            return labels[s] || humanize(s);
        }

        if (ctx === 'invitation') {
            const labels = {
                sent: 'Invitation Sent',
                invitation_sent: 'Invitation Sent',
                accepted: 'Application Submitted',
                declined: 'Invitation Declined'
            };
            return labels[s] || humanize(s);
        }

        if (ctx === 'replacement') {
            const labels = {
                pending_owner_review: 'Replacement Pending',
                invitation_sent: 'Replacement Pending',
                replacement_accepted: 'Replacement Accepted',
                completed: 'Replacement Completed',
                superseded: 'Superseded',
                rejected: 'Declined'
            };
            return labels[s] || humanize(s);
        }

        if (ctx === 'notification') {
            if (s === 'pending') return 'Pending';
            if (s === 'accepted') return 'Accepted';
            if (s === 'declined') return 'Declined';
            return humanize(s);
        }

        if (ctx === 'system') {
            if (s === 'healthy') return 'Healthy';
            if (s === 'warning') return 'Warning';
            if (s === 'critical') return 'Critical';
            return humanize(s);
        }

        return humanize(s);
    }

    function getStatusBadgeClass(status, context) {
        const v = resolveVariant(status, context);
        return VARIANTS.includes(v) ? `badge--${v}` : 'badge--neutral';
    }

    function escapeHtml(text) {
        if (text == null) return '';
        const d = typeof document !== 'undefined' ? document.createElement('div') : null;
        if (d) {
            d.textContent = String(text);
            return d.innerHTML;
        }
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    /**
     * @param {string} label - Visible text (will be escaped)
     * @param {string} variant - success | warning | info | purple | danger | neutral | teal | orange
     * @param {{ extraClass?: string, attrs?: string }} [options]
     */
    function renderBadge(label, variant, options) {
        const opts = options || {};
        let v = normalizeStatus(variant).replace(/badge--/g, '');
        if (!VARIANTS.includes(v)) v = 'neutral';
        const extra = opts.extraClass ? ` ${opts.extraClass}` : '';
        const attrs = opts.attrs || '';
        return `<span class="badge badge--${v}${extra}"${attrs}>${escapeHtml(label)}</span>`;
    }

    function renderStatusBadge(status, context, options) {
        return renderBadge(getStatusLabel(status, context), resolveVariant(status, context), options);
    }

    /**
     * Model / sub-model ribbon styling (not account status).
     */
    function getModelTypeBadgeClass(modelType, subModelType) {
        const mt = normalizeStatus(modelType);
        const sm = normalizeStatus(subModelType);
        if (sm === 'consortium' || mt === 'consortium') return 'badge--teal';
        if (mt === 'hiring' || sm.includes('hiring')) return 'badge--orange';
        if (mt === 'resource_pooling' && (sm === 'circular' || sm.includes('circular'))) return 'badge--orange';
        if (mt === 'strategic_partnership' && sm.includes('barter')) return 'badge--orange';
        return 'badge--info';
    }

    const api = {
        CONTEXTS,
        VARIANTS,
        normalizeStatus,
        getStatusLabel,
        getStatusBadgeClass,
        resolveVariant,
        renderBadge,
        renderStatusBadge,
        escapeHtml: escapeHtml,
        getModelTypeBadgeClass
    };

    global.statusBadgeSystem = api;
    global.getStatusLabel = function (status, context) {
        return api.getStatusLabel(status, context);
    };
    global.renderBadge = function (label, variant, options) {
        return api.renderBadge(label, variant, options);
    };
    global.getStatusBadgeClass = function (status, context) {
        return api.getStatusBadgeClass(status, context);
    };

    global.humanizeStatusKey = humanize;
})(typeof window !== 'undefined' ? window : globalThis);
