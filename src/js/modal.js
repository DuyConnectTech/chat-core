/**
 * Modal — Vanilla JS replacement for Modal
 * Đọc data-bs-toggle="modal", data-bs-target, data-bs-dismiss="modal"
 */

class ModalManager {
    constructor() {
        this.activeModal = null;
        this.backdrop = null;
        this._init();
    }

    _init() {
        // Delegate click: open modal
        document.addEventListener('click', (e) => {
            const trigger = e.target.closest('[data-bs-toggle="modal"]');
            if (trigger) {
                e.preventDefault();
                const targetSelector = trigger.getAttribute('data-bs-target');
                const modal = document.querySelector(targetSelector);
                if (modal) this.open(modal);
                return;
            }

            // Delegate click: close modal (dismiss button)
            const dismissBtn = e.target.closest('[data-bs-dismiss="modal"]');
            if (dismissBtn) {
                e.preventDefault();
                this.close();
                return;
            }
        });

        // Click backdrop → close
        document.addEventListener('click', (e) => {
            if (this.activeModal && e.target === this.activeModal) {
                this.close();
            }
        });

        // ESC key → close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activeModal) {
                this.close();
            }
        });
    }

    open(modal) {
        // Close any existing modal first
        if (this.activeModal) this.close();

        // Create backdrop
        this.backdrop = document.createElement('div');
        this.backdrop.className = 'modal-backdrop';
        document.body.appendChild(this.backdrop);

        // Show modal
        this.activeModal = modal;
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';

        // Trigger reflow then animate backdrop
        requestAnimationFrame(() => {
            this.backdrop.classList.add('show');
        });
    }

    close() {
        if (!this.activeModal) return;

        // Hide modal
        this.activeModal.classList.remove('show');

        // Fade out backdrop
        if (this.backdrop) {
            this.backdrop.classList.remove('show');
            this.backdrop.addEventListener('transitionend', () => {
                this.backdrop?.remove();
                this.backdrop = null;
            }, { once: true });
        }

        document.body.style.overflow = '';
        this.activeModal = null;
    }
}

// --- Export & Auto-init ---
const modalManager = new ModalManager();

// Expose globally for programmatic control
window.modalManager = modalManager;

export default modalManager;
