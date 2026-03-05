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
     * @param {Object} options - Optional: confirmText (default 'Close'), showCancel (default false), cancelText (default 'Cancel')
     * @returns {Promise<boolean>} - Resolves to true when closed
     */
    async showCustom(contentHTML, title = 'Information', options = {}) {
        return new Promise((resolve) => {
            const { confirmText = 'Close', showCancel = false, cancelText = 'Cancel' } = options;
            const closeIcon = IconHelper ? IconHelper.render('x', { size: 24, weight: 'duotone' }) : '&times;';

            const modal = document.createElement('div');
            modal.className = 'modal-dialog';
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

            const confirmBtn = modal.querySelector('.modal-btn-confirm');
            confirmBtn.addEventListener('click', () => {
                this.close();
                resolve(true);
            });

            if (showCancel) {
                const cancelBtn = modal.querySelector('.modal-btn-cancel');
                cancelBtn.addEventListener('click', () => {
                    this.close();
                    resolve(false);
                });
            }

            const closeBtn = modal.querySelector('.modal-close');
            closeBtn.addEventListener('click', () => {
                this.close();
                resolve(false);
            });

            this.modalContainer.addEventListener('click', (e) => {
                if (e.target === this.modalContainer) {
                    this.close();
                    resolve(false);
                }
            });

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
