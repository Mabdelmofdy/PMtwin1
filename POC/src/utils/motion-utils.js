/**
 * Vanilla motion utilities (Framer Motion alternative for non-React pages).
 * Respects prefers-reduced-motion per UI/UX Pro Max guidelines.
 */
(function () {
    function prefersReducedMotion() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    function stagger(container, itemSelector, className) {
        if (!container) return;
        const items = container.querySelectorAll(itemSelector);
        if (!items.length) return;
        if (prefersReducedMotion()) {
            items.forEach((el) => el.classList.add('ds-animate-in-fast'));
            return;
        }
        container.classList.add('ds-stagger');
        items.forEach((el) => el.classList.add(className || 'ds-animate-in'));
    }

    function animateIn(root, selector) {
        if (!root) return;
        const targets = selector ? root.querySelectorAll(selector) : [root];
        targets.forEach((el) => {
            el.classList.add(prefersReducedMotion() ? 'ds-animate-in-fast' : 'ds-animate-in');
        });
    }

    function animateStep(stepEl) {
        if (!stepEl) return;
        stepEl.classList.remove('ds-step-enter');
        void stepEl.offsetWidth;
        stepEl.classList.add('ds-step-enter');
    }

    function initPageMotion(pageName) {
        if (prefersReducedMotion()) return;

        if (pageName === 'home') {
            const hero = document.querySelector('.pm-hero-copy');
            if (hero) hero.classList.add('ds-animate-in');
            stagger(document.querySelector('.pm-metrics-grid'), 'article');
            stagger(document.querySelector('.pm-card-grid'), '.pm-card');
            stagger(document.querySelector('.pm-model-grid'), 'article');
        }

        if (pageName === 'dashboard') {
            stagger(document.querySelector('.dash-stats'), '.dash-stat-card');
            const panels = document.querySelectorAll('.dash-panel, .dash-profile-card, .dash-banner');
            panels.forEach((panel, i) => {
                panel.style.animationDelay = `${i * 80}ms`;
                panel.classList.add('ds-animate-in');
            });
        }

        if (pageName === 'admin-dashboard') {
            stagger(document.querySelector('.admin-attention-grid'), '.admin-attention-card');
            stagger(document.querySelector('.admin-kpi-grid'), '.admin-kpi-card');
            stagger(document.querySelector('.admin-pending-grid'), '.admin-pending-card');
        }

        if (pageName === 'register') {
            const card = document.querySelector('.reg-main-card');
            if (card) card.classList.add('ds-animate-in');
        }
    }

    window.motionUtils = {
        prefersReducedMotion,
        stagger,
        animateIn,
        animateStep,
        initPageMotion
    };
})();
