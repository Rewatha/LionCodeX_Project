// Global variables
let currentUser = null;
let userBookings = [];
let userQuotes = [];

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    if (!checkAuthentication()) {
        return;
    }
    
    loadUserData();
    loadDashboardData();
    initializeEventListeners();
});

// Authentication check
function checkAuthentication() {
    currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    
    if (!currentUser) {
        // Redirect to login page
        window.location.href = 'auth.html';
        return false;
    }
    
    return true;
}

// Load user data into interface
function loadUserData() {
    // Update navigation
    const userName = document.getElementById('userName');
    const sidebarUserName = document.getElementById('sidebarUserName');
    const sidebarUserEmail = document.getElementById('sidebarUserEmail');
    
    userName.textContent = currentUser.firstName || 'User';
    sidebarUserName.textContent = `${currentUser.firstName} ${currentUser.lastName}`;
    sidebarUserEmail.textContent = currentUser.email;
    
    // Load profile form
    loadProfileForm();
}

// Load dashboard data
function loadDashboardData() {
    loadBookings();
    loadQuotes();
    updateStats();
    loadRecentActivity();
}

// Load user bookings
function loadBookings() {
    const allBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    userBookings = allBookings.filter(booking => booking.userId === currentUser.id);
    
    // Update booking badge
    const bookingsBadge = document.getElementById('bookingsBadge');
    bookingsBadge.textContent = userBookings.length;
    
    displayBookings();
}

// Display bookings
function displayBookings(filter = 'all') {
    const bookingsContainer = document.getElementById('bookingsContainer');
    let filteredBookings = userBookings;
    
    if (filter !== 'all') {
        filteredBookings = userBookings.filter(booking => booking.status === filter);
    }
    
    if (filteredBookings.length === 0) {
        bookingsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-plus"></i>
                <h3>No bookings found</h3>
                <p>You haven't made any bookings yet or no bookings match the current filter.</p>
                <a href="booking.html" class="btn-primary">Book New Service</a>
            </div>
        `;
        return;
    }
    
    bookingsContainer.innerHTML = filteredBookings.map(booking => createBookingCard(booking)).join('');
}

// Create booking card HTML
function createBookingCard(booking) {
    const serviceNames = {
        'roof': 'Roof Waterproofing',
        'wall': 'Wall Waterproofing',
        'foundation': 'Foundation Waterproofing',
        'bathroom': 'Bathroom Waterproofing',
        'basement': 'Basement Waterproofing',
        'commercial': 'Commercial Waterproofing'
    };
    
    const statusClasses = {
        'pending': 'status-pending',
        'confirmed': 'status-confirmed',
        'in-progress': 'status-in-progress',
        'completed': 'status-completed',
        'cancelled': 'status-cancelled'
    };
    
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };
    
    return `
        <div class="booking-card ${booking.status}">
            <div class="booking-header">
                <div>
                    <h3 class="booking-title">${serviceNames[booking.serviceType] || booking.serviceType}</h3>
                    <p class="booking-id">Booking ID: ${booking.id}</p>
                </div>
                <span class="booking-status ${statusClasses[booking.status]}">${booking.status}</span>
            </div>
            
            <div class="booking-details">
                <div class="detail-item">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${booking.projectLocation}</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-calendar"></i>
                    <span>${formatDate(booking.inspectionDate)}</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-clock"></i>
                    <span>${booking.timeSlot}</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-phone"></i>
                    <span>${booking.contactPhone}</span>
                </div>
            </div>
            
            <div class="booking-actions">
                <button class="btn-primary btn-small" onclick="viewBookingDetails('${booking.id}')">
                    View Details
                </button>
                ${booking.status === 'pending' ? `
                    <button class="btn-secondary btn-small" onclick="rescheduleBooking('${booking.id}')">
                        Reschedule
                    </button>
                    <button class="btn-danger btn-small" onclick="cancelBooking('${booking.id}')">
                        Cancel
                    </button>
                ` : ''}
                ${booking.status === 'completed' ? `
                    <button class="btn-primary btn-small" onclick="leaveReview('${booking.id}')">
                        Leave Review
                    </button>
                ` : ''}
            </div>
        </div>
    `;
}

// Load quotes
function loadQuotes() {
    const allQuotes = JSON.parse(localStorage.getItem('quotes') || '[]');
    userQuotes = allQuotes.filter(quote => quote.userId === currentUser.id);
    
    displayQuotes();
}

// Display quotes
function displayQuotes() {
    const quotesContainer = document.getElementById('quotesContainer');
    
    if (userQuotes.length === 0) {
        quotesContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-file-invoice-dollar"></i>
                <h3>No quotes yet</h3>
                <p>Request a quote for your waterproofing project</p>
                <button class="btn-primary" onclick="requestNewQuote()">Request Quote</button>
            </div>
        `;
        return;
    }
    
    // Display quotes (placeholder for now)
    quotesContainer.innerHTML = userQuotes.map(quote => `
        <div class="quote-card">
            <h4>${quote.serviceType} - ${quote.location}</h4>
            <p>Status: ${quote.status}</p>
            <p>Requested: ${new Date(quote.createdAt).toLocaleDateString()}</p>
        </div>
    `).join('');
}

// Update stats
function updateStats() {
    const totalBookings = userBookings.length;
    const pendingBookings = userBookings.filter(b => b.status === 'pending').length;
    const completedBookings = userBookings.filter(b => b.status === 'completed').length;
    
    document.getElementById('totalBookings').textContent = totalBookings;
    document.getElementById('pendingBookings').textContent = pendingBookings;
    document.getElementById('completedBookings').textContent = completedBookings;
    
    // Calculate total spent (placeholder calculation)
    let totalSpent = 0;
    userBookings.filter(b => b.status === 'completed').forEach(booking => {
        // Estimate based on service type and area
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
        const estimatedCost = Math.floor((basePrice * area) / 100);
        totalSpent += estimatedCost;
    });
    
    document.getElementById('totalSpent').textContent = `LKR ${totalSpent.toLocaleString()}`;
}