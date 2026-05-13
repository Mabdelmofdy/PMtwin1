/**
 * Modal Utility - For confirmation dialogs and modals
 */

class ModalService {
    constructor() {
        this.modalContainer = null;
        this.init();
    }

    init() {
        // Create modal container if it doesn't exist
        if (!document.getElementById('modal-container')) {
            this.modalContainer = document.createElement('div');
            this.modalContainer.id = 'modal-container';
            this.modalContainer.className = 'modal-overlay';
            this.modalContainer.style.display = 'none';
            document.body.appendChild(this.modalContainer);
        } else {
            this.modalContainer = document.getElementById('modal-container');
        }
    }

    /**
     * Show a confirmation modal
     * @param {string} message - The message to display
     * @param {string} title - Optional title (default: "Confirmation")
     * @param {Object} options - Optional configuration
     * @returns {Promise<boolean>} - Resolves to true if confirmed, false if cancelled
     */
    async confirm(message, title = 'Confirmation', options = {}) {
        return new Promise((resolve) => {
            const {
                confirmText = 'OK',
                cancelText = 'Cancel',
                showCancel = true,
                type = 'info' // 'info', 'success', 'warning', 'error'
            } = options;

            const modal = document.createElement('div');
            modal.className = 'modal-dialog';
            
            // Use Phosphor Duotone icons
            const iconMap = {
                success: IconHelper ? IconHelper.render('check-circle', { size: 64, weight: 'duotone' }) : '✓',
                error: IconHelper ? IconHelper.render('x-circle', { size: 64, weight: 'duotone' }) : '✕',
                warning: IconHelper ? IconHelper.render('warning-circle', { size: 64, weight: 'duotone' }) : '⚠',
                info: IconHelper ? IconHelper.render('info-circle', { size: 64, weight: 'duotone' }) : 'ℹ'
            };

            const icon = iconMap[type] || iconMap.info;
            const iconClass = `modal-icon modal-icon-${type}`;
            const closeIcon = IconHelper ? IconHelper.render('x', { size: 24, weight: 'duotone' }) : '&times;';

            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 class="modal-title">${title}</h3>
                        <button class="modal-close" aria-label="Close">${closeIcon}</button>
                    </div>
                    <div class="modal-body">
                        <div class="${iconClass}">${icon}</div>
                        <p class="modal-message">${message}</p>
                    </div>
                    <div class="modal-footer">
                        ${showCancel ? `<button class="btn btn-secondary modal-btn-cancel">${cancelText}</button>` : ''}
                        <button class="btn btn-primary modal-btn-confirm">${confirmText}</button>
                    </div>
                </div>
            `;

            this.modalContainer.innerHTML = '';
            this.modalContainer.appendChild(modal);
            this.modalContainer.style.display = 'flex';

            // Handle confirm button
            const confirmBtn = modal.querySelector('.modal-btn-confirm');
            confirmBtn.addEventListener('click', () => {
                this.close();
                resolve(true);
            });

            // Handle cancel button
            if (showCancel) {
                const cancelBtn = modal.querySelector('.modal-btn-cancel');
                cancelBtn.addEventListener('click', () => {
                    this.close();
                    resolve(false);
                });
            }

            // Handle close button
            const closeBtn = modal.querySelector('.modal-close');
            closeBtn.addEventListener('click', () => {
                this.close();
                resolve(false);
            });

            // Handle overlay click (close on outside click)
            this.modalContainer.addEventListener('click', (e) => {
                if (e.target === this.modalContainer) {
                    this.close();
                    resolve(false);
                }
            });

            // Handle Escape key
            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    this.close();
                    document.removeEventListener('keydown', handleEscape);
                    resolve(false);
                }
            };
            document.addEventListener('keydown', handleEscape);
        });
    }

    /**
     * Show a success confirmation modal
     */
    async success(message, title = 'Success') {
        return this.confirm(message, title, {
            confirmText: 'OK',
            showCancel: false,
            type: 'success'
        });
    }

    /**
     * Show an error confirmation modal
     */
    async error(message, title = 'Error') {
        return this.confirm(message, title, {
            confirmText: 'OK',
            showCancel: false,
            type: 'error'
        });
    }

    /**
     * Show an info confirmation modal
     */
    async info(message, title = 'Information') {
        return this.confirm(message, title, {
            confirmText: 'OK',
            showCancel: false,
            type: 'info'
        });
    }

    /**
     * Show a modal with custom HTML content
     * @param {string} contentHTML - HTML string for the modal body (e.g. table, div)
     * @param {string} title - Modal title
     * @param {Object} options - Optional: confirmText (default 'Close'), showCancel (default false), cancelText (default 'Cancel'),
     *   modalClass (extra class on .modal-dialog), getPayload (optional (dialogEl) => { ok: true, value } | { ok: false } — when ok false, modal stays open),
     *   onMount (optional (dialogEl) => void — runs once after the dialog is mounted; use for wiring dynamic form controls)
     * @returns {Promise<boolean|*>} - Resolves to true when closed without getPayload; with getPayload, resolves to `value` on confirm or false when dismissed
     */
    async showCustom(contentHTML, title = 'Information', options = {}) {
        return new Promise((resolve) => {
            const { confirmText = 'Close', showCancel = false, cancelText = 'Cancel', getPayload, modalClass = '', onMount } = options;
            const closeIcon = IconHelper ? IconHelper.render('x', { size: 24, weight: 'duotone' }) : '&times;';

            const modal = document.createElement('div');
            modal.className = 'modal-dialog' + (modalClass ? ' ' + modalClass : '');
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 class="modal-title">${title}</h3>
                        <button class="modal-close" aria-label="Close">${closeIcon}</button>
                    </div>
                    <div class="modal-body modal-body-custom">
                        ${contentHTML}
                    </div>
                    <div class="modal-footer">
                        ${showCancel ? '<button class="btn btn-secondary modal-btn-cancel">' + cancelText + '</button>' : ''}
                        <button class="btn btn-primary modal-btn-confirm">${confirmText}</button>
                    </div>
                </div>
            `;

            this.modalContainer.innerHTML = '';
            this.modalContainer.appendChild(modal);
            this.modalContainer.style.display = 'flex';

            if (typeof onMount === 'function') {
                try {
                    onMount(modal);
                } catch (err) {
                    console.error('modal showCustom onMount:', err);
                }
            }

            const cleanup = () => {
                document.removeEventListener('keydown', handleEscape);
            };

            const dismiss = (value) => {
                cleanup();
                this.close();
                resolve(value);
            };

            const confirmBtn = modal.querySelector('.modal-btn-confirm');
            confirmBtn.addEventListener('click', () => {
                if (typeof getPayload === 'function') {
                    const result = getPayload(modal);
                    if (!result || result.ok !== true) return;
                    dismiss(result.value);
                    return;
                }
                dismiss(true);
            });

            if (showCancel) {
                const cancelBtn = modal.querySelector('.modal-btn-cancel');
                cancelBtn.addEventListener('click', () => {
                    dismiss(false);
                });
            }

            const closeBtn = modal.querySelector('.modal-close');
            closeBtn.addEventListener('click', () => {
                dismiss(false);
            });

            this.modalContainer.addEventListener(
                'click',
                (e) => {
                    if (e.target === this.modalContainer) {
                        dismiss(false);
                    }
                },
                { once: true }
            );

            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    dismiss(false);
                }
            };
            document.addEventListener('keydown', handleEscape);
        });
    }

    /**
     * Suspend account: required reason + optional internal note (admin records).
     * @param {string} [entityLabel='account'] — e.g. "user" or "company"
     * @returns {Promise<{ reasonKey: string, reasonLabel: string, note: string }|null>}
     */
    async openSuspendAccountDialog(entityLabel = 'account') {
        const REASONS = [
            { key: 'poor_rating', label: 'Poor rating' },
            { key: 'policy_violation', label: 'Policy violation' },
            { key: 'user_complaint', label: 'User complaint' },
            { key: 'fraud_suspicious', label: 'Fraud / suspicious activity' },
            { key: 'other', label: 'Other' }
        ];
        const optionsHtml = REASONS.map(
            r => `<option value="${r.key}">${r.label.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</option>`
        ).join('');

        return new Promise(resolve => {
            const closeIcon = IconHelper ? IconHelper.render('x', { size: 24, weight: 'duotone' }) : '&times;';
            const modal = document.createElement('div');
            modal.className = 'modal-dialog';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 class="modal-title">Suspend ${entityLabel}</h3>
                        <button type="button" class="modal-close" aria-label="Close">${closeIcon}</button>
                    </div>
                    <div class="modal-body modal-body-custom">
                        <p class="modal-message">Select a suspension reason. An optional internal note is stored with the suspension record.</p>
                        <div class="form-group" style="margin-bottom: 0.75rem;">
                            <label for="umgmt-suspend-reason" class="form-label">Reason</label>
                            <select id="umgmt-suspend-reason" class="form-select" required>
                                <option value="">Choose a reason…</option>
                                ${optionsHtml}
                            </select>
                            <p id="umgmt-suspend-reason-err" class="text-sm" style="color: #b91c1c; margin-top: 0.35rem; display: none;">Please select a reason.</p>
                        </div>
                        <div class="form-group">
                            <label for="umgmt-suspend-note" class="form-label">Internal note (optional)</label>
                            <textarea id="umgmt-suspend-note" class="form-input" rows="2" placeholder="For admin records only"></textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary modal-btn-cancel">Cancel</button>
                        <button type="button" class="btn btn-warning modal-btn-confirm">Suspend</button>
                    </div>
                </div>
            `;

            this.modalContainer.innerHTML = '';
            this.modalContainer.appendChild(modal);
            this.modalContainer.style.display = 'flex';

            const sel = modal.querySelector('#umgmt-suspend-reason');
            const noteEl = modal.querySelector('#umgmt-suspend-note');
            const err = modal.querySelector('#umgmt-suspend-reason-err');

            const closeWith = value => {
                document.removeEventListener('keydown', handleKeys);
                this.close();
                resolve(value);
            };

            const submit = () => {
                const key = (sel?.value || '').trim();
                if (!key) {
                    if (err) err.style.display = 'block';
                    sel?.focus();
                    return;
                }
                if (err) err.style.display = 'none';
                const opt = sel.options[sel.selectedIndex];
                const reasonLabel = opt ? opt.textContent.trim() : key;
                const note = (noteEl?.value || '').trim();
                closeWith({ reasonKey: key, reasonLabel, note });
            };

            modal.querySelector('.modal-btn-confirm').addEventListener('click', submit);
            modal.querySelector('.modal-btn-cancel').addEventListener('click', () => closeWith(null));
            modal.querySelector('.modal-close').addEventListener('click', () => closeWith(null));
            this.modalContainer.addEventListener('click', function onOverlay(e) {
                if (e.target === this) {
                    this.removeEventListener('click', onOverlay);
                    closeWith(null);
                }
            });

            const handleKeys = e => {
                if (e.key === 'Escape') closeWith(null);
            };
            document.addEventListener('keydown', handleKeys);
            setTimeout(() => sel?.focus(), 30);
        });
    }

    /**
     * Show a prompt modal that captures free-text or selection input.
     * @param {string} message - Prompt message displayed above the field.
     * @param {Object} [options]
     * @param {string} [options.title='Provide details']
     * @param {string} [options.confirmText='Submit']
     * @param {string} [options.cancelText='Cancel']
     * @param {string} [options.placeholder='']
     * @param {string} [options.defaultValue='']
     * @param {boolean} [options.required=false]
     * @param {boolean} [options.multiline=true] - Use textarea (true) or input (false)
     * @param {'info'|'warning'|'error'|'success'} [options.type='info']
     * @returns {Promise<string|null>} - Resolves to the entered text or null if cancelled.
     */
    async prompt(message, options = {}) {
        return new Promise((resolve) => {
            const {
                title = 'Provide details',
                confirmText = 'Submit',
                cancelText = 'Cancel',
                placeholder = '',
                defaultValue = '',
                required = false,
                multiline = true,
                type = 'info'
            } = options;

            const iconMap = {
                success: IconHelper ? IconHelper.render('check-circle', { size: 36, weight: 'duotone' }) : '✓',
                error: IconHelper ? IconHelper.render('x-circle', { size: 36, weight: 'duotone' }) : '✕',
                warning: IconHelper ? IconHelper.render('warning-circle', { size: 36, weight: 'duotone' }) : '⚠',
                info: IconHelper ? IconHelper.render('info-circle', { size: 36, weight: 'duotone' }) : 'ℹ'
            };
            const icon = iconMap[type] || iconMap.info;
            const closeIcon = IconHelper ? IconHelper.render('x', { size: 24, weight: 'duotone' }) : '&times;';
            const field = multiline
                ? `<textarea class="modal-prompt-input" rows="3" placeholder="${placeholder}">${defaultValue}</textarea>`
                : `<input type="text" class="modal-prompt-input" placeholder="${placeholder}" value="${defaultValue}">`;

            const modal = document.createElement('div');
            modal.className = 'modal-dialog';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 class="modal-title">${title}</h3>
                        <button class="modal-close" aria-label="Close">${closeIcon}</button>
                    </div>
                    <div class="modal-body modal-body-prompt">
                        <div class="modal-prompt-row">
                            <div class="modal-icon modal-icon-${type} modal-icon-sm">${icon}</div>
                            <div class="modal-prompt-content">
                                <p class="modal-message">${message}</p>
                                ${field}
                                <p class="modal-prompt-error" hidden>This field is required.</p>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary modal-btn-cancel">${cancelText}</button>
                        <button class="btn btn-primary modal-btn-confirm">${confirmText}</button>
                    </div>
                </div>
            `;

            this.modalContainer.innerHTML = '';
            this.modalContainer.appendChild(modal);
            this.modalContainer.style.display = 'flex';

            const input = modal.querySelector('.modal-prompt-input');
            const errorEl = modal.querySelector('.modal-prompt-error');
            setTimeout(() => input?.focus(), 30);

            const closeWith = (value) => {
                document.removeEventListener('keydown', handleKeys);
                this.close();
                resolve(value);
            };

            const submit = () => {
                const value = (input?.value || '').trim();
                if (required && !value) {
                    if (errorEl) errorEl.hidden = false;
                    input?.focus();
                    return;
                }
                closeWith(value);
            };

            modal.querySelector('.modal-btn-confirm').addEventListener('click', submit);
            modal.querySelector('.modal-btn-cancel').addEventListener('click', () => closeWith(null));
            modal.querySelector('.modal-close').addEventListener('click', () => closeWith(null));
            this.modalContainer.addEventListener('click', (e) => {
                if (e.target === this.modalContainer) closeWith(null);
            });

            const handleKeys = (e) => {
                if (e.key === 'Escape') closeWith(null);
                else if (e.key === 'Enter' && (!multiline || (e.ctrlKey || e.metaKey))) {
                    e.preventDefault();
                    submit();
                }
            };
            document.addEventListener('keydown', handleKeys);
        });
    }

    /**
     * Close the modal
     */
    close() {
        if (this.modalContainer) {
            this.modalContainer.style.display = 'none';
            this.modalContainer.innerHTML = '';
        }
    }
}

// Create singleton instance
const modalService = new ModalService();

// Expose globally for use throughout the application
window.modalService = modalService;
