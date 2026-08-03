/**
 * Admin Matching Command Center — presentation helpers (HTML strings).
 * Loaded before admin-matching-command-center.js; exposed as window.amccUi.
 */
(function (global) {
    'use strict';

    function escapeHtml(s) {
        if (s == null || s === '') return '';
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    /**
     * KPI / summary metric card (replaces inline admin-kpi markup for AMCC).
     */
    function renderSummaryCard(value, label, hint, trend) {
        return ''
            + '<div class="amcc-summary-card admin-kpi-card admin-kpi-card--compact amcc-kpi" role="group">'
            + '<span class="amcc-summary-card__value admin-kpi-value">' + escapeHtml(String(value)) + '</span>'
            + '<span class="amcc-summary-card__label admin-kpi-label">' + escapeHtml(label) + '</span>'
            + (hint ? '<span class="amcc-summary-card__hint admin-kpi-trend">' + escapeHtml(hint) + '</span>' : '')
            + (trend ? '<span class="amcc-summary-card__trend admin-kpi-trend">' + escapeHtml(trend) + '</span>' : '')
            + '</div>';
    }

    function renderEmpty(iconClass, title, desc, ctaHtml) {
        return ''
            + '<div class="amcc-empty" role="status">'
            + '<span class="amcc-empty-icon"><i class="' + escapeHtml(iconClass || 'ph-duotone ph-folder-open') + '" aria-hidden="true"></i></span>'
            + '<p class="amcc-empty-title">' + escapeHtml(title) + '</p>'
            + '<p class="amcc-empty-desc">' + escapeHtml(desc) + '</p>'
            + (ctaHtml || '')
            + '</div>';
    }

    /**
     * Card shell for definition lists (project aggregate, replacement request, etc.).
     */
    function renderDetailsCard(options) {
        const o = options || {};
        const classes = ['amcc-card']
            .concat(o.modifierClass ? [o.modifierClass] : [])
            .concat(o.extraClass ? [o.extraClass] : [])
            .join(' ');
        const dataAttr = o.dataRowAttr
            ? ' data-replacement-row="' + escapeHtml(o.dataRowAttr) + '"'
            : '';
        return ''
            + '<article class="' + escapeHtml(classes) + '"' + dataAttr + '>'
            + (o.headerHtml ? '<header class="amcc-card-head">' + o.headerHtml + '</header>' : '')
            + (o.bodyHtml ? '<div class="amcc-card-body">' + o.bodyHtml + '</div>' : '')
            + (o.footerHtml ? '<footer class="amcc-card-actions">' + o.footerHtml + '</footer>' : '')
            + '</article>';
    }

    /**
     * @param {Array<{title:string, align?:'left'|'right', scope?:string}>} columns
     * @param {string} bodyHtml — <tr>… rows
     * @param {{key:string, page:number, pageSize:number, total:number, maxPage:number}|null} pagination
     */
    function renderDataTable(columns, bodyHtml, pagination) {
        const ths = (columns || []).map(function (c) {
            const align = c.align === 'right' ? ' amcc-th-num' : '';
            const sc = c.scope ? ' scope="' + escapeHtml(c.scope) + '"' : ' scope="col"';
            return '<th' + sc + ' class="' + escapeHtml((c.thClass || '') + align) + '">' + escapeHtml(c.title) + '</th>';
        }).join('');
        const pg = pagination && pagination.total > 0
            ? renderPaginationNav(pagination)
            : '';
        return ''
            + '<div class="amcc-table-stack">'
            + '<div class="amcc-table-wrap amcc-table-wrap--scrollable">'
            + '<table class="amcc-table">'
            + '<thead><tr>' + ths + '</tr></thead>'
            + '<tbody>' + (bodyHtml || '') + '</tbody>'
            + '</table></div>'
            + pg
            + '</div>';
    }

    function renderPaginationNav(p) {
        const key = escapeHtml(p.key);
        const page = p.page;
        const maxPage = Math.max(1, Number(p.maxPage) || 1);
        const total = Number(p.total) || 0;
        const pageSize = Number(p.pageSize) || 25;
        const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
        const end = Math.min(page * pageSize, total);
        const prevDis = page <= 1 ? ' disabled' : '';
        const nextDis = page >= maxPage ? ' disabled' : '';
        const s25 = pageSize === 25 ? ' selected' : '';
        const s50 = pageSize === 50 ? ' selected' : '';
        return ''
            + '<nav class="amcc-table-pagination" aria-label="Table pagination" data-amcc-pagination="' + key + '">'
            + '<span class="amcc-pg-meta">' + escapeHtml(String(start)) + '–' + escapeHtml(String(end)) + ' of ' + escapeHtml(String(total)) + '</span>'
            + '<div class="amcc-pg-btns">'
            + '<button type="button" class="btn btn-secondary btn-sm" data-amcc-pg-key="' + key + '" data-amcc-pg-dir="prev"' + prevDis + '>Previous</button>'
            + '<span class="amcc-pg-label">Page ' + escapeHtml(String(page)) + ' / ' + escapeHtml(String(maxPage)) + '</span>'
            + '<button type="button" class="btn btn-secondary btn-sm" data-amcc-pg-key="' + key + '" data-amcc-pg-dir="next"' + nextDis + '>Next</button>'
            + '<label class="amcc-pg-size"><span class="amcc-pg-size-label">Rows per page</span>'
            + '<select class="amcc-select amcc-pg-select" data-amcc-pg-key="' + key + '" data-amcc-pg-psize="1" aria-label="Rows per page">'
            + '<option value="25"' + s25 + '>25</option>'
            + '<option value="50"' + s50 + '>50</option>'
            + '</select></label>'
            + '</div></nav>';
    }

    /**
     * Activity / audit-style vertical list with timeline rail.
     */
    function renderActivityTimeline(title, itemsHtml, emptyHtml) {
        const head = title ? '<h3 class="section-title">' + escapeHtml(title) + '</h3>' : '';
        if (!itemsHtml) {
            return head + (emptyHtml || '');
        }
        return head + '<ul class="amcc-activity-timeline" role="list">' + itemsHtml + '</ul>';
    }

    /**
     * Optional wrapper for filter row (IDs must remain on child inputs).
     */
    function renderFilterBarInner() {
        return '';
    }

    global.amccUi = {
        escapeHtml: escapeHtml,
        renderSummaryCard: renderSummaryCard,
        renderEmpty: renderEmpty,
        renderDetailsCard: renderDetailsCard,
        renderDataTable: renderDataTable,
        renderPaginationNav: renderPaginationNav,
        renderActivityTimeline: renderActivityTimeline,
        renderFilterBarInner: renderFilterBarInner
    };
})(typeof window !== 'undefined' ? window : globalThis);
