// Protected Dashboard functionality with backend integration
// File: js/dashboard.js

class DashboardManager {
    constructor() {
        this.currentUser = null;
        this.isLoading = true;
        this.init();
    }

    async init() {
        // Show loading screen
        this.showLoading();
        
        // Check authentication
        if (!this.checkAuthentication()) {
            this.showAccessDenied();
            return;
        }

        // Verify user type for this dashboard
        if (!this.verifyUserAccess()) {
            this.redirectToCorrectDashboard();
            return;
        }

        // Initialize dashboard
        await this.initializeDashboard();
    }

    checkAuthentication() {
        // Check session manager
        if (!window.sessionManager || !window.sessionManager.isLoggedIn) {
            return false;
        }

        this.currentUser = window.sessionManager.currentUser;
        return true;
    }

    verifyUserAccess() {
        // For user dashboard, allow individual, business, contractor types
        const allowedTypes = ['individual', 'business', 'contractor'];
        return allowedTypes.includes(this.currentUser.userType);
    }

    redirectToCorrectDashboard() {
        const dashboardUrls = {
            'admin': 'admin-dashboard.html',
            'staff': 'staff-dashboard.html'
        };

        const correctDashboard = dashboardUrls[this.currentUser.userType];
        if (correctDashboard) {
            window.location.href = correctDashboard;
        } else {
            this.showAccessDenied();
        }
    }

    async initializeDashboard() {
        try {
            // Set user name
            document.getElementById('userName').textContent = this.currentUser.firstName || 'Customer';

            // Load dashboard data
            await this.loadDashboardData();

            // Setup event listeners
            this.setupEventListeners();

            // Hide loading and show dashboard
            this.showDashboard();

        } catch (error) {
            console.error('Dashboard initialization error:', error);
            this.showError('Failed to load dashboard. Please refresh the page.');
        }
    }

    async loadDashboardData() {
        try {
            // Load data in parallel
            await Promise.all([
                this.loadOverviewStats(),
                this.loadRecentProjects(),
                this.loadQuoteRequests(),
                this.loadUpcomingAppointments()
            ]);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            // Show fallback data or error message
            this.showFallbackData();
        }
    }

    async loadOverviewStats() {
        try {
            const response = await fetch(`dashboard-api.php?action=overview&user_id=${this.currentUser.id}`, {
                method: 'GET',
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                this.updateOverviewCards(data);
            } else {
                throw new Error('Failed to load overview stats');
            }
        } catch (error) {
            console.error('Overview stats error:', error);
            // Use fallback data
            this.updateOverviewCards({
                activeProjects: 0,
                completedProjects: 0,
                upcomingAppointments: 0,
                pendingInquiries: 0
            });
        }
    }

    async loadRecentProjects() {
        try {
            const response = await fetch(`dashboard-api.php?action=projects&user_id=${this.currentUser.id}`, {
                method: 'GET',
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                this.displayProjects(data.projects || []);
            } else {
                throw new Error('Failed to load projects');
            }
        } catch (error) {
            console.error('Projects loading error:', error);
            this.displayProjects([]);
        }
    }

    async loadQuoteRequests() {
        try {
            const response = await fetch(`dashboard-api.php?action=quotes&user_id=${this.currentUser.id}`, {
                method: 'GET',
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                this.displayQuotes(data.quotes || []);
            } else {
                throw new Error('Failed to load quotes');
            }
        } catch (error) {
            console.error('Quotes loading error:', error);
            this.displayQuotes([]);
        }
    }

    async loadUpcomingAppointments() {
        try {
            const response = await fetch(`dashboard-api.php?action=appointments&user_id=${this.currentUser.id}`, {
                method: 'GET',
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                this.displayAppointments(data.appointments || []);
            } else {
                throw new Error('Failed to load appointments');
            }
        } catch (error) {
            console.error('Appointments loading error:', error);
            this.displayAppointments([]);
        }
    }

    updateOverviewCards(stats) {
        document.getElementById('activeProjectsCount').textContent = stats.activeProjects || 0;
        document.getElementById('completedProjectsCount').textContent = stats.completedProjects || 0;
        document.getElementById('upcomingAppointmentsCount').textContent = stats.upcomingAppointments || 0;
        document.getElementById('pendingInquiriesCount').textContent = stats.pendingInquiries || 0;
    }

    displayProjects(projects) {
        const projectsList = document.getElementById('projectsList');
        
        if (projects.length === 0) {
            projectsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-project-diagram"></i>
                    <h3>No Projects Yet</h3>
                    <p>You don't have any projects yet. Contact us to get started!</p>
                    <a href="contact.html" class="btn-primary">Request Quote</a>
                </div>
            `;
            return;
        }

        projectsList.innerHTML = projects.map(project => `
            <div class="project-item">
                <div class="project-info">
                    <h4>${project.project_name}</h4>
                    <p>Started: ${this.formatDate(project.start_date)}</p>
                    <span class="status ${project.status}">${this.formatStatus(project.status)}</span>
                </div>
                <div class="project-actions">
                    <button class="btn-small" onclick="viewProjectDetails(${project.id})">View Details</button>
                </div>
            </div>
        `).join('');
    }

    displayQuotes(quotes) {
        const quotesList = document.getElementById('quotesList');
        
        if (quotes.length === 0) {
            quotesList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-file-invoice-dollar"></i>
                    <h3>No Quotes Yet</h3>
                    <p>You haven't requested any quotes yet.</p>
                    <a href="contact.html" class="btn-primary">Request Quote</a>
                </div>
            `;
            return;
        }

        quotesList.innerHTML = quotes.map(quote => `
            <div class="quote-item">
                <div class="quote-info">
                    <h4>${quote.service_type} Quote</h4>
                    <p>Requested: ${this.formatDate(quote.created_at)}</p>
                    <span class="status ${quote.status}">${this.formatStatus(quote.status)}</span>
                </div>
                <div class="quote-actions">
                    <button class="btn-small" onclick="viewQuoteDetails(${quote.id})">View Quote</button>
                    ${quote.status === 'sent' ? `<button class="btn-small primary" onclick="acceptQuote(${quote.id})">Accept</button>` : ''}
                </div>
            </div>
        `).join('');
    }

    displayAppointments(appointments) {
        const appointmentsList = document.getElementById('appointmentsList');
        
        if (appointments.length === 0) {
            appointmentsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-alt"></i>
                    <h3>No Upcoming Appointments</h3>
                    <p>You don't have any scheduled appointments.</p>
                </div>
            `;
            return;
        }

        appointmentsList.innerHTML = appointments.map(appointment => `
            <div class="appointment-item">
                <div class="appointment-date">
                    <div class="day">${new Date(appointment.appointment_date).getDate()}</div>
                    <div class="month">${new Date(appointment.appointment_date).toLocaleDateString('en-US', { month: 'short' })}</div>
                </div>
                <div class="appointment-info">
                    <h4>${appointment.appointment_type}</h4>
                    <p>${this.formatTime(appointment.appointment_date)}</p>
                    <p>${appointment.description}</p>
                </div>
                <div class="appointment-actions">
                    <button class="btn-small" onclick="rescheduleAppointment(${appointment.id})">Reschedule</button>
                </div>
            </div>
        `).join('');
    }

    showFallbackData() {
        // Show empty states for all sections
        this.updateOverviewCards({
            activeProjects: 0,
            completedProjects: 0,
            upcomingAppointments: 0,
            pendingInquiries: 0
        });
        
        this.displayProjects([]);
        this.displayQuotes([]);
        this.displayAppointments([]);
    }

    setupEventListeners() {
        // Add any dashboard-specific event listeners
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('card')) {
                this.handleCardClick(e.target);
            }
        });
    }

    handleCardClick(card) {
        // Add animation or navigation based on card clicked
        card.style.transform = 'scale(0.98)';
        setTimeout(() => {
            card.style.transform = '';
        }, 150);
    }

    showLoading() {
        document.getElementById('loading-screen').style.display = 'flex';
        document.getElementById('dashboard-content').style.display = 'none';
        document.getElementById('access-denied').style.display = 'none';
    }

    showAccessDenied() {
        document.getElementById('loading-screen').style.display = 'none';
        document.getElementById('dashboard-content').style.display = 'none';
        document.getElementById('access-denied').style.display = 'flex';
    }

    showDashboard() {
        document.getElementById('loading-screen').style.display = 'none';
        document.getElementById('access-denied').style.display = 'none';
        document.getElementById('dashboard-content').style.display = 'block';
    }

    showError(message) {
        // Show error notification
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-notification';
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">×</button>
        `;
        document.body.appendChild(errorDiv);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    }

    // Utility functions
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }

    formatTime(dateTimeString) {
        if (!dateTimeString) return 'N/A';
        const date = new Date(dateTimeString);
        return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    formatStatus(status) {
        const statusMap = {
            'planning': 'Planning',
            'scheduled': 'Scheduled',
            'in_progress': 'In Progress',
            'completed': 'Completed',
            'on_hold': 'On Hold',
            'draft': 'Draft',
            'sent': 'Sent',
            'viewed': 'Viewed',
            'accepted': 'Accepted',
            'rejected': 'Rejected'
        };
        return statusMap[status] || status;
    }
}

// Action functions called by buttons
async function viewProjectDetails(projectId) {
    try {
        const response = await fetch(`dashboard-api.php?action=project-details&project_id=${projectId}`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            showProjectModal(data.project);
        } else {
            alert('Unable to load project details. Please try again.');
        }
    } catch (error) {
        console.error('Error loading project details:', error);
        alert('Unable to load project details. Please try again.');
    }
}

async function viewQuoteDetails(quoteId) {
    try {
        const response = await fetch(`dashboard-api.php?action=quote-details&quote_id=${quoteId}`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            showQuoteModal(data.quote);
        } else {
            alert('Unable to load quote details. Please try again.');
        }
    } catch (error) {
        console.error('Error loading quote details:', error);
        alert('Unable to load quote details. Please try again.');
    }
}

async function acceptQuote(quoteId) {
    if (!confirm('Are you sure you want to accept this quote?')) {
        return;
    }

    try {
        const response = await fetch(`dashboard-api.php?action=accept-quote&quote_id=${quoteId}`, {
            method: 'POST',
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                alert('Quote accepted successfully! We will contact you to schedule the work.');
                location.reload(); // Refresh to show updated data
            } else {
                alert(data.error || 'Failed to accept quote.');
            }
        } else {
            alert('Unable to accept quote. Please try again.');
        }
    } catch (error) {
        console.error('Error accepting quote:', error);
        alert('Unable to accept quote. Please try again.');
    }
}

function rescheduleAppointment(appointmentId) {
    alert('Please call us at 077 633 6464 to reschedule your appointment, or send us a message through the contact form.');
}

// Settings functions
function openEditProfile() {
    // Create a simple profile edit modal
    showProfileEditModal();
}

function openNotificationSettings() {
    alert('Notification settings feature coming soon!');
}

function openChangePassword() {
    // Create password change modal
    showPasswordChangeModal();
}

function openDocuments() {
    alert('Documents section feature coming soon!');
}

// Modal functions (simplified versions)
function showProjectModal(project) {
    // Create and show project details modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${project.project_name}</h3>
                <button onclick="this.closest('.modal-overlay').remove()">×</button>
            </div>
            <div class="modal-body">
                <p><strong>Type:</strong> ${project.project_type}</p>
                <p><strong>Location:</strong> ${project.location}</p>
                <p><strong>Status:</strong> ${project.status}</p>
                <p><strong>Progress:</strong> ${project.progress_percentage}%</p>
                <p><strong>Description:</strong> ${project.description || 'N/A'}</p>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function showQuoteModal(quote) {
    // Create and show quote details modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Quote #${quote.quote_number}</h3>
                <button onclick="this.closest('.modal-overlay').remove()">×</button>
            </div>
            <div class="modal-body">
                <p><strong>Service:</strong> ${quote.service_type}</p>
                <p><strong>Amount:</strong> LKR ${quote.total_amount}</p>
                <p><strong>Status:</strong> ${quote.status}</p>
                <p><strong>Valid Until:</strong> ${new Date(quote.valid_until).toLocaleDateString()}</p>
                <p><strong>Description:</strong> ${quote.description || 'N/A'}</p>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function showProfileEditModal() {
    alert('Profile editing feature coming soon! Please contact us to update your information.');
}

function showPasswordChangeModal() {
    alert('Password change feature coming soon! Please use the forgot password option on the login page.');
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Wait for session manager to initialize
    setTimeout(() => {
        window.dashboardManager = new DashboardManager();
    }, 100);
});