/**
 * Home Page Component
 * Handles home page interactions
 */

function initHome() {
    const homePage = document.querySelector('.pm-home');
    const visual = homePage ? homePage.querySelector('.pm-hero-visual') : null;

    if (!homePage || !visual || !window.matchMedia('(pointer: fine)').matches) {
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
