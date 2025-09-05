// Dashboard functionality
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    loadUserData();
    setupEventListeners();
});

// Initialize dashboard
function initializeDashboard() {
    // Get user data from localStorage or session
    const currentUser = getCurrentUser();
    if (currentUser) {
        document.getElementById('userName').textContent = currentUser.firstName || 'Customer';
    }
    
    // Initialize tooltips and interactive elements
    initializeInteractiveElements();
    
    // Load recent activity
    loadRecentActivity();
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

// Load user-specific data
function loadUserData() {
    const user = getCurrentUser();
    if (!user) {
        // Redirect to login if no user found
        window.location.href = 'auth.html';
        return;
    }
    
    // Load user's projects, quotes, and appointments
    loadUserProjects();
    loadUserQuotes();
    loadUserAppointments();
    updateOverviewCards();
}

// Load user projects
function loadUserProjects() {
    // In a real application, this would fetch from your backend API
    // For now, we'll use sample data
    const sampleProjects = [
        {
            id: 1,
            title: 'Roof Waterproofing - Main House',
            startDate: '2025-01-15',
            status: 'in-progress',
            progress: 65
        },
        {
            id: 2,
            title: 'Bathroom Waterproofing',
            completedDate: '2024-12-20',
            status: 'completed',
            progress: 100
        },
        {
            id: 3,
            title: 'Foundation Sealing',
            scheduledDate: '2025-02-01',
            status: 'scheduled',
            progress: 0
        }
    ];
    
    displayProjects(sampleProjects);
}

// Display projects in the dashboard
function displayProjects(projects) {
    const projectsList = document.querySelector('.projects-list');
    if (!projectsList) return;
    
    projectsList.innerHTML = projects.map(project => `
        <div class="project-item" data-project-id="${project.id}">
            <div class="project-info">
                <h4>${project.title}</h4>
                <p>${getProjectDateText(project)}</p>
                <span class="status ${project.status}">${formatStatus(project.status)}</span>
            </div>
            <div class="project-actions">
                <button class="btn-small" onclick="viewProjectDetails(${project.id})">View Details</button>
            </div>
        </div>
    `).join('');
}

// Get project date text based on status
function getProjectDateText(project) {
    if (project.status === 'completed') {
        return `Completed: ${formatDate(project.completedDate)}`;
    } else if (project.status === 'scheduled') {
        return `Scheduled: ${formatDate(project.scheduledDate)}`;
    } else {
        return `Started: ${formatDate(project.startDate)}`;
    }
}

// Format status for display
function formatStatus(status) {
    const statusMap = {
        'in-progress': 'In Progress',
        'completed': 'Completed',
        'scheduled': 'Scheduled',
        'pending': 'Pending'
    };
    return statusMap[status] || status;
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

// Load user quotes
function loadUserQuotes() {
    const sampleQuotes = [
        {
            id: 1,
            title: 'Wall Waterproofing Quote',
            requestDate: '2025-01-10',
            status: 'pending'
        },
        {
            id: 2,
            title: 'Commercial Building Quote',
            receivedDate: '2025-01-05',
            status: 'received',
            amount: 'LKR 450,000'
        }
    ];
    
    displayQuotes(sampleQuotes);
}

// Display quotes in the dashboard
function displayQuotes(quotes) {
    const quotesList = document.querySelector('.quotes-list');
    if (!quotesList) return;
    
    quotesList.innerHTML = quotes.map(quote => `
        <div class="quote-item" data-quote-id="${quote.id}">
            <div class="quote-info">
                <h4>${quote.title}</h4>
                <p>${getQuoteDateText(quote)}</p>
                <span class="status ${quote.status}">${formatStatus(quote.status)}</span>
            </div>
            <div class="quote-actions">
                <button class="btn-small" onclick="viewQuoteDetails(${quote.id})">View Quote</button>
                ${quote.status === 'received' ? '<button class="btn-small primary" onclick="acceptQuote(' + quote.id + ')">Accept</button>' : ''}
            </div>
        </div>
    `).join('');
}

// Get quote date text based on status
function getQuoteDateText(quote) {
    if (quote.status === 'received') {
        return `Received: ${formatDate(quote.receivedDate)}`;
    } else {
        return `Requested: ${formatDate(quote.requestDate)}`;
    }
}

// Load user appointments
function loadUserAppointments() {
    const sampleAppointments = [
        {
            id: 1,
            title: 'Site Inspection',
            date: '2025-01-25',
            time: '10:00 AM - 11:00 AM',
            description: 'Main House - Roof Assessment'
        },
        {
            id: 2,
            title: 'Project Start',
            date: '2025-02-01',
            time: '8:00 AM - 5:00 PM',
            description: 'Foundation Waterproofing'
        }
    ];
    
    displayAppointments(sampleAppointments);
}

// Display appointments in the dashboard
function displayAppointments(appointments) {
    const appointmentsList = document.querySelector('.appointments-list');
    if (!appointmentsList) return;
    
    appointmentsList.innerHTML = appointments.map(appointment => `
        <div class="appointment-item" data-appointment-id="${appointment.id}">
            <div class="appointment-date">
                <div class="day">${new Date(appointment.date).getDate()}</div>
                <div class="month">${new Date(appointment.date).toLocaleDateString('en-US', { month: 'short' })}</div>
            </div>
            <div class="appointment-info">
                <h4>${appointment.title}</h4>
                <p>${appointment.time}</p>
                <p>${appointment.description}</p>
            </div>
            <div class="appointment-actions">
                <button class="btn-small" onclick="rescheduleAppointment(${appointment.id})">Reschedule</button>
            </div>
        </div>
    `).join('');
}

// Update overview cards with current data
function updateOverviewCards() {
    // This would typically fetch real data from your backend
    const stats = {
        activeProjects: 3,
        completedProjects: 7,
        upcomingAppointments: 2,
        warrantyYears: 5
    };
    
    // Update card values (if elements exist)
    updateCardValue('activeProjects', stats.activeProjects);
    updateCardValue('completedProjects', stats.completedProjects);
    updateCardValue('upcomingAppointments', stats.upcomingAppointments);
    updateCardValue('warrantyYears', stats.warrantyYears + ' Years');
}

// Update individual card value
function updateCardValue(cardType, value) {
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        const content = card.querySelector('.card-content');
        if (content && content.textContent.toLowerCase().includes(cardType.toLowerCase())) {
            const h3 = content.querySelector('h3');
            if (h3) h3.textContent = value;
        }
    });
}

// Setup event listeners
function setupEventListeners() {
    // Card hover effects
    setupCardHoverEffects();
    
    // Settings item clicks
    setupSettingsHandlers();
    
    // Logout functionality
    setupLogoutHandler();
}

// Setup card hover effects
function setupCardHoverEffects() {
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
}

// Setup settings handlers
function setupSettingsHandlers() {
    const settingItems = document.querySelectorAll('.setting-item');
    settingItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const settingType = this.textContent.trim();
            handleSettingClick(settingType);
        });
    });
}

// Handle setting item clicks
function handleSettingClick(settingType) {
    switch(settingType) {
        case 'Edit Profile':
            openEditProfile();
            break;
        case 'Notifications':
            openNotificationSettings();
            break;
        case 'Change Password':
            openChangePassword();
            break;
        case 'Documents':
            openDocuments();
            break;
        default:
            console.log('Setting clicked:', settingType);
    }
}

// Setup logout handler
function setupLogoutHandler() {
    // This is handled by the global logout function in script.js
    // But we can add dashboard-specific cleanup here if needed
}

// Initialize interactive elements
function initializeInteractiveElements() {
    // Add loading states
    addLoadingStates();
    
    // Initialize any tooltips or popovers
    initializeTooltips();
    
    // Setup smooth scrolling within dashboard
    setupSmoothScrolling();
}

// Add loading states to dynamic content
function addLoadingStates() {
    const dynamicSections = ['.projects-list', '.quotes-list', '.appointments-list'];
    
    dynamicSections.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) {
            element.classList.add('loading');
            // Remove loading class after content loads
            setTimeout(() => {
                element.classList.remove('loading');
            }, 500);
        }
    });
}

// Initialize tooltips
function initializeTooltips() {
    // Add hover tooltips for status indicators
    const statusElements = document.querySelectorAll('.status');
    statusElements.forEach(status => {
        status.title = getStatusTooltip(status.textContent);
    });
}

// Get tooltip text for status
function getStatusTooltip(statusText) {
    const tooltips = {
        'In Progress': 'Work is currently being performed on this project',
        'Completed': 'This project has been finished successfully',
        'Scheduled': 'This project is scheduled to begin soon',
        'Pending': 'Waiting for approval or additional information'
    };
    return tooltips[statusText] || statusText;
}

// Setup smooth scrolling
function setupSmoothScrolling() {
    // Smooth scroll for any internal dashboard links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Load recent activity
function loadRecentActivity() {
    // This would fetch recent user activity from your backend
    // For now, we'll simulate it
    console.log('Loading recent activity...');
}

// Action functions called by buttons
function viewProjectDetails(projectId) {
    // In a real application, this would show detailed project information
    alert(`Viewing details for project ${projectId}`);
}

function viewQuoteDetails(quoteId) {
    alert(`Viewing quote details for quote ${quoteId}`);
}

function acceptQuote(quoteId) {
    if (confirm('Are you sure you want to accept this quote?')) {
        alert(`Quote ${quoteId} accepted! We will contact you to schedule the work.`);
        // Update the UI to reflect the accepted quote
        updateQuoteStatus(quoteId, 'accepted');
    }
}

function rescheduleAppointment(appointmentId) {
    alert(`Rescheduling appointment ${appointmentId}. Please call 077 633 6464 or use our contact form.`);
}

// Update quote status in UI
function updateQuoteStatus(quoteId, newStatus) {
    const quoteItem = document.querySelector(`[data-quote-id="${quoteId}"]`);
    if (quoteItem) {
        const statusElement = quoteItem.querySelector('.status');
        if (statusElement) {
            statusElement.textContent = formatStatus(newStatus);
            statusElement.className = `status ${newStatus}`;
        }
    }
}

// Settings functions
function openEditProfile() {
    alert('Edit Profile functionality would open here');
}

function openNotificationSettings() {
    alert('Notification Settings would open here');
}

function openChangePassword() {
    alert('Change Password form would open here');
}

function openDocuments() {
    alert('Documents section would open here');
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