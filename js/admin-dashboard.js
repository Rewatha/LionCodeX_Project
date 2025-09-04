// Global variables
let currentAdmin = null;
let allBookings = [];
let allUsers = [];
let allQuotes = [];
let allReviews = [];
let currentBookingId = null;

// Initialize admin dashboard
document.addEventListener('DOMContentLoaded', function () {
    if (!checkAdminAuthentication()) {
        return;
    }

    loadAdminData();
    initializeEventListeners();
    loadDashboardData();
    updateLastUpdateTime();
});

// Admin authentication check
function checkAdminAuthentication() {
    currentAdmin = JSON.parse(localStorage.getItem('currentUser') || 'null');

    if (!currentAdmin || (currentAdmin.userType !== 'admin' && currentAdmin.userType !== 'staff')) {
        // Redirect to login if not admin/staff
        alert('Access denied. Admin privileges required.');
        window.location.href = 'auth.html';
        return false;
    }

    return true;
}

// Load admin data
function loadAdminData() {
    // Update admin info in navigation
    document.getElementById('adminName').textContent = `${currentAdmin.firstName} ${currentAdmin.lastName}`;
    document.getElementById('adminRole').textContent = currentAdmin.userType === 'admin' ? 'Administrator' : 'Staff Member';
}

// Load all dashboard data
function loadDashboardData() {
    loadAllBookings();
    loadAllUsers();
    loadAllQuotes();
    loadAllReviews();
    updateDashboardStats();
    loadRecentBookings();
    loadPendingActions();
    updateQuickStats();
    updateNotificationCount();
}

// Load all bookings
function loadAllBookings() {
    allBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    updateBookingsBadge();
    displayBookingsTable();
}

// Load all users
function loadAllUsers() {
    allUsers = JSON.parse(localStorage.getItem('users') || '[]')
        .filter(user => user.userType !== 'admin' && user.userType !== 'staff');
    displayCustomers();
}

// Load all quotes
function loadAllQuotes() {
    allQuotes = JSON.parse(localStorage.getItem('quotes') || '[]');
    updateQuotesBadge();
    displayQuotes();
}

// Load all reviews
function loadAllReviews() {
    allReviews = JSON.parse(localStorage.getItem('reviews') || '[]');
    displayReviews();
    updateSatisfactionMetrics();
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

    // Update change indicators (calculate from last week)
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    const recentBookings = allBookings.filter(b => new Date(b.submissionDate) > lastWeek).length;
    const recentCustomers = allUsers.filter(u => new Date(u.createdAt || 0) > lastWeek).length;

    document.getElementById('bookingsChange').textContent = recentBookings > 0 ? `+${recentBookings}` : '0';
    document.getElementById('customersChange').textContent = recentCustomers > 0 ? `+${recentCustomers}` : '0';
    document.getElementById('revenueChange').textContent = '+15%'; // Placeholder
    document.getElementById('pendingChange').textContent = pendingActions.toString();
}

// Animate counter numbers
function animateCounter(elementId, targetValue) {
    const element = document.getElementById(elementId);
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
function updateBookingsBadge() {
    const pendingCount = allBookings.filter(b => b.status === 'pending').length;
    document.getElementById('pendingBookingsBadge').textContent = pendingCount;
}

function updateQuotesBadge() {
    const pendingCount = allQuotes.filter(q => q.status === 'pending').length;
    document.getElementById('pendingQuotesBadge').textContent = pendingCount;
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
    document.getElementById(sectionId).classList.add('active');

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

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Initialize event listeners
function initializeEventListeners() {
    // Modal close handlers
    document.addEventListener('click', function (e) {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('show');
            document.body.style.overflow = 'auto';
        }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', function (e) {
        // Escape to close modals
        if (e.key === 'Escape') {
            const openModal = document.querySelector('.modal.show');
            if (openModal) {
                openModal.classList.remove('show');
                document.body.style.overflow = 'auto';
            }
        }

        // Ctrl+R to refresh data
        if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
            e.preventDefault();
            refreshData();
        }
    });

    // Form submissions
    const businessInfoForm = document.getElementById('businessInfoForm');
    if (businessInfoForm) {
        businessInfoForm.addEventListener('submit', handleBusinessInfoUpdate);
    }

    const serviceSettingsForm = document.getElementById('serviceSettingsForm');
    if (serviceSettingsForm) {
        serviceSettingsForm.addEventListener('submit', handleServiceSettingsUpdate);
    }

    // Check URL hash on load
    const hash = window.location.hash.substring(1) || 'dashboard';
    if (document.getElementById(hash)) {
        showSection(hash);
    }
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
    const urgentBookings = allBookings.filter(b => b.urgency === 'emergency');

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
        viewBookingDetails(id);
    } else if (type === 'quote') {
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

// Display bookings table
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
                    <button class="btn-small btn-secondary" onclick="updateBookingStatusModal('${booking.id}')">
                        <i class="fas fa-edit"></i>
                        Update
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Filter bookings
function filterBookings() {
    const statusFilter = document.getElementById('bookingStatusFilter').value;
    const serviceFilter = document.getElementById('serviceTypeFilter').value;
    const searchTerm = document.getElementById('bookingSearch').value.toLowerCase();

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

// Display quotes
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

// Display customers
function displayCustomers(filteredCustomers = null) {
    const customers = filteredCustomers || allUsers;
    const container = document.getElementById('customersGrid');

    if (customers.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-users"></i><h3>No customers found</h3><p>Customer accounts will appear here</p></div>';
        return;
    }

    container.innerHTML = customers.map(customer => {
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

// Filter customers
function filterCustomers() {
    const searchTerm = document.getElementById('customerSearch').value.toLowerCase();
    const typeFilter = document.getElementById('customerTypeFilter').value;

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

// Display staff
function displayStaff() {
    const container = document.getElementById('staffContainer');
    const staffUsers = JSON.parse(localStorage.getItem('users') || '[]')
        .filter(user => user.userType === 'admin' || user.userType === 'staff');

    if (staffUsers.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-user-tie"></i><h3>No staff members</h3><p>Staff accounts will appear here</p></div>';
        return;
    }

    const staffHtml = staffUsers.map(staff => `
        <div class="staff-card">
            <div class="staff-avatar">
                ${staff.firstName.charAt(0)}${staff.lastName.charAt(0)}
            </div>
            <div class="staff-info">
                <h3>${staff.firstName} ${staff.lastName}</h3>
                <p class="staff-role">${staff.userType === 'admin' ? 'Administrator' : 'Staff Member'}</p>
                <p><i class="fas fa-envelope"></i> ${staff.email}</p>
                <div class="staff-permissions">
                    ${staff.userType === 'admin' ?
            '<span class="permission-tag">All Access</span><span class="permission-tag">User Management</span><span class="permission-tag">System Settings</span>' :
            '<span class="permission-tag">Booking Management</span><span class="permission-tag">Customer Support</span>'
        }
                </div>
                <div class="staff-actions">
                    <button class="btn-small btn-secondary" onclick="editStaff('${staff.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    ${staff.id !== currentAdmin.id ? `
                        <button class="btn-small btn-danger" onclick="removeStaff('${staff.id}')">
                            <i class="fas fa-trash"></i> Remove
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `).join('');

    container.innerHTML = staffHtml;
}

// Display reviews
function displayReviews(filteredReviews = null) {
    const reviews = filteredReviews || allReviews;
    const container = document.getElementById('reviewsContainer');

    if (reviews.length === 0) {
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

    container.innerHTML = reviews.map(review => `
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

// Filter reviews
function filterReviews() {
    const ratingFilter = document.getElementById('reviewsFilter').value;

    let filtered = allReviews;

    if (ratingFilter !== 'all') {
        filtered = filtered.filter(r => r.rating === parseInt(ratingFilter));
    }

    displayReviews(filtered);
}

// Update satisfaction metrics
function updateSatisfactionMetrics() {
    if (allReviews.length === 0) {
        document.getElementById('avgRating').textContent = '0.0';
        document.getElementById('totalReviews').textContent = '0';
        document.getElementById('ratingBreakdown').innerHTML = '<p>No reviews yet</p>';
        return;
    }

    const totalRating = allReviews.reduce((sum, review) => sum + review.rating, 0);
    const avgRating = totalRating / allReviews.length;

    document.getElementById('avgRating').textContent = avgRating.toFixed(1);
    document.getElementById('totalReviews').textContent = allReviews.length;

    // Rating breakdown
    const ratingCounts = [1, 2, 3, 4, 5].map(rating => ({
        rating,
        count: allReviews.filter(r => r.rating === rating).length
    }));

    const maxCount = Math.max(...ratingCounts.map(r => r.count), 1);

    document.getElementById('ratingBreakdown').innerHTML = ratingCounts.reverse().map(item => `
        <div class="rating-bar">
            <div class="rating-stars">${'★'.repeat(item.rating)}</div>
            <div class="rating-progress">
                <div class="rating-fill" style="width: ${(item.count / maxCount) * 100}%"></div>
            </div>
            <div class="rating-count">${item.count}</div>
        </div>
    `).join('');
}

// Booking actions
function viewBookingDetails(bookingId) {
    const booking = allBookings.find(b => b.id === bookingId);
    if (!booking) return;

    const serviceNames = {
        'roof': 'Roof Waterproofing',
        'wall': 'Wall Waterproofing',
        'foundation': 'Foundation Waterproofing',
        'bathroom': 'Bathroom Waterproofing',
        'basement': 'Basement Waterproofing',
        'commercial': 'Commercial Waterproofing'
    };

    const budgetRanges = {
        'under-100k': 'Under LKR 100,000',
        '100k-500k': 'LKR 100,000 - 500,000',
        '500k-1m': 'LKR 500,000 - 1,000,000',
        '1m-plus': 'Above LKR 1,000,000',
        'discuss': 'Prefer to Discuss'
    };

    const timeSlotLabels = {
        'morning': 'Morning (8:00 AM - 12:00 PM)',
        'afternoon': 'Afternoon (12:00 PM - 4:00 PM)',
        'evening': 'Evening (4:00 PM - 6:00 PM)'
    };

    document.getElementById('bookingDetailsContent').innerHTML = `
        <div class="booking-details-grid">
            <div class="detail-section">
                <h3>Booking Information</h3>
                <p><strong>Booking ID:</strong> ${booking.id}</p>
                <p><strong>Service:</strong> ${serviceNames[booking.serviceType]}</p>
                <p><strong>Status:</strong> <span class="status-badge status-${booking.status}">${booking.status.replace('-', ' ').toUpperCase()}</span></p>
                <p><strong>Urgency:</strong> ${booking.urgency || 'Normal'}</p>
                <p><strong>Submitted:</strong> ${new Date(booking.submissionDate).toLocaleDateString()}</p>
                ${booking.adminNotes ? `<p><strong>Admin Notes:</strong> ${booking.adminNotes}</p>` : ''}
            </div>
            
            <div class="detail-section">
                <h3>Customer Information</h3>
                <p><strong>Name:</strong> ${booking.userName}</p>
                <p><strong>Email:</strong> ${booking.userEmail}</p>
                <p><strong>Phone:</strong> ${booking.contactPhone}</p>
                ${booking.alternateContact ? `<p><strong>Alternate Contact:</strong> ${booking.alternateContact}</p>` : ''}
            </div>
            
            <div class="detail-section">
                <h3>Project Details</h3>
                <p><strong>Location:</strong> ${booking.projectLocation}</p>
                <p><strong>Property Type:</strong> ${booking.propertyType || 'Not specified'}</p>
                <p><strong>Area:</strong> ${booking.projectArea ? booking.projectArea + ' sq ft' : 'Not specified'}</p>
                <p><strong>Budget:</strong> ${budgetRanges[booking.budgetRange] || 'Not specified'}</p>
                <p><strong>Description:</strong> ${booking.problemDescription}</p>
            </div>
            
            <div class="detail-section">
                <h3>Schedule</h3>
                <p><strong>Inspection Date:</strong> ${new Date(booking.inspectionDate).toLocaleDateString()}</p>
                <p><strong>Time Slot:</strong> ${timeSlotLabels[booking.timeSlot] || booking.timeSlot}</p>
                <p><strong>Special Instructions:</strong> ${booking.specialInstructions || 'None'}</p>
                ${booking.images > 0 ? `<p><strong>Images Uploaded:</strong> ${booking.images} files</p>` : '<p><strong>Images:</strong> None</p>'}
            </div>
        </div>
    `;

    currentBookingId = bookingId;
    showModal('bookingDetailsModal');
}

function updateBookingStatusModal(bookingId) {
    currentBookingId = bookingId;
    const booking = allBookings.find(b => b.id === bookingId);
    if (booking) {
        document.getElementById('newStatus').value = booking.status;
    }
    showModal('statusUpdateModal');
}

function saveStatusUpdate() {
    if (!currentBookingId) return;

    const newStatus = document.getElementById('newStatus').value;
    const notes = document.getElementById('statusNotes').value;

    if (!newStatus) {
        showNotification('Please select a status', 'error');
        return;
    }

    // Update booking in localStorage
    let bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    const bookingIndex = bookings.findIndex(b => b.id === currentBookingId);

    if (bookingIndex !== -1) {
        bookings[bookingIndex].status = newStatus;
        bookings[bookingIndex].lastUpdated = new Date().toISOString();
        bookings[bookingIndex].updatedBy = currentAdmin.email;
        if (notes) {
            bookings[bookingIndex].adminNotes = notes;
        }
        localStorage.setItem('bookings', JSON.stringify(bookings));

        // Reload data
        loadAllBookings();
        updateDashboardStats();

        closeModal('statusUpdateModal');
        closeModal('bookingDetailsModal');

        showNotification(`Booking status updated to ${newStatus}!`, 'success');

        // Clear form
        document.getElementById('statusUpdateForm').reset();
    }
}

// Quote actions
function processQuote(quoteId) {
    const quote = allQuotes.find(q => q.id === quoteId);
    if (!quote) return;

    const amount = prompt('Enter quote amount (LKR):');
    if (amount && !isNaN(amount) && parseInt(amount) > 0) {
        const validityDays = prompt('Quote validity (days):', '30');

        if (validityDays && !isNaN(validityDays)) {
            // Update quote
            let quotes = JSON.parse(localStorage.getItem('quotes') || '[]');
            const quoteIndex = quotes.findIndex(q => q.id === quoteId);

            if (quoteIndex !== -1) {
                quotes[quoteIndex].status = 'quoted';
                quotes[quoteIndex].amount = parseInt(amount);
                quotes[quoteIndex].validity = parseInt(validityDays);
                quotes[quoteIndex].quotedAt = new Date().toISOString();
                quotes[quoteIndex].quotedBy = currentAdmin.email;
                localStorage.setItem('quotes', JSON.stringify(quotes));

                loadAllQuotes();
                showNotification('Quote processed successfully!', 'success');
            }
        }
    }
}

function createNewQuote() {
    showNotification('Create new quote functionality would be implemented here', 'info');
}

// Staff management
function addNewStaff() {
    showModal('addStaffModal');
}

function saveNewStaff() {
    const firstName = document.getElementById('staffFirstName').value;
    const lastName = document.getElementById('staffLastName').value;
    const email = document.getElementById('staffEmail').value;
    const role = document.getElementById('staffRole').value;
    const password = document.getElementById('staffPassword').value;

    if (!firstName || !lastName || !email || !role || !password) {
        showNotification('Please fill in all fields.', 'error');
        return;
    }

    // Check if email already exists
    const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
    if (existingUsers.find(u => u.email === email)) {
        showNotification('Email already exists!', 'error');
        return;
    }

    const newStaff = {
        id: Date.now(),
        firstName: firstName,
        lastName: lastName,
        email: email,
        userType: role,
        password: password,
        createdAt: new Date().toISOString(),
        createdBy: currentAdmin.email
    };

    existingUsers.push(newStaff);
    localStorage.setItem('users', JSON.stringify(existingUsers));

    closeModal('addStaffModal');
    displayStaff();
    showNotification(`${role === 'admin' ? 'Administrator' : 'Staff member'} added successfully!`, 'success');

    // Clear form
    document.getElementById('addStaffForm').reset();
}

function editStaff(staffId) {
    showNotification('Edit staff functionality would be implemented here', 'info');
}

function removeStaff(staffId) {
    if (confirm('Are you sure you want to remove this staff member? This action cannot be undone.')) {
        let users = JSON.parse(localStorage.getItem('users') || '[]');
        users = users.filter(u => u.id != staffId);
        localStorage.setItem('users', JSON.stringify(users));

        displayStaff();
        showNotification('Staff member removed successfully!', 'success');
    }
}

// Analytics functions
function updateAnalytics() {
    showNotification('Analytics updated for selected time range', 'info');
}

// Utility functions
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
}

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
            completedBookings: allBookings.filter(b => b.status === 'completed').length,
            totalRevenue: calculateTotalRevenue(),
            averageRating: calculateAverageRating()
        },
        bookings: allBookings,
        customers: allUsers,
        quotes: allQuotes,
        reviews: allReviews
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

function calculateTotalRevenue() {
    let total = 0;
    allBookings.filter(b => b.status === 'completed').forEach(booking => {
        const basePrices = {
            'roof': 15000, 'wall': 8000, 'foundation': 25000,
            'bathroom': 12000, 'basement': 30000, 'commercial': 50000
        };
        const basePrice = basePrices[booking.serviceType] || 15000;
        const area = parseInt(booking.projectArea) || 100;
        total += Math.floor((basePrice * area) / 100);
    });
    return total;
}

function calculateAverageRating() {
    if (allReviews.length === 0) return 0;
    const total = allReviews.reduce((sum, review) => sum + review.rating, 0);
    return (total / allReviews.length).toFixed(1);
}

function refreshPendingActions() {
    loadPendingActions();
    showNotification('Pending actions refreshed!', 'info');
}

// Settings handlers
function handleBusinessInfoUpdate(e) {
    e.preventDefault();

    const businessData = {
        name: document.getElementById('businessName').value,
        phone: document.getElementById('businessPhone').value,
        email: document.getElementById('businessEmail').value,
        address: document.getElementById('businessAddress').value,
        updatedAt: new Date().toISOString(),
        updatedBy: currentAdmin.email
    };

    localStorage.setItem('businessInfo', JSON.stringify(businessData));
    showNotification('Business information updated successfully!', 'success');
}

function handleServiceSettingsUpdate(e) {
    e.preventDefault();

    const serviceSettings = {
        autoConfirmBookings: document.getElementById('autoConfirmBookings').checked,
        emailNotifications: document.getElementById('emailNotifications').checked,
        smsNotifications: document.getElementById('smsNotifications').checked,
        maxBookingsPerDay: document.getElementById('maxBookingsPerDay').value,
        updatedAt: new Date().toISOString(),
        updatedBy: currentAdmin.email
    };

    localStorage.setItem('serviceSettings', JSON.stringify(serviceSettings));
    showNotification('Service settings updated successfully!', 'success');
}

// Additional settings functions
function changeAdminPassword() {
    const currentPassword = prompt('Enter current password:');
    if (currentPassword === currentAdmin.password) {
        const newPassword = prompt('Enter new password:');
        if (newPassword && newPassword.length >= 8) {
            const confirmPassword = prompt('Confirm new password:');
            if (newPassword === confirmPassword) {
                // Update password
                let users = JSON.parse(localStorage.getItem('users') || '[]');
                const userIndex = users.findIndex(u => u.id === currentAdmin.id);
                if (userIndex !== -1) {
                    users[userIndex].password = newPassword;
                    localStorage.setItem('users', JSON.stringify(users));

                    currentAdmin.password = newPassword;
                    localStorage.setItem('currentUser', JSON.stringify(currentAdmin));

                    showNotification('Password changed successfully!', 'success');
                }
            } else {
                showNotification('Passwords do not match!', 'error');
            }
        } else {
            showNotification('Password must be at least 8 characters long!', 'error');
        }
    } else {
        showNotification('Current password is incorrect!', 'error');
    }
}

function backupData() {
    const backupData = {
        users: JSON.parse(localStorage.getItem('users') || '[]'),
        bookings: JSON.parse(localStorage.getItem('bookings') || '[]'),
        quotes: JSON.parse(localStorage.getItem('quotes') || '[]'),
        reviews: JSON.parse(localStorage.getItem('reviews') || '[]'),
        businessInfo: JSON.parse(localStorage.getItem('businessInfo') || '{}'),
        serviceSettings: JSON.parse(localStorage.getItem('serviceSettings') || '{}'),
        backupDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sealtech-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showNotification('System backup created successfully!', 'success');
}

function systemReset() {
    if (confirm('Are you sure you want to reset the system? This will delete ALL data including users, bookings, quotes, and reviews. This action cannot be undone!')) {
        if (confirm('This is your final warning. All data will be permanently deleted. Are you absolutely sure?')) {
            // Keep only current admin user
            const adminUser = [currentAdmin];
            localStorage.setItem('users', JSON.stringify(adminUser));
            localStorage.removeItem('bookings');
            localStorage.removeItem('quotes');
            localStorage.removeItem('reviews');
            localStorage.removeItem('businessInfo');
            localStorage.removeItem('serviceSettings');

            // Reload page
            window.location.reload();
        }
    }
}

function showSystemInfo() {
    const systemInfo = {
        version: '1.0.0',
        lastBackup: localStorage.getItem('lastBackup') || 'Never',
        totalUsers: JSON.parse(localStorage.getItem('users') || '[]').length,
        totalBookings: JSON.parse(localStorage.getItem('bookings') || '[]').length,
        storageUsed: calculateStorageUsage(),
        browser: navigator.userAgent,
        timestamp: new Date().toLocaleString()
    };

    alert(`System Information:
Version: ${systemInfo.version}
Total Users: ${systemInfo.totalUsers}
Total Bookings: ${systemInfo.totalBookings}
Storage Used: ${systemInfo.storageUsed} KB
Last Updated: ${systemInfo.timestamp}`);
}

function calculateStorageUsage() {
    let total = 0;
    for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
            total += localStorage[key].length;
        }
    }
    return Math.round(total / 1024 * 100) / 100; // KB
}

function contactSupport() {
    window.open('mailto:admin@sealtechengineering.com?subject=Admin Dashboard Support Request');
}

// Update last update time
function updateLastUpdateTime() {
    document.getElementById('lastUpdateTime').textContent = new Date().toLocaleString();
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

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('currentUser');
        sessionStorage.clear();
        window.location.href = '../index.html';
    }
}

// Handle URL hash changes
window.addEventListener('hashchange', function () {
    const hash = window.location.hash.substring(1) || 'dashboard';
    if (document.getElementById(hash)) {
        showSection(hash);
    }
});

// Auto-refresh data every 30 seconds
setInterval(() => {
    if (document.visibilityState === 'visible') {
        loadDashboardData();
        updateLastUpdateTime();
    }
}, 30000);

// Handle visibility change
document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') {
        // Refresh data when admin returns to tab
        loadDashboardData();
        updateLastUpdateTime();
    }
});

// Initialize staff display when showing staff section
const originalShowSection = showSection;
window.showSection = function (sectionId) {
    originalShowSection(sectionId);
    if (sectionId === 'staff') {
        displayStaff();
    }
};

// Performance monitoring
const performanceMonitor = {
    startTime: Date.now(),

    logLoadTime: function () {
        const loadTime = Date.now() - this.startTime;
        console.log(`Admin dashboard loaded in ${loadTime}ms`);

        if (loadTime > 3000) {
            console.warn('Admin dashboard took longer than expected to load');
        }
    }
};

window.addEventListener('load', function () {
    performanceMonitor.logLoadTime();
});

// Add animation styles
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
`;
document.head.appendChild(style);