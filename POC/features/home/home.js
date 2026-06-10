/**
 * Home Page Component
 * Handles home page interactions
 */

function navigateHeroSearch(query) {
    const q = (query || '').trim();
    const route = q ? `/find?q=${encodeURIComponent(q)}` : '/find';
    if (window.router && typeof window.router.navigate === 'function') {
        window.router.navigate(route);
    } else {
        window.location.hash = route;
    }
}

function initHome() {
    const homePage = document.querySelector('.pm-home');
    const visual = homePage ? homePage.querySelector('.pm-hero-visual') : null;

    const searchForm = document.getElementById('pm-hero-search-form');
    const searchInput = document.getElementById('pm-hero-search-input');
    if (searchForm && searchInput) {
        searchForm.addEventListener('submit', (event) => {
            event.preventDefault();
            navigateHeroSearch(searchInput.value);
        });
        searchForm.querySelectorAll('.pm-hero-search-chip').forEach((chip) => {
            chip.addEventListener('click', () => {
                const term = chip.getAttribute('data-search') || chip.textContent;
                searchInput.value = term;
                navigateHeroSearch(term);
            });
        });
    }

    if (!homePage || !visual || !window.matchMedia('(pointer: fine)').matches) {
        return;
    }

    if (window.motionUtils && window.motionUtils.prefersReducedMotion()) {
        return;
    }

    homePage.dataset.tilt = 'on';

    visual.addEventListener('pointermove', (event) => {
        const rect = visual.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) - 0.5;
        const y = ((event.clientY - rect.top) / rect.height) - 0.5;

        homePage.style.setProperty('--pm-tilt-x', `${x * 4}deg`);
        homePage.style.setProperty('--pm-tilt-y', `${y * -3}deg`);
    });

    visual.addEventListener('pointerleave', () => {
        homePage.style.setProperty('--pm-tilt-x', '0deg');
        homePage.style.setProperty('--pm-tilt-y', '0deg');
    });
}
