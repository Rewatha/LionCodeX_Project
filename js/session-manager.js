// Clean Session Manager for SealTech Engineering
// File: js/session-manager.js

class SessionManager {
    constructor() {
        this.currentUser = null;
        this.isLoggedIn = false;
        this.init();
    }

    init() {
        this.checkSession();
        this.updateNavigation();
        this.handlePageSpecificContent();
    }

    checkSession() {
        // Check localStorage for user data
        const userData = localStorage.getItem('currentUser');
        if (userData) {
            try {
                this.currentUser = JSON.parse(userData);
                this.isLoggedIn = true;
            } catch (error) {
                console.error('Error parsing user data:', error);
                this.clearSession();
            }
        }
    }

    updateNavigation() {
        const navLinks = document.querySelector('.nav-links');
        if (!navLinks) return;

        // Get current page name
        const currentPath = window.location.pathname;
        const currentPage = currentPath.split('/').pop().replace('.html', '') || 'index';

        // Determine if we're in the pages directory
        const isInPagesDir = currentPath.includes('/pages/');

        if (this.isLoggedIn && this.currentUser) {
            navLinks.innerHTML = this.buildAuthenticatedNav(currentPage, isInPagesDir);
        } else {
            navLinks.innerHTML = this.buildPublicNav(currentPage, isInPagesDir);
        }

        // Reattach mobile menu functionality
        this.setupMobileMenu();
    }

    buildPublicNav(currentPage, isInPagesDir) {
        const pathPrefix = isInPagesDir ? '' : 'pages/';
        const homeLink = isInPagesDir ? '../index.html' : 'index.html';

        return `
            <li><a href="${homeLink}" ${currentPage === 'index' ? 'class="active"' : ''}>Home</a></li>
            <li><a href="${pathPrefix}services.html" ${currentPage === 'services' ? 'class="active"' : ''}>Services</a></li>
            <li><a href="${pathPrefix}about.html" ${currentPage === 'about' ? 'class="active"' : ''}>About Us</a></li>
            <li><a href="${pathPrefix}projects.html" ${currentPage === 'projects' ? 'class="active"' : ''}>Projects</a></li>
            <li><a href="${pathPrefix}contact.html" ${currentPage === 'contact' ? 'class="active"' : ''}>Contact</a></li>
            <li><a href="${pathPrefix}auth.html" class="login-btn">Login</a></li>
        `;
    }

    buildAuthenticatedNav(currentPage, isInPagesDir) {
        const pathPrefix = isInPagesDir ? '' : 'pages/';
        const homeLink = isInPagesDir ? '../index.html' : 'index.html';
        const dashboardPage = this.getDashboardPage();

        return `
            <li><a href="${homeLink}" ${currentPage === 'index' ? 'class="active"' : ''}>Home</a></li>
            <li><a href="${pathPrefix}services.html" ${currentPage === 'services' ? 'class="active"' : ''}>Services</a></li>
            <li><a href="${pathPrefix}about.html" ${currentPage === 'about' ? 'class="active"' : ''}>About Us</a></li>
            <li><a href="${pathPrefix}projects.html" ${currentPage === 'projects' ? 'class="active"' : ''}>Projects</a></li>
            <li><a href="${pathPrefix}contact.html" ${currentPage === 'contact' ? 'class="active"' : ''}>Contact</a></li>
            <li><a href="${pathPrefix}${dashboardPage}" ${this.isDashboardPage(currentPage) ? 'class="active"' : ''}>Dashboard</a></li>
            <li><a href="#" onclick="sessionManager.logout()" class="logout-btn">Logout</a></li>
        `;
    }

    getDashboardPage() {
        if (!this.currentUser) return 'user-dashboard.html';
        
        switch (this.currentUser.userType) {
            case 'admin':
                return 'admin-dashboard.html';
            case 'staff':
                return 'staff-dashboard.html';
            default:
                return 'user-dashboard.html';
        }
    }

    isDashboardPage(currentPage) {
        return ['user-dashboard', 'admin-dashboard', 'staff-dashboard'].includes(currentPage);
    }

    handlePageSpecificContent() {
        const currentPath = window.location.pathname;
        
        // Only apply protection logic to contact page
        if (currentPath.includes('contact.html')) {
            this.handleContactPage();
        }
        
        // Handle any elements specifically marked as protected
        this.handleProtectedElements();
    }

    handleContactPage() {
        if (!this.isLoggedIn) {
            this.hideContactContent();
            this.showLoginRequiredMessage();
        } else {
            this.showContactContent();
        }
    }

    hideContactContent() {
        // Hide contact methods
        const contactMethods = document.querySelector('.contact-methods');
        if (contactMethods) {
            contactMethods.style.display = 'none';
        }

        // Hide contact form section
        const contactFormSection = document.querySelector('.contact-form-section');
        if (contactFormSection) {
            contactFormSection.style.display = 'none';
        }

        // Hide map section
        const mapSection = document.querySelector('.map-section');
        if (mapSection) {
            mapSection.style.display = 'none';
        }

        // Hide emergency contact
        const emergencyContact = document.querySelector('.emergency-contact');
        if (emergencyContact) {
            emergencyContact.style.display = 'none';
        }
    }

    showContactContent() {
        // Show all contact content for logged-in users
        const contactMethods = document.querySelector('.contact-methods');
        if (contactMethods) {
            contactMethods.style.display = 'block';
            contactMethods.classList.add('fade-in-up');
        }

        const contactFormSection = document.querySelector('.contact-form-section');
        if (contactFormSection) {
            contactFormSection.style.display = 'block';
            contactFormSection.classList.add('fade-in-up');
        }

        const mapSection = document.querySelector('.map-section');
        if (mapSection) {
            mapSection.style.display = 'block';
            mapSection.classList.add('fade-in-up');
        }

        const emergencyContact = document.querySelector('.emergency-contact');
        if (emergencyContact) {
            emergencyContact.style.display = 'block';
            emergencyContact.classList.add('fade-in-up');
        }
    }

    showLoginRequiredMessage() {
        // Find the auth-required-section div
        const authRequiredSection = document.getElementById('auth-required-section');
        if (!authRequiredSection) return;

        const pathPrefix = window.location.pathname.includes('/pages/') ? '' : 'pages/';

        authRequiredSection.innerHTML = `
            <div class="login-required-container">
                <div class="login-required-content">
                    <div class="login-icon">
                        <i class="fas fa-lock"></i>
                    </div>
                    <h2>Account Required</h2>
                    <p>To access our contact information and send us a message, you need to create an account or login to your existing account.</p>
                    <div class="login-benefits">
                        <h3>Why create an account?</h3>
                        <ul>
                            <li><i class="fas fa-check"></i> Access to all contact information</li>
                            <li><i class="fas fa-check"></i> Send direct messages to our team</li>
                            <li><i class="fas fa-check"></i> Track your project inquiries</li>
                            <li><i class="fas fa-check"></i> Get personalized service quotes</li>
                            <li><i class="fas fa-check"></i> Priority customer support</li>
                        </ul>
                    </div>
                    <div class="login-actions">
                        <a href="${pathPrefix}auth.html" class="btn-primary">
                            <i class="fas fa-user-plus"></i>
                            Create Account / Login
                        </a>
                    </div>
                    <div class="emergency-note">
                        <p><strong>Emergency?</strong> For urgent waterproofing emergencies, you can still call us directly at <strong>077 633 6464</strong></p>
                    </div>
                </div>
            </div>
        `;
    }

    handleProtectedElements() {
        // Handle any elements specifically marked with data-protected="true"
        const protectedElements = document.querySelectorAll('[data-protected="true"]');
        
        protectedElements.forEach(element => {
            if (!this.isLoggedIn) {
                element.style.display = 'none';
            } else {
                element.style.display = '';
            }
        });
    }

    setupMobileMenu() {
        const menuToggle = document.getElementById('menu-toggle');
        const navLinks = document.querySelector('.nav-links');
        
        if (menuToggle && navLinks) {
            // Remove existing event listeners
            const newMenuToggle = menuToggle.cloneNode(true);
            menuToggle.parentNode.replaceChild(newMenuToggle, menuToggle);
            
            // Add new event listener
            newMenuToggle.addEventListener('click', () => {
                navLinks.classList.toggle('active');
                newMenuToggle.classList.toggle('active');
            });
        }
    }

    requireLogin() {
        if (!this.isLoggedIn) {
            const currentUrl = encodeURIComponent(window.location.href);
            const pathPrefix = window.location.pathname.includes('/pages/') ? '' : 'pages/';
            const authUrl = `${pathPrefix}auth.html?redirect=${currentUrl}`;
            window.location.href = authUrl;
            return false;
        }
        return true;
    }

    redirectAfterLogin() {
        const urlParams = new URLSearchParams(window.location.search);
        const redirectUrl = urlParams.get('redirect');
        
        if (redirectUrl) {
            window.location.href = decodeURIComponent(redirectUrl);
        } else {
            // Default redirect to dashboard
            const pathPrefix = window.location.pathname.includes('/pages/') ? '' : 'pages/';
            const dashboardPage = this.getDashboardPage();
            window.location.href = `${pathPrefix}${dashboardPage}`;
        }
    }

    async logout() {
        if (confirm('Are you sure you want to logout?')) {
            try {
                // Call server logout if available
                await fetch('auth.php?action=logout', {
                    method: 'POST',
                    credentials: 'include'
                }).catch(() => {
                    // Ignore server errors and continue with client logout
                });
            } catch (error) {
                console.log('Server logout failed, continuing with client logout');
            }

            // Clear local session
            this.clearSession();
            
            // Redirect to home page
            const homeUrl = window.location.pathname.includes('/pages/') ? '../index.html' : 'index.html';
            window.location.href = homeUrl;
        }
    }

    clearSession() {
        localStorage.removeItem('currentUser');
        sessionStorage.clear();
        
        // Clear cookies
        document.cookie.split(";").forEach(function(c) { 
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
        });

        this.currentUser = null;
        this.isLoggedIn = false;
    }

    // Public method to update session after login
    updateSession(userData) {
        this.currentUser = userData;
        this.isLoggedIn = true;
        localStorage.setItem('currentUser', JSON.stringify(userData));
        this.updateNavigation();
        this.handlePageSpecificContent();
    }
}

// Initialize session manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.sessionManager = new SessionManager();
});

// Global logout function for backward compatibility
function logout() {
    if (window.sessionManager) {
        window.sessionManager.logout();
    }
}