// Global variables
let currentAdmin = null;
let allBookings = [];
let allUsers = [];
let allQuotes = [];
let allReviews = [];
let currentBookingId = null;

// Initialize admin dashboard
document.addEventListener('DOMContentLoaded', function () {
    // Initialize with mock data for demo
    initializeMockData();
    loadAdminData();
    initializeEventListeners();
    loadDashboardData();
    updateLastUpdateTime();
    
    console.log('SealTech Admin Dashboard initialized successfully');
});

// Initialize mock data for demonstration
function initializeMockData() {
    // Create mock admin user
    currentAdmin = {
        id: 1,
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@sealtechengineering.com',
        userType: 'admin',
        password: 'admin123'
    };

    // Create mock bookings
    allBookings = [
        {
            id: 'BK001',
            userId: 101,
            userName: 'John Silva',
            userEmail: 'john@example.com',
            contactPhone: '077-123-4567',
            serviceType: 'roof',
            projectLocation: 'Colombo 7',
            propertyType: 'residential',
            projectArea: '150',
            budgetRange: '100k-500k',
            problemDescription: 'Roof leaking during rainy season',
            inspectionDate: '2024-01-20',
            timeSlot: 'morning',
            status: 'pending',
            urgency: 'normal',
            submissionDate: '2024-01-15T10:30:00Z',
            specialInstructions: 'Please call before arriving'
        },
        {
            id: 'BK002',
            userId: 102,
            userName: 'Maria Fernando',
            userEmail: 'maria@example.com',
            contactPhone: '070-987-6543',
            serviceType: 'bathroom',
            projectLocation: 'Negombo',
            propertyType: 'residential',
            projectArea: '50',
            budgetRange: 'under-100k',
            problemDescription: 'Bathroom tiles leaking',
            inspectionDate: '2024-01-22',
            timeSlot: 'afternoon',
            status: 'confirmed',
            urgency: 'normal',
            submissionDate: '2024-01-16T14:20:00Z'
        },
        {
            id: 'BK003',
            userId: 103,
            userName: 'David Perera',
            userEmail: 'david@example.com',
            contactPhone: '076-555-1234',
            serviceType: 'foundation',
            projectLocation: 'Kandy',
            propertyType: 'commercial',
            projectArea: '300',
            budgetRange: '500k-1m',
            problemDescription: 'Foundation water seepage',
            inspectionDate: '2024-01-25',
            timeSlot: 'morning',
            status: 'completed',
            urgency: 'emergency',
            submissionDate: '2024-01-12T09:15:00Z'
        }
    ];

    // Create mock users
    allUsers = [
        {
            id: 101,
            firstName: 'John',
            lastName: 'Silva',
            email: 'john@example.com',
            phone: '077-123-4567',
            userType: 'individual',
            createdAt: '2024-01-10T08:00:00Z'
        },
        {
            id: 102,
            firstName: 'Maria',
            lastName: 'Fernando',
            email: 'maria@example.com',
            phone: '070-987-6543',
            userType: 'individual',
            createdAt: '2024-01-12T10:30:00Z'
        },
        {
            id: 103,
            firstName: 'David',
            lastName: 'Perera',
            email: 'david@example.com',
            phone: '076-555-1234',
            userType: 'business',
            createdAt: '2024-01-08T15:45:00Z'
        }
    ];

    // Create mock quotes
    allQuotes = [
        {
            id: 'QT001',
            userId: 101,
            userName: 'John Silva',
            serviceType: 'roof',
            location: 'Colombo 7',
            description: 'Roof waterproofing for 150 sq ft residential property',
            status: 'pending',
            createdAt: '2024-01-18T11:00:00Z'
        },
        {
            id: 'QT002',
            userId: 104,
            userName: 'Sarah Jones',
            serviceType: 'wall',
            location: 'Galle',
            description: 'External wall waterproofing',
            status: 'quoted',
            amount: 85000,
            validity: 30,
            createdAt: '2024-01-14T16:30:00Z',
            quotedAt: '2024-01-15T09:00:00Z'
        }
    ];

    // Create mock reviews
    allReviews = [
        {
            id: 'RV001',
            userId: 103,
            userName: 'David Perera',
            serviceType: 'foundation',
            rating: 5,
            comment: 'Excellent service! Very professional team and quality work.',
            date: '2024-01-20T14:00:00Z'
        },
        {
            id: 'RV002',
            userId: 105,
            userName: 'Lisa Wong',
            serviceType: 'bathroom',
            rating: 4,
            comment: 'Good work, completed on time.',
            date: '2024-01-19T16:30:00Z'
        }
    ];
}

// Load admin data
function loadAdminData() {
    // Update admin info in navigation
    if (currentAdmin) {
        document.getElementById('adminName').textContent = `${currentAdmin.firstName} ${currentAdmin.lastName}`;
        document.getElementById('adminRole').textContent = currentAdmin.userType === 'admin' ? 'Administrator' : 'Staff Member';
    }
}

// Load all dashboard data
function loadDashboardData() {
    updateDashboardStats();
    loadRecentBookings();
    loadPendingActions();
    updateQuickStats();
    updateNotificationCount();
    updateBadges();
}

// Update dashboard statistics
function updateDashboardStats() {
    const totalBookings = allBookings.length;
    const totalCustomers = allUsers.length;
    const pendingActions = allBookings.filter(b => b.status === 'pending').length +
        allQuotes.filter(q => q.status === 'pending').length;

    // Calculate estimated revenue
    let totalRevenue = 0;
    allBookings.filter(b => b.status === 'completed').forEach(booking => {
        const basePrices = {
            'roof': 15000,
            'wall': 8000,
            'foundation': 25000,
            'bathroom': 12000,
            'basement': 30000,
            'commercial': 50000
        };

        const basePrice = basePrices[booking.serviceType] || 15000;
        const area = parseInt(booking.projectArea) || 100;
        totalRevenue += Math.floor((basePrice * area) / 100);
    });

    // Update stat cards with animation
    animateCounter('totalBookingsCount', totalBookings);
    animateCounter('totalCustomersCount', totalCustomers);
    document.getElementById('totalRevenueCount').textContent = `LKR ${totalRevenue.toLocaleString()}`;
    animateCounter('pendingActionsCount', pendingActions);

    // Update change indicators
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    const recentBookings = allBookings.filter(b => new Date(b.submissionDate) > lastWeek).length;
    const recentCustomers = allUsers.filter(u => new Date(u.createdAt || 0) > lastWeek).length;

    document.getElementById('bookingsChange').textContent = recentBookings > 0 ? `+${recentBookings}` : '0';
    document.getElementById('customersChange').textContent = recentCustomers > 0 ? `+${recentCustomers}` : '0';
    document.getElementById('revenueChange').textContent = '+15%';
    document.getElementById('pendingChange').textContent = pendingActions.toString();
}

// Animate counter numbers
function animateCounter(elementId, targetValue) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const currentValue = parseInt(element.textContent) || 0;
    const increment = Math.ceil((targetValue - currentValue) / 20);
    let current = currentValue;

    const timer = setInterval(() => {
        current += increment;
        if (current >= targetValue) {
            current = targetValue;
            clearInterval(timer);
        }
        element.textContent = current;
    }, 50);
}

// Update notification count
function updateNotificationCount() {
    const pendingCount = allBookings.filter(b => b.status === 'pending').length +
        allQuotes.filter(q => q.status === 'pending').length;
    document.getElementById('notificationCount').textContent = pendingCount;
}

// Update badges
function updateBadges() {
    const pendingBookings = allBookings.filter(b => b.status === 'pending').length;
    const pendingQuotes = allQuotes.filter(q => q.status === 'pending').length;
    
    document.getElementById('pendingBookingsBadge').textContent = pendingBookings;
    document.getElementById('pendingQuotesBadge').textContent = pendingQuotes;
}

// Section navigation
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });

    // Remove active class from all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });

    // Show selected section
    const selectedSection = document.getElementById(sectionId);
    if (selectedSection) {
        selectedSection.classList.add('active');
    }

    // Add active class to clicked nav item
    const navItem = document.querySelector(`[onclick="showSection('${sectionId}')"]`);
    if (navItem) {
        navItem.classList.add('active');
    }

    // Update breadcrumb
    const sectionTitles = {
        'dashboard': 'Dashboard',
        'bookings': 'Bookings Management',
        'quotes': 'Quotes & Estimates',
        'customers': 'Customer Management',
        'staff': 'Staff Management',
        'analytics': 'Analytics & Reports',
        'reviews': 'Reviews & Feedback',
        'settings': 'System Settings'
    };

    document.getElementById('currentSection').textContent = sectionTitles[sectionId] || 'Dashboard';

    // Update URL hash
    window.location.hash = sectionId;

    // Load section-specific data
    loadSectionData(sectionId);

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Load section-specific data
function loadSectionData(sectionId) {
    switch (sectionId) {
        case 'bookings':
            displayBookingsTable();
            break;
        case 'quotes':
            displayQuotes();
            break;
        case 'customers':
            displayCustomers();
            break;
        case 'reviews':
            displayReviews();
            break;
        case 'staff':
            displayStaff();
            break;
    }
}

// Initialize event listeners
function initializeEventListeners() {
    // Check URL hash on load
    const hash = window.location.hash.substring(1) || 'dashboard';
    if (document.getElementById(hash)) {
        showSection(hash);
    } else {
        showSection('dashboard');
    }

    // Handle URL hash changes
    window.addEventListener('hashchange', function () {
        const hash = window.location.hash.substring(1) || 'dashboard';
        if (document.getElementById(hash)) {
            showSection(hash);
        }
    });
}

// Load recent bookings for dashboard
function loadRecentBookings() {
    const recentBookings = allBookings
        .sort((a, b) => new Date(b.submissionDate) - new Date(a.submissionDate))
        .slice(0, 5);

    const container = document.getElementById('recentBookingsList');

    if (recentBookings.length === 0) {
        container.innerHTML = '<p class="empty-message">No recent bookings</p>';
        return;
    }

    const serviceNames = {
        'roof': 'Roof Waterproofing',
        'wall': 'Wall Waterproofing',
        'foundation': 'Foundation Waterproofing',
        'bathroom': 'Bathroom Waterproofing',
        'basement': 'Basement Waterproofing',
        'commercial': 'Commercial Waterproofing'
    };

    container.innerHTML = recentBookings.map(booking => `
        <div class="recent-item" onclick="viewBookingDetails('${booking.id}')">
            <div class="recent-icon">
                <i class="fas fa-tools"></i>
            </div>
            <div class="recent-info">
                <h4>${serviceNames[booking.serviceType] || booking.serviceType}</h4>
                <p>${booking.userName} - ${booking.projectLocation}</p>
            </div>
            <div class="recent-time">
                ${formatRelativeTime(booking.submissionDate)}
            </div>
        </div>
    `).join('');
}

// Format relative time
function formatRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
}

// Load pending actions
function loadPendingActions() {
    const pendingBookings = allBookings.filter(b => b.status === 'pending');
    const pendingQuotes = allQuotes.filter(q => q.status === 'pending');

    const container = document.getElementById('pendingActionsList');
    const actions = [];

    pendingBookings.forEach(booking => {
        actions.push({
            text: `New booking: ${booking.serviceType} - ${booking.projectLocation}`,
            urgent: booking.urgency === 'emergency',
            id: booking.id,
            type: 'booking'
        });
    });

    pendingQuotes.forEach(quote => {
        actions.push({
            text: `Quote request: ${quote.serviceType} - ${quote.location}`,
            urgent: false,
            id: quote.id,
            type: 'quote'
        });
    });

    if (actions.length === 0) {
        container.innerHTML = '<p class="empty-message">No pending actions</p>';
        return;
    }

    container.innerHTML = actions.slice(0, 5).map(action => `
        <div class="pending-item ${action.urgent ? 'urgent' : ''}" onclick="handlePendingAction('${action.type}', '${action.id}')">
            ${action.text}
            <small style="display: block; margin-top: 5px; opacity: 0.7;">
                Click to ${action.type === 'booking' ? 'view booking' : 'process quote'}
            </small>
        </div>
    `).join('');
}

// Handle pending action clicks
function handlePendingAction(type, id) {
    if (type === 'booking') {
        showSection('bookings');
        viewBookingDetails(id);
    } else if (type === 'quote') {
        showSection('quotes');
        processQuote(id);
    }
}

// Update quick stats
function updateQuickStats() {
    const timeRange = parseInt(document.getElementById('statsTimeRange')?.value || '7');
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - timeRange);

    const recentBookings = allBookings.filter(b => new Date(b.submissionDate) > cutoffDate);
    const completedJobs = recentBookings.filter(b => b.status === 'completed');
    const totalRating = allReviews.reduce((sum, review) => sum + review.rating, 0);
    const avgRating = allReviews.length > 0 ? totalRating / allReviews.length : 0;

    document.getElementById('newBookingsCount').textContent = recentBookings.length;
    document.getElementById('completedJobsCount').textContent = completedJobs.length;
    document.getElementById('satisfactionRate').textContent = Math.round(avgRating * 20) + '%';
}

// Display functions for different sections
function displayBookingsTable(filteredBookings = null) {
    const bookings = filteredBookings || allBookings;
    const tbody = document.getElementById('bookingsTableBody');

    if (bookings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No bookings found</td></tr>';
        return;
    }

    const serviceNames = {
        'roof': 'Roof Waterproofing',
        'wall': 'Wall Waterproofing',
        'foundation': 'Foundation Waterproofing',
        'bathroom': 'Bathroom Waterproofing',
        'basement': 'Basement Waterproofing',
        'commercial': 'Commercial Waterproofing'
    };

    tbody.innerHTML = bookings.map(booking => `
        <tr>
            <td><strong>${booking.id}</strong></td>
            <td>${booking.userName}</td>
            <td>${serviceNames[booking.serviceType] || booking.serviceType}</td>
            <td>${booking.projectLocation}</td>
            <td>${new Date(booking.inspectionDate).toLocaleDateString()}</td>
            <td><span class="status-badge status-${booking.status}">${booking.status.replace('-', ' ').toUpperCase()}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn-small btn-primary" onclick="viewBookingDetails('${booking.id}')">
                        <i class="fas fa-eye"></i>
                        View
                    </button>
                    <button class="btn-small btn-secondary" onclick="updateBookingStatus('${booking.id}')">
                        <i class="fas fa-edit"></i>
                        Update
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function displayQuotes() {
    const container = document.getElementById('quotesContainer');

    if (allQuotes.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-file-invoice-dollar"></i><h3>No quotes found</h3><p>Quote requests will appear here</p></div>';
        return;
    }

    const serviceNames = {
        'roof': 'Roof Waterproofing',
        'wall': 'Wall Waterproofing',
        'foundation': 'Foundation Waterproofing',
        'bathroom': 'Bathroom Waterproofing',
        'basement': 'Basement Waterproofing',
        'commercial': 'Commercial Waterproofing'
    };

    container.innerHTML = allQuotes.map(quote => `
        <div class="quote-card">
            <div class="quote-header">
                <div>
                    <h4 class="quote-title">${serviceNames[quote.serviceType]} - ${quote.location}</h4>
                    <p class="quote-id">Quote ID: ${quote.id}</p>
                    <p><strong>Customer:</strong> ${quote.userName}</p>
                </div>
                <span class="status-badge status-${quote.status}">${quote.status.toUpperCase()}</span>
            </div>
            <p class="quote-description">${quote.description}</p>
            <div class="quote-footer">
                <span>Requested: ${new Date(quote.createdAt).toLocaleDateString()}</span>
                <div class="action-buttons">
                    ${quote.status === 'pending' ? `
                        <button class="btn-small btn-primary" onclick="processQuote('${quote.id}')">
                            <i class="fas fa-calculator"></i>
                            Process Quote
                        </button>
                    ` : quote.amount ? `
                        <span class="quote-amount">LKR ${quote.amount.toLocaleString()}</span>
                    ` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

function displayCustomers() {
    const container = document.getElementById('customersGrid');

    if (allUsers.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-users"></i><h3>No customers found</h3><p>Customer accounts will appear here</p></div>';
        return;
    }

    container.innerHTML = allUsers.map(customer => {
        const customerBookings = allBookings.filter(b => b.userId === customer.id);
        const completedBookings = customerBookings.filter(b => b.status === 'completed');
        const lastBooking = customerBookings.length > 0 ?
            new Date(Math.max(...customerBookings.map(b => new Date(b.submissionDate)))).toLocaleDateString() : 'Never';

        return `
            <div class="customer-card">
                <div class="customer-header">
                    <div class="customer-avatar">
                        ${customer.firstName.charAt(0)}${customer.lastName.charAt(0)}
                    </div>
                    <div class="customer-info">
                        <h3>${customer.firstName} ${customer.lastName}</h3>
                        <p><i class="fas fa-envelope"></i> ${customer.email}</p>
                        <p><i class="fas fa-phone"></i> ${customer.phone || 'No phone'}</p>
                        <p><i class="fas fa-clock"></i> Last booking: ${lastBooking}</p>
                    </div>
                </div>
                <div class="customer-stats">
                    <div class="customer-stat">
                        <div class="value">${customerBookings.length}</div>
                        <div class="label">Total Bookings</div>
                    </div>
                    <div class="customer-stat">
                        <div class="value">${completedBookings.length}</div>
                        <div class="label">Completed</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function displayReviews() {
    const container = document.getElementById('reviewsContainer');

    if (allReviews.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-star"></i><h3>No reviews found</h3><p>Customer reviews will appear here</p></div>';
        return;
    }

    const serviceNames = {
        'roof': 'Roof Waterproofing',
        'wall': 'Wall Waterproofing',
        'foundation': 'Foundation Waterproofing',
        'bathroom': 'Bathroom Waterproofing',
        'basement': 'Basement Waterproofing',
        'commercial': 'Commercial Waterproofing'
    };

    container.innerHTML = allReviews.map(review => `
        <div class="review-card">
            <div class="review-header">
                <div class="review-user">
                    <div class="review-avatar">
                        ${review.userName.split(' ').map(n => n.charAt(0)).join('')}
                    </div>
                    <div class="review-user-info">
                        <h4>${review.userName}</h4>
                        <p class="review-date">${new Date(review.date).toLocaleDateString()}</p>
                    </div>
                </div>
                <div class="review-rating">
                    ${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}
                </div>
            </div>
            <div class="review-content">${review.comment || 'No comment provided'}</div>
            <span class="review-service">${serviceNames[review.serviceType] || review.serviceType}</span>
        </div>
    `).join('');
}

function displayStaff() {
    const container = document.getElementById('staffContainer');
    
    // Show current admin as staff member
    container.innerHTML = `
        <div class="staff-card">
            <div class="staff-avatar">
                <i class="fas fa-user-shield"></i>
            </div>
            <div class="staff-info">
                <h3>${currentAdmin.firstName} ${currentAdmin.lastName}</h3>
                <p class="staff-role">Administrator</p>
                <p><i class="fas fa-envelope"></i> ${currentAdmin.email}</p>
                <div class="staff-permissions">
                    <span class="permission-tag">All Access</span>
                    <span class="permission-tag">User Management</span>
                    <span class="permission-tag">System Settings</span>
                </div>
                <div class="staff-actions">
                    <button class="btn-small btn-secondary">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Action functions
function viewBookingDetails(bookingId) {
    const booking = allBookings.find(b => b.id === bookingId);
    if (!booking) {
        showNotification('Booking not found', 'error');
        return;
    }
    
    showNotification(`Viewing booking ${bookingId}: ${booking.userName}`, 'info');
}

function updateBookingStatus(bookingId) {
    const booking = allBookings.find(b => b.id === bookingId);
    if (!booking) {
        showNotification('Booking not found', 'error');
        return;
    }
    
    const newStatus = prompt(`Update status for booking ${bookingId}:\n\nCurrent: ${booking.status}\n\nEnter new status (pending, confirmed, in-progress, completed, cancelled):`);
    
    if (newStatus && ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'].includes(newStatus)) {
        booking.status = newStatus;
        booking.lastUpdated = new Date().toISOString();
        booking.updatedBy = currentAdmin.email;
        
        loadDashboardData();
        displayBookingsTable();
        showNotification(`Booking ${bookingId} status updated to ${newStatus}`, 'success');
    } else if (newStatus) {
        showNotification('Invalid status. Please use: pending, confirmed, in-progress, completed, cancelled', 'error');
    }
}

function processQuote(quoteId) {
    const quote = allQuotes.find(q => q.id === quoteId);
    if (!quote) {
        showNotification('Quote not found', 'error');
        return;
    }

    if (quote.status !== 'pending') {
        showNotification('Quote has already been processed', 'warning');
        return;
    }

    const amount = prompt(`Process quote ${quoteId}:\n\nService: ${quote.serviceType}\nLocation: ${quote.location}\n\nEnter quote amount (LKR):`);
    
    if (amount && !isNaN(amount) && parseInt(amount) > 0) {
        quote.status = 'quoted';
        quote.amount = parseInt(amount);
        quote.validity = 30;
        quote.quotedAt = new Date().toISOString();
        quote.quotedBy = currentAdmin.email;
        
        loadDashboardData();
        displayQuotes();
        showNotification(`Quote ${quoteId} processed successfully for LKR ${parseInt(amount).toLocaleString()}`, 'success');
    } else if (amount) {
        showNotification('Please enter a valid amount', 'error');
    }
}

// Utility functions
function refreshData() {
    showNotification('Refreshing data...', 'info');
    loadDashboardData();
    setTimeout(() => {
        showNotification('Data refreshed successfully!', 'success');
    }, 1000);
}

function exportReport() {
    const reportData = {
        generatedAt: new Date().toISOString(),
        generatedBy: currentAdmin.email,
        stats: {
            totalBookings: allBookings.length,
            totalCustomers: allUsers.length,
            pendingBookings: allBookings.filter(b => b.status === 'pending').length,
            completedBookings: allBookings.filter(b => b.status === 'completed').length
        }
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
        type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sealtech-admin-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showNotification('Report exported successfully!', 'success');
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        showNotification('Logging out...', 'info');
        setTimeout(() => {
            // In a real application, this would redirect to login page
            alert('You have been logged out');
        }, 1000);
    }
}

// Notification system
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.admin-notification');
    existingNotifications.forEach(notif => notif.remove());

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `admin-notification ${type}`;

    const iconMap = {
        'success': 'check-circle',
        'error': 'exclamation-circle',
        'warning': 'exclamation-triangle',
        'info': 'info-circle'
    };

    notification.innerHTML = `
        <i class="fas fa-${iconMap[type]}"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;

    // Add styles
    const colorMap = {
        'success': { bg: '#d4edda', border: '#c3e6cb', text: '#155724' },
        'error': { bg: '#f8d7da', border: '#f5c6cb', text: '#721c24' },
        'warning': { bg: '#fff3cd', border: '#ffeaa7', text: '#856404' },
        'info': { bg: '#d1ecf1', border: '#bee5eb', text: '#0c5460' }
    };

    const colors = colorMap[type];
    notification.style.cssText = `
        position: fixed;
        top: 90px;
        right: 20px;
        background: ${colors.bg};
        color: ${colors.text};
        border: 1px solid ${colors.border};
        border-radius: 8px;
        padding: 15px 20px;
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 1001;
        min-width: 300px;
        max-width: 400px;
        animation: slideInRight 0.3s ease;
        box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        font-family: inherit;
    `;

    document.body.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }
    }, 5000);
}

// Filter functions
function filterBookings() {
    const statusFilter = document.getElementById('bookingStatusFilter')?.value || 'all';
    const serviceFilter = document.getElementById('serviceTypeFilter')?.value || 'all';
    const searchTerm = document.getElementById('bookingSearch')?.value.toLowerCase() || '';

    let filtered = allBookings;

    if (statusFilter !== 'all') {
        filtered = filtered.filter(b => b.status === statusFilter);
    }

    if (serviceFilter !== 'all') {
        filtered = filtered.filter(b => b.serviceType === serviceFilter);
    }

    if (searchTerm) {
        filtered = filtered.filter(b =>
            b.userName.toLowerCase().includes(searchTerm) ||
            b.projectLocation.toLowerCase().includes(searchTerm) ||
            b.id.toLowerCase().includes(searchTerm)
        );
    }

    displayBookingsTable(filtered);
}

function filterCustomers() {
    const searchTerm = document.getElementById('customerSearch')?.value.toLowerCase() || '';
    const typeFilter = document.getElementById('customerTypeFilter')?.value || 'all';

    let filtered = allUsers;

    if (typeFilter !== 'all') {
        filtered = filtered.filter(u => u.userType === typeFilter);
    }

    if (searchTerm) {
        filtered = filtered.filter(u =>
            `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchTerm) ||
            u.email.toLowerCase().includes(searchTerm)
        );
    }

    displayCustomers(filtered);
}

function filterReviews() {
    const ratingFilter = document.getElementById('reviewsFilter')?.value || 'all';

    let filtered = allReviews;

    if (ratingFilter !== 'all') {
        filtered = filtered.filter(r => r.rating === parseInt(ratingFilter));
    }

    displayReviews(filtered);
}

// Additional utility functions
function updateLastUpdateTime() {
    // This would typically update a timestamp element
    console.log('Dashboard last updated:', new Date().toLocaleString());
}

// Performance monitoring
window.addEventListener('load', function() {
    const loadTime = performance.now();
    console.log(`Admin dashboard loaded in ${Math.round(loadTime)}ms`);
    
    if (loadTime > 3000) {
        console.warn('Dashboard took longer than expected to load');
    }
});

// Auto-refresh data periodically
setInterval(() => {
    if (document.visibilityState === 'visible') {
        updateNotificationCount();
        updateBadges();
    }
}, 30000);

// Handle visibility change
document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') {
        // Refresh data when admin returns to tab
        loadDashboardData();
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Escape to close notifications
    if (e.key === 'Escape') {
        const notifications = document.querySelectorAll('.admin-notification');
        notifications.forEach(notif => notif.remove());
    }

    // Ctrl+R to refresh data (prevent default browser refresh)
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        refreshData();
    }
});

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }

    .admin-notification button {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 1rem;
        color: inherit;
        margin-left: auto;
        padding: 5px;
        border-radius: 3px;
        transition: background 0.3s ease;
    }

    .admin-notification button:hover {
        background: rgba(0, 0, 0, 0.1);
    }
`;
document.head.appendChild(style);