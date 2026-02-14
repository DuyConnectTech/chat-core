/**
 * Dropdown — Vanilla JS replacement for Dropdown
 * Đọc data-bs-toggle="dropdown" → toggle .show class
 */

class DropdownManager {
    constructor() {
        this.activeDropdown = null;
        this._init();
    }

    _init() {
        // Toggle dropdown on click
        document.addEventListener('click', (e) => {
            const trigger = e.target.closest('[data-bs-toggle="dropdown"]');

            if (trigger) {
                e.preventDefault();
                e.stopPropagation();

                const dropdown = trigger.closest('.dropdown');
                const menu = dropdown?.querySelector('.dropdown-menu');

                if (!menu) return;

                // If this dropdown is already open, close it
                if (menu.classList.contains('show')) {
                    this._close(menu);
                } else {
                    // Close any other open dropdown first
                    this._closeAll();
                    this._open(menu);
                }
                return;
            }

            // Click outside → close all
            this._closeAll();
        });

        // ESC key → close all
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this._closeAll();
            }
        });
    }

    _open(menu) {
        menu.classList.add('show');
        this.activeDropdown = menu;
    }

    _close(menu) {
        menu.classList.remove('show');
        if (this.activeDropdown === menu) {
            this.activeDropdown = null;
        }
    }

    _closeAll() {
        document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
            menu.classList.remove('show');
        });
        this.activeDropdown = null;
    }
}

// Auto-init
const dropdownManager = new DropdownManager();

export default dropdownManager;
