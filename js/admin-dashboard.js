// Protected Admin Dashboard functionality with backend integration
// File: js/admin-dashboard.js

class AdminDashboardManager {
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

        // Verify admin access
        if (!this.verifyAdminAccess()) {
            this.redirectToCorrectDashboard();
            return;
        }

        // Initialize dashboard
        await this.initializeAdminDashboard();
    }

    checkAuthentication() {
        // Check session manager
        if (!window.sessionManager || !window.sessionManager.isLoggedIn) {
            return false;
        }

        this.currentUser = window.sessionManager.currentUser;
        return true;
    }

    verifyAdminAccess() {
        // Only allow admin user type
        return this.currentUser.userType === 'admin';
    }

    redirectToCorrectDashboard() {
        const dashboardUrls = {
            'staff': 'staff-dashboard.html',
            'individual': 'user-dashboard.html',
            'business': 'user-dashboard.html',
            'contractor': 'user-dashboard.html'
        };

        const correctDashboard = dashboardUrls[this.currentUser.userType];
        if (correctDashboard) {
            window.location.href = correctDashboard;
        } else {
            this.showAccessDenied();
        }
    }

    async initializeAdminDashboard() {
        try {
            // Load dashboard data
            await this.loadDashboardData();

            // Setup event listeners
            this.setupEventListeners();

            // Setup real-time updates
            this.setupRealTimeUpdates();

            // Hide loading and show dashboard
            this.showDashboard();

        } catch (error) {
            console.error('Admin dashboard initialization error:', error);
            this.showError('Failed to load dashboard. Please refresh the page.');
        }
    }

    async loadDashboardData() {
        try {
            // Load data in parallel
            await Promise.all([
                this.loadOverviewStats(),
                this.loadRecentInquiries(),
                this.loadActiveProjects(),
                this.loadTeamStatus(),
                this.loadRevenueData()
            ]);
        } catch (error) {
            console.error('Error loading admin dashboard data:', error);
            this.showFallbackData();
        }
    }

    async loadOverviewStats() {
        try {
            const response = await fetch(`admin-api.php?action=overview`, {
                method: 'GET',
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                this.updateStatCards(data);
            } else {
                throw new Error('Failed to load overview stats');
            }
        } catch (error) {
            console.error('Overview stats error:', error);
            this.updateStatCards({
                totalCustomers: 0,
                activeProjects: 0,
                newInquiries: 0,
                monthlyRevenue: 'LKR 0'
            });
        }
    }

    async loadRecentInquiries() {
        try {
            const response = await fetch(`admin-api.php?action=inquiries`, {
                method: 'GET',
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                this.displayInquiries(data.inquiries || []);
            } else {
                throw new Error('Failed to load inquiries');
            }
        } catch (error) {
            console.error('Inquiries loading error:', error);
            this.displayInquiries([]);
        }
    }

    async loadActiveProjects() {
        try {
            const response = await fetch(`admin-api.php?action=projects`, {
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

    async loadTeamStatus() {
        try {
            const response = await fetch(`admin-api.php?action=team-status`, {
                method: 'GET',
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                this.displayTeamStatus(data.team_members || []);
            } else {
                throw new Error('Failed to load team status');
            }
        } catch (error) {
            console.error('Team status loading error:', error);
            this.displayTeamStatus([]);
        }
    }

    async loadRevenueData() {
        try {
            const response = await fetch(`admin-api.php?action=revenue`, {
                method: 'GET',
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                this.updateRevenueChart(data.revenue_data || []);
            } else {
                throw new Error('Failed to load revenue data');
            }
        } catch (error) {
            console.error('Revenue data loading error:', error);
            this.updateRevenueChart([]);
        }
    }

    updateStatCards(stats) {
        const statCards = document.querySelectorAll('.stat-card');
        const values = [
            stats.totalCustomers,
            stats.activeProjects,
            stats.newInquiries,
            stats.monthlyRevenue
        ];

        statCards.forEach((card, index) => {
            const h3 = card.querySelector('h3');
            if (h3 && values[index] !== undefined) {
                h3.textContent = values[index];
            }
        });
    }

    displayInquiries(inquiries) {
        const inquiriesTable = document.querySelector('.inquiries-table');
        if (!inquiriesTable) return;

        // Clear existing rows (keep header)
        const existingRows = inquiriesTable.querySelectorAll('.table-row');
        existingRows.forEach(row => row.remove());

        if (inquiries.length === 0) {
            const emptyRow = document.createElement('div');
            emptyRow.className = 'table-row';
            emptyRow.innerHTML = `
                <div colspan="5" class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <h3>No Recent Inquiries</h3>
                    <p>No new customer inquiries to display.</p>
                </div>
            `;
            inquiriesTable.appendChild(emptyRow);
            return;
        }

        // Add new rows
        inquiries.forEach(inquiry => {
            const row = this.createInquiryRow(inquiry);
            inquiriesTable.appendChild(row);
        });
    }

    createInquiryRow(inquiry) {
        const row = document.createElement('div');
        row.className = 'table-row';
        row.innerHTML = `
            <div>${inquiry.name}</div>
            <div>${inquiry.service_type || 'General Inquiry'}</div>
            <div>${this.formatDate(inquiry.created_at)}</div>
            <div><span class="status ${inquiry.status}">${this.formatStatus(inquiry.status)}</span></div>
            <div>
                <button class="btn-small" onclick="adminDashboard.viewInquiry(${inquiry.id})">View</button>
                <button class="btn-small primary" onclick="adminDashboard.respondToInquiry(${inquiry.id})">Respond</button>
            </div>
        `;
        return row;
    }

    displayProjects(projects) {
        const projectsTable = document.querySelector('.projects-table');
        if (!projectsTable) return;

        // Clear existing rows (keep header)
        const existingRows = projectsTable.querySelectorAll('.table-row');
        existingRows.forEach(row => row.remove());

        if (projects.length === 0) {
            const emptyRow = document.createElement('div');
            emptyRow.className = 'table-row';
            emptyRow.innerHTML = `
                <div colspan="6" class="empty-state">
                    <i class="fas fa-project-diagram"></i>
                    <h3>No Active Projects</h3>
                    <p>No active projects to display.</p>
                </div>
            `;
            projectsTable.appendChild(emptyRow);
            return;
        }

        // Add new rows
        projects.forEach(project => {
            const row = this.createProjectRow(project);
            projectsTable.appendChild(row);
        });
    }

    createProjectRow(project) {
        const row = document.createElement('div');
        row.className = 'table-row';
        row.innerHTML = `
            <div>${project.project_name}</div>
            <div>${project.customer_name}</div>
            <div>${project.team_name || 'Unassigned'}</div>
            <div>
                <div class="progress-bar">
                    <div class="progress" style="width: ${project.progress_percentage}%"></div>
                </div>
                <span>${project.progress_percentage}%</span>
            </div>
            <div>${this.formatDate(project.estimated_completion)}</div>
            <div>
                <button class="btn-small" onclick="adminDashboard.viewProject(${project.id})">View</button>
                <button class="btn-small" onclick="adminDashboard.updateProject(${project.id})">Update</button>
            </div>
        `;
        return row;
    }

    displayTeamStatus(teamMembers) {
        const teamGrid = document.querySelector('.team-grid');
        if (!teamGrid) return;

        if (teamMembers.length === 0) {
            teamGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users"></i>
                    <h3>No Team Members</h3>
                    <p>No active team members found.</p>
                </div>
            `;
            return;
        }

        teamGrid.innerHTML = teamMembers.map(member => `
            <div class="team-card">
                <div class="team-member">
                    <i class="fas fa-user-hard-hat"></i>
                    <h4>${member.first_name} ${member.last_name}</h4>
                    <p>${member.role || 'Team Member'}</p>
                    <p class="team-name">${member.team_name || 'No Team'}</p>
                    <span class="status ${member.status}">${this.formatStatus(member.status)}</span>
                </div>
            </div>
        `).join('');
    }

    updateRevenueChart(revenueData) {
        const chartBars = document.querySelectorAll('.chart-bar');
        
        if (revenueData.length === 0) {
            chartBars.forEach(bar => {
                bar.style.height = '10%';
                const span = bar.querySelector('span');
                if (span) span.textContent = 'No Data';
            });
            return;
        }

        chartBars.forEach((bar, index) => {
            if (revenueData[index]) {
                bar.style.height = Math.max(revenueData[index].percentage, 5) + '%';
                const span = bar.querySelector('span');
                if (span) span.textContent = revenueData[index].month;
                bar.title = `${revenueData[index].month}: LKR ${revenueData[index].revenue.toLocaleString()}`;
            } else {
                bar.style.height = '5%';
                const span = bar.querySelector('span');
                if (span) span.textContent = '';
            }
        });
    }

    setupEventListeners() {
        this.setupQuickActions();
        this.setupTableInteractions();
        this.setupSystemManagement();
        this.setupKeyboardShortcuts();
    }

    setupQuickActions() {
        const actionCards = document.querySelectorAll('.action-card');
        actionCards.forEach(card => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                const actionText = card.textContent.trim();
                this.handleQuickAction(actionText);
            });
        });
    }

    setupTableInteractions() {
        const tableRows = document.querySelectorAll('.table-row');
        tableRows.forEach(row => {
            row.addEventListener('mouseenter', function() {
                this.style.backgroundColor = '#f8f9fa';
            });
            
            row.addEventListener('mouseleave', function() {
                this.style.backgroundColor = '';
            });
        });
    }

    setupSystemManagement() {
        const systemCards = document.querySelectorAll('.system-card');
        systemCards.forEach(card => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                const systemText = card.textContent.trim();
                this.handleSystemAction(systemText);
            });
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 'n':
                        e.preventDefault();
                        this.openNewProjectForm();
                        break;
                    case 'u':
                        e.preventDefault();
                        this.openUserManagement();
                        break;
                    case 'r':
                        e.preventDefault();
                        this.openReports();
                        break;
                }
            }
        });
    }

    setupRealTimeUpdates() {
        // Refresh dashboard data every 30 seconds
        setInterval(() => {
            this.refreshDashboardData();
        }, 30000);
    }

    async refreshDashboardData() {
        try {
            await this.loadOverviewStats();
            await this.loadRecentInquiries();
        } catch (error) {
            console.error('Error refreshing dashboard data:', error);
        }
    }

    handleQuickAction(actionText) {
        switch(actionText) {
            case 'Add New Project':
                this.openNewProjectForm();
                break;
            case 'Add Customer':
                this.openNewCustomerForm();
                break;
            case 'Schedule Appointment':
                this.openAppointmentScheduler();
                break;
            case 'Generate Quote':
                this.openQuoteGenerator();
                break;
            default:
                console.log('Quick action:', actionText);
        }
    }

    handleSystemAction(actionText) {
        switch(actionText) {
            case 'User Management':
                this.openUserManagement();
                break;
            case 'Reports':
                this.openReports();
                break;
            case 'Settings':
                this.openSystemSettings();
                break;
            case 'Backup':
                this.initiateBackup();
                break;
            default:
                console.log('System action:', actionText);
        }
    }

    async viewInquiry(inquiryId) {
        try {
            // This would typically show a modal with inquiry details
            const inquiry = await this.getInquiryDetails(inquiryId);
            this.showInquiryModal(inquiry);
        } catch (error) {
            console.error('Error viewing inquiry:', error);
            alert('Unable to load inquiry details.');
        }
    }

    async respondToInquiry(inquiryId) {
        const response = prompt('Enter your response to this inquiry:');
        if (!response) return;

        try {
            const formData = new FormData();
            formData.append('inquiry_id', inquiryId);
            formData.append('status', 'contacted');
            formData.append('response', response);

            const result = await fetch('admin-api.php?action=assign-inquiry', {
                method: 'POST',
                credentials: 'include',
                body: formData
            });

            const data = await result.json();
            
            if (data.success) {
                alert('Response sent successfully!');
                await this.loadRecentInquiries();
            } else {
                alert(data.error || 'Failed to send response');
            }
        } catch (error) {
            console.error('Error responding to inquiry:', error);
            this.showError('Failed to send response');
        }
    }

    async viewProject(projectId) {
        try {
            // This would show project details in a modal
            alert(`Project details for project ${projectId} would be shown here`);
        } catch (error) {
            console.error('Error viewing project:', error);
            alert('Unable to load project details.');
        }
    }

    async updateProject(projectId) {
        const newStatus = prompt('Update project status (planning/scheduled/in_progress/completed):');
        if (!newStatus) return;

        try {
            const formData = new FormData();
            formData.append('project_id', projectId);
            formData.append('status', newStatus);

            const response = await fetch('admin-api.php?action=update-project', {
                method: 'POST',
                credentials: 'include',
                body: formData
            });

            const data = await response.json();
            
            if (data.success) {
                alert('Project updated successfully!');
                await this.loadActiveProjects();
            } else {
                alert(data.error || 'Failed to update project');
            }
        } catch (error) {
            console.error('Error updating project:', error);
            this.showError('Failed to update project');
        }
    }

    showFallbackData() {
        this.updateStatCards({
            totalCustomers: 0,
            activeProjects: 0,
            newInquiries: 0,
            monthlyRevenue: 'LKR 0'
        });
        
        this.displayInquiries([]);
        this.displayProjects([]);
        this.displayTeamStatus([]);
        this.updateRevenueChart([]);
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
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-notification';
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">×</button>
        `;
        document.body.appendChild(errorDiv);

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

    formatStatus(status) {
        const statusMap = {
            'new': 'New',
            'contacted': 'Contacted',
            'quoted': 'Quoted',
            'converted': 'Converted',
            'planning': 'Planning',
            'scheduled': 'Scheduled',
            'in_progress': 'In Progress',
            'completed': 'Completed',
            'available': 'Available',
            'on-site': 'On Site',
            'on-leave': 'On Leave'
        };
        return statusMap[status] || status;
    }

    // Quick action implementations
    openNewProjectForm() {
        alert('New Project form would open here');
    }

    openNewCustomerForm() {
        alert('New Customer form would open here');
    }

    openAppointmentScheduler() {
        alert('Appointment Scheduler would open here');
    }

    openQuoteGenerator() {
        alert('Quote Generator would open here');
    }

    openUserManagement() {
        alert('User Management system would open here');
    }

    openReports() {
        alert('Reports system would open here');
    }

    openSystemSettings() {
        alert('System Settings would open here');
    }

    initiateBackup() {
        if (confirm('Are you sure you want to initiate a system backup?')) {
            alert('Backup process initiated...');
        }
    }
}

// Initialize admin dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Wait for session manager to initialize
    setTimeout(() => {
        window.adminDashboard = new AdminDashboardManager();
    }, 100);
});

// Global logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        // Clear user data
        localStorage.removeItem('currentUser');
        sessionStorage.clear();
        
        // Redirect to login
        window.location.href = 'auth.html';
    }
}