// Admin Dashboard functionality
document.addEventListener('DOMContentLoaded', function() {
    initializeAdminDashboard();
    loadAdminData();
    setupAdminEventListeners();
});

// Initialize admin dashboard
function initializeAdminDashboard() {
    // Verify admin access
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.userType !== 'admin') {
        alert('Access denied. Admin privileges required.');
        window.location.href = 'auth.html';
        return;
    }
    
    // Initialize admin components
    initializeAdminComponents();
    setupRealTimeUpdates();
}

// Get current user from storage
function getCurrentUser() {
    try {
        const user = localStorage.getItem('currentUser');
        return user ? JSON.parse(user) : null;
    } catch (error) {
        console.error('Error loading user data:', error);
        return null;
    }
}

// Load admin-specific data
function loadAdminData() {
    loadDashboardStats();
    loadRecentInquiries();
    loadActiveProjects();
    loadTeamStatus();
    loadRevenueData();
}

// Load dashboard statistics
function loadDashboardStats() {
    // In a real application, this would fetch from your backend API
    const stats = {
        totalCustomers: 45,
        activeProjects: 23,
        newInquiries: 12,
        monthlyRevenue: 'LKR 2.5M'
    };
    
    updateStatCards(stats);
}

// Update stat cards with current data
function updateStatCards(stats) {
    const statCards = document.querySelectorAll('.stat-card');
    const statValues = [stats.totalCustomers, stats.activeProjects, stats.newInquiries, stats.monthlyRevenue];
    
    statCards.forEach((card, index) => {
        const h3 = card.querySelector('h3');
        if (h3 && statValues[index] !== undefined) {
            h3.textContent = statValues[index];
        }
    });
}

// Load recent inquiries
function loadRecentInquiries() {
    const sampleInquiries = [
        {
            id: 1,
            customer: 'John Silva',
            service: 'Roof Waterproofing',
            date: '2025-01-20',
            status: 'new'
        },
        {
            id: 2,
            customer: 'Maria Fernando',
            service: 'Foundation Sealing',
            date: '2025-01-19',
            status: 'responded'
        },
        {
            id: 3,
            customer: 'David Perera',
            service: 'Commercial Building',
            date: '2025-01-18',
            status: 'quoted'
        }
    ];
    
    displayInquiries(sampleInquiries);
}

// Display inquiries in the table
function displayInquiries(inquiries) {
    const inquiriesTable = document.querySelector('.inquiries-table');
    if (!inquiriesTable) return;
    
    // Clear existing rows (keep header)
    const existingRows = inquiriesTable.querySelectorAll('.table-row');
    existingRows.forEach(row => row.remove());
    
    // Add new rows
    inquiries.forEach(inquiry => {
        const row = createInquiryRow(inquiry);
        inquiriesTable.appendChild(row);
    });
}

// Create inquiry table row
function createInquiryRow(inquiry) {
    const row = document.createElement('div');
    row.className = 'table-row';
    row.innerHTML = `
        <div>${inquiry.customer}</div>
        <div>${inquiry.service}</div>
        <div>${formatDate(inquiry.date)}</div>
        <div><span class="status ${inquiry.status}">${formatStatus(inquiry.status)}</span></div>
        <div>
            <button class="btn-small" onclick="viewInquiry(${inquiry.id})">View</button>
            <button class="btn-small primary" onclick="respondToInquiry(${inquiry.id})">Respond</button>
        </div>
    `;
    return row;
}

// Load active projects
function loadActiveProjects() {
    const sampleProjects = [
        {
            id: 1,
            name: 'Villa Roof Waterproofing',
            customer: 'K. Rathnayake',
            team: 'Team A',
            progress: 65,
            deadline: '2025-01-30'
        },
        {
            id: 2,
            name: 'Office Building Foundation',
            customer: 'ABC Company',
            team: 'Team B',
            progress: 30,
            deadline: '2025-02-15'
        }
    ];
    
    displayProjects(sampleProjects);
}

// Display projects in the table
function displayProjects(projects) {
    const projectsTable = document.querySelector('.projects-table');
    if (!projectsTable) return;
    
    // Clear existing rows (keep header)
    const existingRows = projectsTable.querySelectorAll('.table-row');
    existingRows.forEach(row => row.remove());
    
    // Add new rows
    projects.forEach(project => {
        const row = createProjectRow(project);
        projectsTable.appendChild(row);
    });
}

// Create project table row
function createProjectRow(project) {
    const row = document.createElement('div');
    row.className = 'table-row';
    row.innerHTML = `
        <div>${project.name}</div>
        <div>${project.customer}</div>
        <div>${project.team}</div>
        <div>
            <div class="progress-bar">
                <div class="progress" style="width: ${project.progress}%"></div>
            </div>
            <span>${project.progress}%</span>
        </div>
        <div>${formatDate(project.deadline)}</div>
        <div>
            <button class="btn-small" onclick="viewProject(${project.id})">View</button>
            <button class="btn-small" onclick="updateProject(${project.id})">Update</button>
        </div>
    `;
    return row;
}

// Load team status
function loadTeamStatus() {
    const teamMembers = [
        { name: 'Sunil Bandara', role: 'Team Leader', status: 'available' },
        { name: 'Priya Jayawardena', role: 'Senior Technician', status: 'on-site' },
        { name: 'Ravi Kumara', role: 'Technician', status: 'available' },
        { name: 'Nimal Silva', role: 'Technician', status: 'on-leave' }
    ];
    
    displayTeamStatus(teamMembers);
}

// Display team status
function displayTeamStatus(teamMembers) {
    const teamGrid = document.querySelector('.team-grid');
    if (!teamGrid) return;
    
    teamGrid.innerHTML = teamMembers.map(member => `
        <div class="team-card">
            <div class="team-member">
                <i class="fas fa-user-hard-hat"></i>
                <h4>${member.name}</h4>
                <p>${member.role}</p>
                <span class="status ${member.status}">${formatStatus(member.status)}</span>
            </div>
        </div>
    `).join('');
}

// Load revenue data
function loadRevenueData() {
    // Sample revenue data for chart
    const revenueData = [60, 80, 45, 90, 70, 85]; // percentages for chart bars
    
    updateRevenueChart(revenueData);
}

// Update revenue chart
function updateRevenueChart(data) {
    const chartBars = document.querySelectorAll('.chart-bar');
    chartBars.forEach((bar, index) => {
        if (data[index] !== undefined) {
            bar.style.height = data[index] + '%';
        }
    });
}

// Setup admin event listeners
function setupAdminEventListeners() {
    setupQuickActions();
    setupTableInteractions();
    setupSystemManagement();
    setupRealTimeFeatures();
}

// Setup quick actions
function setupQuickActions() {
    const actionCards = document.querySelectorAll('.action-card');
    actionCards.forEach(card => {
        card.addEventListener('click', function(e) {
            e.preventDefault();
            const actionText = this.textContent.trim();
            handleQuickAction(actionText);
        });
    });
}

// Handle quick action clicks
function handleQuickAction(actionText) {
    switch(actionText) {
        case 'Add New Project':
            openNewProjectForm();
            break;
        case 'Add Customer':
            openNewCustomerForm();
            break;
        case 'Schedule Appointment':
            openAppointmentScheduler();
            break;
        case 'Generate Quote':
            openQuoteGenerator();
            break;
        default:
            console.log('Quick action:', actionText);
    }
}

// Setup table interactions
function setupTableInteractions() {
    // Add hover effects to table rows
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

// Setup system management
function setupSystemManagement() {
    const systemCards = document.querySelectorAll('.system-card');
    systemCards.forEach(card => {
        card.addEventListener('click', function(e) {
            e.preventDefault();
            const systemText = this.textContent.trim();
            handleSystemAction(systemText);
        });
    });
}

// Handle system management actions
function handleSystemAction(actionText) {
    switch(actionText) {
        case 'User Management':
            openUserManagement();
            break;
        case 'Reports':
            openReports();
            break;
        case 'Settings':
            openSystemSettings();
            break;
        case 'Backup':
            initiateBackup();
            break;
        default:
            console.log('System action:', actionText);
    }
}

// Setup real-time features
function setupRealTimeFeatures() {
    // Setup periodic data refresh
    setInterval(refreshDashboardData, 30000); // Refresh every 30 seconds
    
    // Setup notification system
    initializeNotifications();
}

// Initialize admin components
function initializeAdminComponents() {
    // Initialize date pickers, charts, etc.
    initializeCharts();
    initializeFilters();
    setupKeyboardShortcuts();
}

// Initialize charts
function initializeCharts() {
    // Initialize any chart libraries here
    console.log('Initializing charts...');
}

// Initialize filters
function initializeFilters() {
    // Add filtering capabilities to tables
    addTableFilters();
}

// Add table filters
function addTableFilters() {
    // This would add search/filter functionality to tables
    console.log('Adding table filters...');
}

// Setup keyboard shortcuts for admin
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Ctrl+N for new project
        if (e.ctrlKey && e.key === 'n') {
            e.preventDefault();
            openNewProjectForm();
        }
        
        // Ctrl+U for user management
        if (e.ctrlKey && e.key === 'u') {
            e.preventDefault();
            openUserManagement();
        }
        
        // Ctrl+R for reports
        if (e.ctrlKey && e.key === 'r') {
            e.preventDefault();
            openReports();
        }
    });
}

// Setup real-time updates
function setupRealTimeUpdates() {
    // In a real application, this would setup WebSocket connections
    // or periodic polling for real-time data updates
    console.log('Setting up real-time updates...');
}

// Refresh dashboard data
function refreshDashboardData() {
    loadDashboardStats();
    loadRecentInquiries();
    loadActiveProjects();
    loadTeamStatus();
}

// Initialize notifications
function initializeNotifications() {
    // Check for new notifications
    checkNewNotifications();
}

// Check for new notifications
function checkNewNotifications() {
    // This would check for new inquiries, urgent projects, etc.
    console.log('Checking for new notifications...');
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

function formatStatus(status) {
    const statusMap = {
        'new': 'New',
        'responded': 'Responded',
        'quoted': 'Quoted',
        'available': 'Available',
        'on-site': 'On Site',
        'on-leave': 'On Leave'
    };
    return statusMap[status] || status;
}

// Action functions called by buttons
function viewInquiry(inquiryId) {
    alert(`Viewing inquiry ${inquiryId}`);
}

function respondToInquiry(inquiryId) {
    alert(`Opening response form for inquiry ${inquiryId}`);
}

function viewProject(projectId) {
    alert(`Viewing project details for project ${projectId}`);
}

function updateProject(projectId) {
    alert(`Opening update form for project ${projectId}`);
}

// Quick action functions
function openNewProjectForm() {
    alert('New Project form would open here');
}

function openNewCustomerForm() {
    alert('New Customer form would open here');
}

function openAppointmentScheduler() {
    alert('Appointment Scheduler would open here');
}

function openQuoteGenerator() {
    alert('Quote Generator would open here');
}

// System management functions
function openUserManagement() {
    alert('User Management system would open here');
}

function openReports() {
    alert('Reports system would open here');
}

function openSystemSettings() {
    alert('System Settings would open here');
}

function initiateBackup() {
    if (confirm('Are you sure you want to initiate a system backup?')) {
        alert('Backup process initiated...');
    }
}

// Logout function (global)
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        // Clear user data
        localStorage.removeItem('currentUser');
        sessionStorage.clear();
        
        // Redirect to login
        window.location.href = 'auth.html';
    }
}