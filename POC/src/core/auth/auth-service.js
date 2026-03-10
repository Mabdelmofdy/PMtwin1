/**
 * Authentication Service
 * Handles user authentication and authorization
 */

class AuthService {
    constructor() {
        this.dataService = window.dataService || dataService;
        this.currentUser = null;
        this.currentSession = null;
    }
    
    /**
     * Register a new user (individual: professional or consultant)
     */
    async register(userData) {
        // Check if user already exists
        const existingUser = await this.dataService.getUserByEmail(userData.email);
        if (existingUser) {
            throw new Error('User with this email already exists');
        }
        
        // Hash password (simple encoding for POC - NOT secure for production)
        const passwordHash = this.encodePassword(userData.password);
        
        const profile = userData.profile || {};
        // Ensure profile has registration fields
        if (userData.address) {
            profile.address = userData.address;
            profile.location = [userData.address.country, userData.address.region, userData.address.city].filter(Boolean).join(', ');
        }
        if (userData.individualType) profile.individualType = userData.individualType;
        if (userData.specialty !== undefined) profile.specialty = userData.specialty;
        if (userData.documents) profile.documents = userData.documents;
        if (userData.emailVerified !== undefined) profile.emailVerified = userData.emailVerified;
        if (userData.mobileVerified !== undefined) {
            profile.mobileVerified = userData.mobileVerified;
            profile.phoneVerified = userData.mobileVerified === true;
        }
        if (userData.documents && userData.documents.some(d => (d.type || '').toLowerCase().includes('national_id') || (d.type || '').toLowerCase().includes('passport'))) {
            profile.idVerified = true;
        }
        if (userData.preferredCollaborationModels) profile.preferredCollaborationModels = userData.preferredCollaborationModels;
        if (userData.profile?.vettingSkippedAtRegistration !== undefined) profile.vettingSkippedAtRegistration = userData.profile.vettingSkippedAtRegistration === true;
        if (userData.profile?.primaryDomain) profile.primaryDomain = userData.profile.primaryDomain;
        if (Array.isArray(userData.profile?.expertiseAreas)) profile.expertiseAreas = userData.profile.expertiseAreas;
        // Set verification status: unverified when evaluation skipped; otherwise leave for admin to set after review
        if (profile.vettingSkippedAtRegistration === true) {
            profile.verificationStatus = CONFIG.VERIFICATION_STATUS.UNVERIFIED;
        }
        
        const user = await this.dataService.createUser({
            email: userData.email,
            passwordHash,
            role: userData.role,
            status: 'pending',
            profile
        });
        
        await this.dataService.createAuditLog({
            userId: user.id,
            action: 'user_registered',
            entityType: 'user',
            entityId: user.id,
            details: { email: user.email, role: user.role }
        });
        
        return user;
    }
    
    /**
     * Register a new company
     */
    async registerCompany(payload) {
        const existingCompany = await this.dataService.getCompanyByEmail(payload.email);
        if (existingCompany) {
            throw new Error('A company with this email already exists');
        }
        
        const passwordHash = this.encodePassword(payload.password);
        
        const profile = {
            name: payload.companyName,
            type: 'company',
            website: payload.website || null,
            phone: payload.mobile || null,
            address: payload.address || null,
            companyRole: payload.companyRole,
            companySubType: payload.companySubType || null,
            documents: payload.documents || [],
            emailVerified: payload.emailVerified === true,
            mobileVerified: payload.mobileVerified === true,
            phoneVerified: payload.mobileVerified === true,
            preferredCollaborationModels: payload.preferredCollaborationModels || [],
            vettingSkippedAtRegistration: payload.vettingSkippedAtRegistration === true,
            primaryDomain: payload.primaryDomain || null,
            expertiseAreas: Array.isArray(payload.expertiseAreas) ? payload.expertiseAreas : []
        };
        if (payload.industry) profile.sectors = [payload.industry];
        if (payload.companySize) profile.employeeCount = payload.companySize;
        if (payload.companyDescription) profile.description = payload.companyDescription;
        if (payload.crNumber) profile.crNumber = payload.crNumber;
        if (payload.taxId) profile.taxId = payload.taxId;
        if (payload.authorizedRepresentative && (payload.authorizedRepresentative.name || payload.authorizedRepresentative.role)) {
            profile.authorizedRepresentative = payload.authorizedRepresentative;
        }
        if (payload.address) {
            profile.location = [payload.address.country, payload.address.region, payload.address.city].filter(Boolean).join(', ');
        }
        
        const company = await this.dataService.createCompany({
            email: payload.email,
            passwordHash,
            role: CONFIG.ROLES.COMPANY_OWNER,
            status: 'pending',
            profile
        });
        
        await this.dataService.createAuditLog({
            userId: company.id,
            action: 'company_registered',
            entityType: 'company',
            entityId: company.id,
            details: { email: company.email, companyRole: payload.companyRole }
        });
        
        return company;
    }
    
    /**
     * Login user
     * @param {string} email
     * @param {string} password
     * @param {{ rememberMe?: boolean }} [options] - If rememberMe is true, store session in localStorage so user stays signed in on trusted devices.
     */
    async login(email, password, options = {}) {
        const user = await this.dataService.getUserOrCompanyByEmail(email);
        if (!user) {
            throw new Error('Invalid email or password');
        }
        
        // Check password
        const passwordHash = this.encodePassword(password);
        if (user.passwordHash !== passwordHash) {
            throw new Error('Invalid email or password');
        }
        
        // Check user status (pending allowed for read-only demo mode)
        if (user.status === 'rejected') {
            throw new Error('Account registration was rejected. Please contact support.');
        }
        if (user.status === 'suspended') {
            throw new Error('Account suspended. Please contact support.');
        }
        // clarification_requested: allow login so user can complete registration
        
        // Create session
        const token = this.generateToken();
        await this.dataService.createSession(user.id, token);
        
        this.currentUser = user;
        this.currentSession = { token, userId: user.id };
        
        // Create audit log
        await this.dataService.createAuditLog({
            userId: user.id,
            action: 'user_logged_in',
            entityType: 'session',
            entityId: token,
            details: { email: user.email }
        });
        
        const storage = options.rememberMe ? localStorage : sessionStorage;
        storage.setItem('pmtwin_token', token);
        storage.setItem('pmtwin_user', JSON.stringify(user));
        
        return { user, token };
    }
    
    /**
     * Logout user
     */
    async logout() {
        if (this.currentSession) {
            await this.dataService.deleteSession(this.currentSession.token);
            
            // Create audit log
            if (this.currentUser) {
                await this.dataService.createAuditLog({
                    userId: this.currentUser.id,
                    action: 'user_logged_out',
                    entityType: 'session',
                    details: {}
                });
            }
        }
        
        this.currentUser = null;
        this.currentSession = null;
        sessionStorage.removeItem('pmtwin_token');
        sessionStorage.removeItem('pmtwin_user');
        localStorage.removeItem('pmtwin_token');
        localStorage.removeItem('pmtwin_user');
    }
    
    /**
     * Check if user is authenticated
     * Looks in sessionStorage first (current tab), then localStorage (Remember Me).
     */
    async checkAuth() {
        let token = sessionStorage.getItem('pmtwin_token');
        if (!token) token = localStorage.getItem('pmtwin_token');
        if (!token) {
            return false;
        }
        
        const session = await this.dataService.getSessionByToken(token);
        if (!session) {
            sessionStorage.removeItem('pmtwin_token');
            sessionStorage.removeItem('pmtwin_user');
            localStorage.removeItem('pmtwin_token');
            localStorage.removeItem('pmtwin_user');
            return false;
        }
        
        const user = await this.dataService.getUserOrCompanyById(session.userId);
        if (!user) return false;
        // Reject only rejected/suspended; allow active, clarification_requested, and pending (read-only demo)
        if (user.status === 'rejected' || user.status === 'suspended') {
            return false;
        }
        
        this.currentUser = user;
        this.currentSession = session;
        return true;
    }
    
    /**
     * Get current user
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Whether the current user is in read-only demo mode (pending approval).
     * Use to disable mutating actions and show the pending banner/badge.
     */
    isPendingApproval() {
        return !!(this.currentUser && this.currentUser.status === 'pending');
    }
    
    /**
     * Check if user has required role
     */
    hasRole(requiredRole) {
        if (!this.currentUser) return false;
        return this.currentUser.role === requiredRole;
    }
    
    /**
     * Check if user has any of the required roles
     */
    hasAnyRole(requiredRoles) {
        if (!this.currentUser) return false;
        return requiredRoles.includes(this.currentUser.role);
    }
    
    /**
     * Check if user is admin (can manage content and users)
     */
    isAdmin() {
        return this.hasAnyRole([CONFIG.ROLES.ADMIN, CONFIG.ROLES.MODERATOR]);
    }

    /**
     * Check if user can access admin portal (admin, moderator, or auditor)
     * Used for showing Admin/Reports links and rendering admin sidebar
     */
    canAccessAdmin() {
        return this.hasAnyRole([CONFIG.ROLES.ADMIN, CONFIG.ROLES.MODERATOR, CONFIG.ROLES.AUDITOR]);
    }
    
    /**
     * Check if user is company user
     */
    isCompanyUser() {
        return this.hasAnyRole([
            CONFIG.ROLES.COMPANY_OWNER,
            CONFIG.ROLES.COMPANY_ADMIN,
            CONFIG.ROLES.COMPANY_MEMBER
        ]);
    }
    
    /**
     * Check if user is professional
     */
    isProfessional() {
        return this.hasAnyRole([
            CONFIG.ROLES.PROFESSIONAL,
            CONFIG.ROLES.CONSULTANT
        ]);
    }
    
    /**
     * Simple password encoding (POC only - NOT secure)
     */
    encodePassword(password) {
        // Base64 encoding for POC - use proper hashing in production
        return btoa(password);
    }
    
    /**
     * Generate session token
     */
    generateToken() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Change password for the current user (requires current password).
     * @param {string} currentPassword - Current password to verify
     * @param {string} newPassword - New password to set
     */
    async changePassword(currentPassword, newPassword) {
        const user = this.currentUser;
        if (!user || !user.id) throw new Error('You must be logged in to change your password.');
        const currentHash = this.encodePassword(currentPassword);
        if (currentHash !== user.passwordHash) throw new Error('Current password is incorrect.');
        const passwordHash = this.encodePassword(newPassword);
        const isCompany = user.profile?.type === 'company';
        if (isCompany) {
            await this.dataService.updateCompany(user.id, { passwordHash });
        } else {
            await this.dataService.updateUser(user.id, { passwordHash });
        }
    }

    /**
     * Request password reset. POC: creates token and returns it (no email); production would send email.
     * @returns {{ token: string, expiresAt: string } | null} - Token info if account exists; null otherwise.
     */
    async requestPasswordReset(email) {
        const user = await this.dataService.getUserOrCompanyByEmail(email);
        if (!user) return null;
        const { token, expiresAt } = await this.dataService.createResetToken(email);
        return { token, expiresAt };
    }

    /**
     * Reset password using a valid reset token.
     */
    async resetPassword(token, newPassword) {
        const entry = await this.dataService.getResetTokenByToken(token);
        if (!entry) throw new Error('Invalid or expired reset link. Please request a new one.');
        const user = await this.dataService.getUserOrCompanyByEmail(entry.email);
        if (!user) throw new Error('Account not found.');
        const passwordHash = this.encodePassword(newPassword);
        const isCompany = user.profile?.type === 'company';
        if (isCompany) {
            await this.dataService.updateCompany(user.id, { passwordHash });
        } else {
            await this.dataService.updateUser(user.id, { passwordHash });
        }
        await this.dataService.deleteResetToken(token);
    }
}

// Create singleton instance
const authService = new AuthService();

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = authService;
} else {
    window.authService = authService;
}
