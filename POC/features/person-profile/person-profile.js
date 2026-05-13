/**
 * Person Profile Detail Page
 */

function escapeHtml(str) {
    if (str == null) return '';
    const s = String(str);
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escapeAttr(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;');
}

(function () {
    var SOCIAL_ICONS = {
        linkedin: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>',
        twitter: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
        website: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>',
        facebook: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',
        instagram: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.441 1.441 1.441 1.441-.646 1.441-1.441-.645-1.44-1.441-1.44z"/></svg>'
    };
    var SOCIAL_LABELS = { linkedin: 'LinkedIn', twitter: 'Twitter', website: 'Website', facebook: 'Facebook', instagram: 'Instagram' };

    window.getSocialIconsHtmlPersonProfile = function getSocialIconsHtml(sm, profileWebsite) {
        var items = [
            { key: 'linkedin', url: sm && sm.linkedin },
            { key: 'twitter', url: sm && sm.twitter },
            { key: 'website', url: (sm && sm.website) || profileWebsite },
            { key: 'instagram', url: sm && sm.instagram },
            { key: 'facebook', url: sm && sm.facebook }
        ].filter(function (x) { return x.url; });
        if (items.length === 0) return '';
        return '<div class="social-icons flex flex-wrap gap-3 items-center">' + items.map(function (item) {
            return '<a href="' + escapeHtml(item.url) + '" target="_blank" rel="noopener" class="social-icon-link text-gray-600 hover:text-primary" title="' + escapeHtml(SOCIAL_LABELS[item.key]) + '">' + SOCIAL_ICONS[item.key] + '</a>';
        }).join('') + '</div>';
    };
})();

var getSocialIconsHtml = window.getSocialIconsHtmlPersonProfile;

let currentProfile = null;

async function initPersonProfile(params) {
    let personId = params?.id;
    if (!personId) {
        showProfileError();
        return;
    }
    // Common mistake: /people/profile instead of /profile — send users to account profile
    if (personId === 'profile' || personId === 'me' || personId === 'settings') {
        const target =
            personId === 'settings' && typeof CONFIG !== 'undefined' && CONFIG.ROUTES
                ? CONFIG.ROUTES.SETTINGS
                : CONFIG.ROUTES.PROFILE;
        if (typeof router !== 'undefined' && router.navigate && target) {
            router.navigate(target);
        }
        return;
    }

    await loadProfile(personId);
}

async function loadProfile(personId) {
    const loadingEl = document.getElementById('profile-loading');
    const errorEl = document.getElementById('profile-error');
    const contentEl = document.getElementById('profile-content');
    
    try {
        // Get person from storage (checks both users and companies)
        const person = await dataService.getPersonById(personId);
        const viewer =
            typeof authService !== 'undefined' ? authService.getCurrentUser() : window.authService?.getCurrentUser?.();
        const isSelf =
            viewer &&
            person &&
            (viewer.id === person.id || (viewer.email && person.email && viewer.email === person.email));

        if (!person || (person.isPublic === false && !isSelf)) {
            showProfileError();
            return;
        }
        
        currentProfile = person;
        
        // Hide loading, show content
        if (loadingEl) loadingEl.style.display = 'none';
        if (contentEl) contentEl.style.display = 'block';
        
        // Populate profile data
        populateProfile(person);

        await populatePersonRating(person.id);
        
        // Setup action buttons (async: needs connection status)
        await setupActions(person);
        
    } catch (error) {
        console.error('Error loading profile:', error);
        showProfileError();
    }
}

function showProfileError() {
    const loadingEl = document.getElementById('profile-loading');
    const errorEl = document.getElementById('profile-error');
    
    if (loadingEl) loadingEl.style.display = 'none';
    if (errorEl) errorEl.style.display = 'block';
}

function populateProfile(person) {
    const profile = person.profile || {};
    const isCompany = profile.type === 'company';
    
    // Avatar
    const avatarEl = document.getElementById('profile-avatar');
    if (avatarEl) {
        const name = profile.name || 'Unknown';
        const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        avatarEl.innerHTML = `<div class="avatar-placeholder avatar-lg">${initials}</div>`;
    }
    
    // Basic info
    setTextContent('profile-name', profile.name || 'Unknown');
    setTextContent('profile-headline', profile.headline || profile.title || '');
    
    // Verification badge (professional/consultant)
    const verificationBadgeEl = document.getElementById('profile-verification-badge');
    if (verificationBadgeEl && !isCompany) {
        const status = person.profile?.verificationStatus;
        const rb = typeof window.renderBadge === 'function' ? window.renderBadge : null;
        if (status === 'professional_verified') {
            verificationBadgeEl.innerHTML = rb
                ? rb('Verified Professional', 'success', { extraClass: 'verification-badge' })
                : '<span class="badge badge-success verification-badge">Verified Professional</span>';
        } else if (status === 'consultant_verified') {
            verificationBadgeEl.innerHTML = rb
                ? rb('Verified Consultant', 'success', { extraClass: 'verification-badge' })
                : '<span class="badge badge-success verification-badge">Verified Consultant</span>';
        } else if (status === 'company_verified') {
            verificationBadgeEl.innerHTML = rb
                ? rb('Verified Company', 'success', { extraClass: 'verification-badge' })
                : '<span class="badge badge-success verification-badge">Verified Company</span>';
        }
        else verificationBadgeEl.innerHTML = '';
    } else if (verificationBadgeEl) verificationBadgeEl.innerHTML = '';
    
    // Location
    const locationEl = document.getElementById('profile-location');
    if (locationEl) {
        locationEl.querySelector('span').textContent = profile.location || profile.address || 'Not specified';
    }
    
    // Connections
    const connectionsEl = document.getElementById('profile-connections');
    if (connectionsEl) {
        connectionsEl.querySelector('span').textContent = `${person.connectionCount || 0} connections`;
    }
    
    // Bio
    setTextContent('profile-bio', profile.bio || profile.description || 'No bio available.');
    
    // Services
    const servicesSection = document.getElementById('services-section');
    const servicesEl = document.getElementById('profile-services');
    if (servicesEl && profile.services && profile.services.length > 0) {
        servicesEl.innerHTML = profile.services.map(service => 
            `<div class="service-item">${service}</div>`
        ).join('');
        if (servicesSection) servicesSection.style.display = 'block';
    } else if (servicesSection) {
        servicesSection.style.display = 'none';
    }
    
    // Skills
    const skillsSection = document.getElementById('skills-section');
    const skillsEl = document.getElementById('profile-skills');
    if (skillsEl && profile.skills && profile.skills.length > 0) {
        skillsEl.innerHTML = profile.skills.map((skill, i) => 
            `<span class="skill-tag${i % 2 === 1 ? ' skill-tag-alt' : ''}">${skill}</span>`
        ).join('');
        if (skillsSection) skillsSection.style.display = 'block';
    } else if (skillsSection) {
        skillsSection.style.display = 'none';
    }
    
    // Experience section: timeline for individuals, Key Projects for companies
    const experienceSection = document.getElementById('experience-section');
    const experienceTitleEl = document.getElementById('experience-section-title');
    const timelineEl = document.getElementById('profile-experience-timeline');
    const keyProjectsEl = document.getElementById('profile-key-projects');
    if (experienceSection && experienceTitleEl && timelineEl && keyProjectsEl) {
        timelineEl.style.display = 'none';
        keyProjectsEl.style.display = 'none';
        if (isCompany) {
            const keyProjects = profile.keyProjects && profile.keyProjects.length > 0
                ? profile.keyProjects
                : (profile.caseStudies || []).map(function (c) { return c.title || c.name; }).filter(Boolean);
            if (keyProjects.length > 0) {
                experienceTitleEl.textContent = 'Key Projects';
                keyProjectsEl.innerHTML = keyProjects.map(function (name) {
                    return '<span class="key-project-card">' + escapeHtml(name) + '</span>';
                }).join('');
                keyProjectsEl.style.display = 'flex';
                experienceSection.style.display = 'block';
            } else {
                experienceSection.style.display = 'none';
            }
        } else {
            const entries = profile.experienceEntries || [];
            if (entries.length > 0) {
                experienceTitleEl.textContent = 'Experience';
                timelineEl.innerHTML = entries.map(function (e) {
                    const role = escapeHtml(e.role || 'Role');
                    const company = escapeHtml(e.company || '');
                    const start = escapeHtml(e.startDate || '');
                    const end = (e.endDate === 'Present' || e.endDate === 'present' || !e.endDate) ? 'Present' : escapeHtml(e.endDate);
                    const period = start && end ? start + '\u2013' + end : (start || end || '');
                    const companyLine = company ? '<div class="exp-timeline-company">' + company + '</div>' : '';
                    const periodLine = period ? '<div class="exp-timeline-period">' + period + '</div>' : '';
                    return '<div class="profile-experience-timeline-item"><div class="exp-timeline-card"><div class="exp-timeline-role">' + role + (company ? ' \u2013 ' + company : '') + '</div>' + periodLine + '</div></div>';
                }).join('');
                timelineEl.style.display = 'flex';
                experienceSection.style.display = 'block';
            } else {
                experienceSection.style.display = 'none';
            }
        }
    }
    
    // Certifications (always show section on public profile)
    const certificationsSection = document.getElementById('certifications-section');
    const certificationsEl = document.getElementById('profile-certifications');
    if (certificationsSection && certificationsEl) {
        certificationsSection.style.display = 'block';
        const raw = profile.certifications;
        const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
        if (list.length > 0) {
            certificationsEl.innerHTML = list.map(function (cert) {
                if (typeof cert === 'object' && cert !== null) {
                    const name = cert.name || cert.label || 'Certification';
                    const typeLabel = cert.type ? ' (' + escapeHtml(cert.type) + ')' : '';
                    const safeName = escapeHtml(name);
                    if (cert.url) {
                        return '<span class="certification-badge"><a href="' + escapeAttr(cert.url) + '" target="_blank" rel="noopener">' + safeName + '</a>' + typeLabel + '</span>';
                    }
                    return '<span class="certification-badge">' + safeName + typeLabel + '</span>';
                }
                return '<span class="certification-badge">' + escapeHtml(String(cert)) + '</span>';
            }).join('');
        } else {
            certificationsEl.innerHTML = '<p class="pp-empty-hint" role="status">No certifications listed.</p>';
        }
    }
    
    // Company section
    const companySection = document.getElementById('company-section');
    const companyInfo = document.getElementById('company-info');
    if (companySection && companyInfo) {
        if (isCompany) {
            companySection.style.display = 'block';
            companyInfo.innerHTML = `
                <div class="company-info-item">
                    <strong>Company Type</strong>
                    <span>${profile.companyType || 'N/A'}</span>
                </div>
                <div class="company-info-item">
                    <strong>Employees</strong>
                    <span>${profile.employeeCount || 'N/A'}</span>
                </div>
                <div class="company-info-item">
                    <strong>Established</strong>
                    <span>${profile.yearEstablished || 'N/A'}</span>
                </div>
                <div class="company-info-item">
                    <strong>Sectors</strong>
                    <span>${(profile.sectors || []).join(', ') || 'N/A'}</span>
                </div>
            `;
        } else {
            companySection.style.display = 'none';
        }
    }
    
    // Contact Info
    const emailEl = document.getElementById('contact-email');
    if (emailEl) {
        const emailValue = emailEl.querySelector('.contact-value');
        if (emailValue) {
            emailValue.textContent = person.email || 'Not available';
        }
    }
    
    const phoneEl = document.getElementById('contact-phone');
    if (phoneEl && profile.phone) {
        phoneEl.style.display = 'flex';
        const phoneValue = phoneEl.querySelector('.contact-value');
        if (phoneValue) {
            phoneValue.textContent = profile.phone;
        }
    }
    
    const websiteEl = document.getElementById('contact-website');
    if (websiteEl && profile.website) {
        websiteEl.style.display = 'flex';
        const link = websiteEl.querySelector('a.contact-value');
        if (link) {
            link.href = profile.website;
            link.textContent = profile.website.replace(/^https?:\/\//, '');
        }
    }
    
    // Social media (always show card on public profile)
    const socialCard = document.getElementById('social-media-card');
    const socialLinksEl = document.getElementById('profile-social-links');
    if (socialCard && socialLinksEl) {
        socialCard.style.display = 'block';
        const iconsHtml = getSocialIconsHtml(profile.socialMediaLinks, profile.website);
        socialLinksEl.innerHTML = iconsHtml || '<p class="pp-empty-hint" role="status">No social links provided.</p>';
    }
    
    // Availability (for professionals)
    const availabilityCard = document.getElementById('availability-card');
    if (availabilityCard) {
        if (!isCompany) {
            availabilityCard.style.display = 'block';
            
            const statusEl = document.getElementById('availability-status');
            if (statusEl) {
                const availability = profile.availability || 'Unknown';
                statusEl.textContent = availability;
                statusEl.className = 'availability-badge ' + availability.toLowerCase();
            }
            
            const modeEl = document.getElementById('availability-mode');
            if (modeEl) {
                modeEl.textContent = profile.preferredWorkMode ? 
                    `Preferred: ${profile.preferredWorkMode}` : '';
            }
            
            const rateInfo = document.getElementById('rate-info');
            const rateEl = document.getElementById('hourly-rate');
            if (rateInfo && rateEl && profile.hourlyRate) {
                rateInfo.style.display = 'block';
                rateEl.textContent = `${profile.hourlyRate} ${profile.currency || 'SAR'}/hr`;
            }
        } else {
            availabilityCard.style.display = 'none';
        }
    }
    
    // Interests
    const interestsCard = document.getElementById('interests-card');
    const interestsEl = document.getElementById('profile-interests');
    if (interestsEl && profile.interests && profile.interests.length > 0) {
        interestsEl.innerHTML = profile.interests.map(interest => 
            `<span class="interest-tag">${interest}</span>`
        ).join('');
        if (interestsCard) interestsCard.style.display = 'block';
    } else if (interestsCard) {
        interestsCard.style.display = 'none';
    }
    
    // Languages
    const languagesCard = document.getElementById('languages-card');
    const languagesEl = document.getElementById('profile-languages');
    if (languagesEl && profile.languages && profile.languages.length > 0) {
        languagesEl.innerHTML = profile.languages.map(lang => 
            `<span class="language-tag">${lang}</span>`
        ).join('');
        if (languagesCard) languagesCard.style.display = 'block';
    } else if (languagesCard) {
        languagesCard.style.display = 'none';
    }
}

function setTextContent(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function scoreFromReview(review) {
    if (review == null) return null;
    const o = review.overallScore;
    if (typeof o === 'number' && !Number.isNaN(o)) return Math.max(1, Math.min(5, o));
    const c = review.criteria;
    if (c && typeof c === 'object') {
        const keys = ['communication', 'quality', 'professionalism', 'timeliness'];
        const vals = keys.map((k) => parseInt(c[k], 10)).filter((n) => !Number.isNaN(n));
        if (vals.length) {
            const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
            return Math.max(1, Math.min(5, avg));
        }
    }
    return null;
}

function renderRatingStarsUnicode(avg) {
    const a = Math.max(0, Math.min(5, avg));
    const full = Math.round(a);
    return '\u2605'.repeat(full) + '\u2606'.repeat(5 - full);
}

async function populatePersonRating(personId) {
    const block = document.getElementById('profile-rating-block');
    const starsEl = document.getElementById('profile-rating-stars');
    const valueEl = document.getElementById('profile-rating-value');
    const countEl = document.getElementById('profile-rating-count');
    if (!block || !starsEl || !valueEl || !countEl) return;
    if (!dataService || typeof dataService.getReviewsByRevieweeId !== 'function') {
        block.style.display = 'none';
        return;
    }
    let reviews = [];
    try {
        reviews = await dataService.getReviewsByRevieweeId(personId);
    } catch (e) {
        console.warn('Could not load reviews for profile:', e);
    }
    const scores = reviews.map(scoreFromReview).filter((s) => s != null);
    block.classList.remove('profile-rating--empty');
    if (scores.length === 0) {
        starsEl.textContent = '';
        valueEl.textContent = '';
        countEl.textContent = 'No peer ratings yet';
        block.classList.add('profile-rating--empty');
        block.style.display = 'flex';
        return;
    }
    const sum = scores.reduce((a, b) => a + b, 0);
    const average = sum / scores.length;
    starsEl.textContent = renderRatingStarsUnicode(average);
    valueEl.textContent = average.toFixed(1) + ' / 5';
    const n = scores.length;
    countEl.textContent = '(' + n + ' review' + (n === 1 ? '' : 's') + ')';
    block.style.display = 'flex';
}

async function setupActions(person) {
    const currentUser = authService.getCurrentUser();
    const connectBtn = document.getElementById('btn-connect');
    const messageBtn = document.getElementById('btn-message');
    const connectActionsEl = document.getElementById('connect-actions'); // optional: Accept / Ignore when pending_received
    
    // Check if viewing own profile
    if (currentUser && currentUser.id === person.id) {
        if (connectBtn) connectBtn.style.display = 'none';
        if (messageBtn) {
            messageBtn.textContent = 'Edit Profile';
            messageBtn.style.display = 'inline-block';
            messageBtn.replaceWith(messageBtn.cloneNode(true)); // remove old listeners
            document.getElementById('btn-message').addEventListener('click', () => router.navigate('/profile'));
        }
        if (connectActionsEl) connectActionsEl.style.display = 'none';
        return;
    }
    
    if (!currentUser) {
        if (connectBtn) connectBtn.style.display = 'none';
        if (messageBtn) messageBtn.style.display = 'none';
        if (connectActionsEl) connectActionsEl.style.display = 'none';
        return;
    }
    
    const status = await dataService.getConnectionStatus(currentUser.id, person.id);
    
    // Pending received: show Accept / Ignore and hide Connect
    if (status === 'pending_received') {
        const conn = await dataService.getConnectionBetweenUsers(currentUser.id, person.id);
        if (connectBtn) connectBtn.style.display = 'none';
        if (messageBtn) messageBtn.style.display = 'none';
        if (connectActionsEl) {
            connectActionsEl.style.display = 'flex';
            connectActionsEl.innerHTML = '<span class="pending-label">Wants to connect</span><button id="btn-accept-connection" class="btn btn-primary btn-sm">Accept</button><button id="btn-ignore-connection" class="btn btn-secondary btn-sm">Ignore</button>';
            document.getElementById('btn-accept-connection').addEventListener('click', async () => {
                await dataService.acceptConnection(conn.id);
                if (typeof showNotification === 'function') showNotification('Connection accepted!', 'success');
                await loadProfile(person.id);
            });
            document.getElementById('btn-ignore-connection').addEventListener('click', async () => {
                await dataService.rejectConnection(conn.id);
                if (typeof showNotification === 'function') showNotification('Connection ignored.', 'info');
                await loadProfile(person.id);
            });
        }
        return;
    }
    
    if (connectActionsEl) connectActionsEl.style.display = 'none';
    
    // Connect button: show only when none or when we can send request
    if (connectBtn) {
        connectBtn.style.display = 'block';
        if (status === 'accepted') {
            connectBtn.style.display = 'none';
        } else if (status === 'pending_sent') {
            connectBtn.textContent = 'Pending';
            connectBtn.classList.remove('btn-primary');
            connectBtn.classList.add('btn-warning');
            connectBtn.disabled = true;
            connectBtn.replaceWith(connectBtn.cloneNode(true)); // remove old listener
        } else {
            connectBtn.textContent = 'Connect';
            connectBtn.classList.remove('btn-warning');
            connectBtn.classList.add('btn-primary');
            connectBtn.disabled = false;
            connectBtn.replaceWith(connectBtn.cloneNode(true));
            const btn = document.getElementById('btn-connect');
            btn.addEventListener('click', async () => {
                const conn = await dataService.createConnection(currentUser.id, person.id);
                await dataService.createNotification({
                    userId: person.id,
                    type: 'connection_request',
                    title: 'Connection request',
                    message: `${currentUser.profile?.name || currentUser.email} wants to connect with you.`,
                    connectionId: conn.id,
                    link: '/people/' + currentUser.id
                });
                await window.modalService.success('Connection request sent!', 'Success');
                await loadProfile(person.id);
            });
        }
    }
    
    // Message button: only when connected
    if (messageBtn) {
        if (status === 'accepted') {
            messageBtn.style.display = 'inline-block';
            messageBtn.textContent = 'Message';
            messageBtn.disabled = false;
            messageBtn.removeAttribute('title');
            messageBtn.replaceWith(messageBtn.cloneNode(true));
            const newMessageBtn = document.getElementById('btn-message');
            if (newMessageBtn) {
                newMessageBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    router.navigate(`/messages/${person.id}`);
                });
            }
        } else {
            messageBtn.style.display = status === 'pending_sent' ? 'none' : 'inline-block';
            if (status !== 'accepted') {
                messageBtn.textContent = 'Message';
                messageBtn.disabled = true;
                messageBtn.title = 'Connect first to message';
            }
        }
    }
}
