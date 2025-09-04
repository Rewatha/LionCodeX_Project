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
    
    const timeSlotLabels = {
        'morning': 'Morning (8:00 AM - 12:00 PM)',
        'afternoon': 'Afternoon (12:00 PM - 4:00 PM)',
        'evening': 'Evening (4:00 PM - 6:00 PM)'
    };
    
    return `
        <div class="booking-card ${booking.status}">
            <div class="booking-header">
                <div>
                    <h3 class="booking-title">${serviceNames[booking.serviceType] || booking.serviceType}</h3>
                    <p class="booking-id">Booking ID: ${booking.id}</p>
                </div>
                <span class="booking-status ${statusClasses[booking.status]}">${booking.status.replace('-', ' ').toUpperCase()}</span>
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
                    <span>${timeSlotLabels[booking.timeSlot] || booking.timeSlot}</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-phone"></i>
                    <span>${booking.contactPhone}</span>
                </div>
            </div>
            
            ${booking.problemDescription ? `
                <div class="booking-description">
                    <strong>Description:</strong> ${booking.problemDescription}
                </div>
            ` : ''}
            
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
    
    const serviceNames = {
        'roof': 'Roof Waterproofing',
        'wall': 'Wall Waterproofing',
        'foundation': 'Foundation Waterproofing',
        'bathroom': 'Bathroom Waterproofing',
        'basement': 'Basement Waterproofing',
        'commercial': 'Commercial Waterproofing'
    };
    
    quotesContainer.innerHTML = userQuotes.map(quote => `
        <div class="quote-card">
            <div class="quote-header">
                <h4>${serviceNames[quote.serviceType]} - ${quote.location}</h4>
                <span class="quote-status status-${quote.status}">${quote.status.toUpperCase()}</span>
            </div>
            <p class="quote-description">${quote.description}</p>
            <div class="quote-footer">
                <span class="quote-date">Requested: ${new Date(quote.createdAt).toLocaleDateString()}</span>
                <span class="quote-id">Quote ID: ${quote.id}</span>
            </div>
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

// Load recent activity
function loadRecentActivity() {
    const recentBookingsContainer = document.getElementById('recentBookings');
    const recentBookings = userBookings
        .sort((a, b) => new Date(b.submissionDate) - new Date(a.submissionDate))
        .slice(0, 3);
    
    if (recentBookings.length === 0) {
        recentBookingsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-plus"></i>
                <p>No bookings yet</p>
                <a href="booking.html" class="btn-primary">Book Your First Service</a>
            </div>
        `;
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
    
    recentBookingsContainer.innerHTML = recentBookings.map(booking => {
        return `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas fa-tools"></i>
                </div>
                <div class="activity-info">
                    <h4>${serviceNames[booking.serviceType]}</h4>
                    <p>${booking.projectLocation} - ${booking.status.replace('-', ' ')}</p>
                </div>
                <div class="activity-date">
                    ${new Date(booking.submissionDate).toLocaleDateString()}
                </div>
            </div>
        `;
    }).join('');
}

// Section navigation
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.dashboard-section').forEach(section => {
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
    
    // Update URL hash
    window.location.hash = sectionId;
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Initialize event listeners
function initializeEventListeners() {
    // Filter buttons
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            filterButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const filter = this.getAttribute('data-filter');
            displayBookings(filter);
        });
    });
    
    // Profile form submission
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileUpdate);
    }
    
    // FAQ toggles
    initializeFAQ();
    
    // Modal close on outside click
    initializeModalHandlers();
    
    // Check URL hash on load
    const hash = window.location.hash.substring(1);
    if (hash && document.getElementById(hash)) {
        showSection(hash);
    }
}

// Initialize FAQ functionality
function initializeFAQ() {
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(question => {
        question.addEventListener('click', function() {
            toggleFaq(this);
        });
    });
}

// Initialize modal handlers
function initializeModalHandlers() {
    // Close modals when clicking outside
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('show');
            document.body.style.overflow = 'auto';
        }
    });
    
    // Close modals with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const openModal = document.querySelector('.modal.show');
            if (openModal) {
                openModal.classList.remove('show');
                document.body.style.overflow = 'auto';
            }
        }
    });
}

// Load profile form
function loadProfileForm() {
    document.getElementById('profileFirstName').value = currentUser.firstName || '';
    document.getElementById('profileLastName').value = currentUser.lastName || '';
    document.getElementById('profileEmail').value = currentUser.email || '';
    document.getElementById('profilePhone').value = currentUser.phone || '';
    document.getElementById('profileAddress').value = currentUser.address || '';
    
    // Load preferences
    document.getElementById('emailNotifications').checked = currentUser.preferences?.emailNotifications !== false;
    document.getElementById('smsNotifications').checked = currentUser.preferences?.smsNotifications !== false;
    document.getElementById('marketingEmails').checked = currentUser.preferences?.marketingEmails !== false;
    
    // Trigger label animations for populated fields
    setTimeout(() => {
        const inputs = document.querySelectorAll('#profileForm input, #profileForm textarea');
        inputs.forEach(input => {
            if (input.value && input.value.trim() !== '') {
                const label = input.nextElementSibling;
                if (label && label.tagName === 'LABEL') {
                    label.style.top = '-10px';
                    label.style.fontSize = '0.85rem';
                    label.style.color = '#007bff';
                    label.style.background = 'white';
                    label.style.padding = '0 8px';
                }
            }
        });
    }, 100);
}

// Handle profile update
function handleProfileUpdate(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const updatedUser = { ...currentUser };
    
    // Update basic info
    updatedUser.firstName = formData.get('firstName');
    updatedUser.lastName = formData.get('lastName');
    updatedUser.email = formData.get('email');
    updatedUser.phone = formData.get('phone');
    updatedUser.address = formData.get('address');
    
    // Update preferences
    updatedUser.preferences = {
        emailNotifications: formData.get('emailNotifications') === 'on',
        smsNotifications: formData.get('smsNotifications') === 'on',
        marketingEmails: formData.get('marketingEmails') === 'on'
    };
    
    // Validate email
    if (!validateEmail(updatedUser.email)) {
        showNotification('Please enter a valid email address.', 'error');
        return;
    }
    
    // Validate phone
    if (!validatePhone(updatedUser.phone)) {
        showNotification('Please enter a valid phone number.', 'error');
        return;
    }
    
    // Update in users list
    let users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    
    if (userIndex !== -1) {
        users[userIndex] = updatedUser;
        localStorage.setItem('users', JSON.stringify(users));
    }
    
    // Update current user
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    currentUser = updatedUser;
    
    // Update interface
    loadUserData();
    
    showNotification('Profile updated successfully!', 'success');
}

// Reset profile form
function resetProfileForm() {
    loadProfileForm();
    showNotification('Profile form reset.', 'info');
}

// Booking actions
function viewBookingDetails(bookingId) {
    const booking = userBookings.find(b => b.id === bookingId);
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
    
    const details = `
Booking Details:

ID: ${booking.id}
Service: ${serviceNames[booking.serviceType] || booking.serviceType}
Property Type: ${booking.propertyType || 'N/A'}
Location: ${booking.projectLocation}
Area: ${booking.projectArea || 'N/A'} sq ft
Budget: ${budgetRanges[booking.budgetRange] || booking.budgetRange || 'N/A'}
Inspection Date: ${new Date(booking.inspectionDate).toLocaleDateString()}
Time Slot: ${booking.timeSlot}
Contact Phone: ${booking.contactPhone}
Status: ${booking.status}
Description: ${booking.problemDescription || 'N/A'}
Submitted: ${new Date(booking.submissionDate).toLocaleDateString()}
    `;
    
    alert(details);
}

function rescheduleBooking(bookingId) {
    const booking = userBookings.find(b => b.id === bookingId);
    if (!booking) return;
    
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDate = tomorrow.toISOString().split('T')[0];
    
    const newDate = prompt(`Current date: ${booking.inspectionDate}\nEnter new date (YYYY-MM-DD, minimum ${minDate}):`);
    
    if (newDate && new Date(newDate) > today) {
        // Update booking in localStorage
        let bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
        const bookingIndex = bookings.findIndex(b => b.id === bookingId);
        
        if (bookingIndex !== -1) {
            bookings[bookingIndex].inspectionDate = newDate;
            localStorage.setItem('bookings', JSON.stringify(bookings));
            loadBookings();
            showNotification('Booking rescheduled successfully!', 'success');
        }
    } else if (newDate) {
        showNotification('Please enter a valid future date.', 'error');
    }
}

function cancelBooking(bookingId) {
    if (confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
        // Update booking status in localStorage
        let bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
        const bookingIndex = bookings.findIndex(b => b.id === bookingId);
        
        if (bookingIndex !== -1) {
            bookings[bookingIndex].status = 'cancelled';
            bookings[bookingIndex].cancelledAt = new Date().toISOString();
            localStorage.setItem('bookings', JSON.stringify(bookings));
            loadBookings();
            updateStats();
            showNotification('Booking cancelled successfully.', 'info');
        }
    }
}

function leaveReview(bookingId) {
    const booking = userBookings.find(b => b.id === bookingId);
    if (!booking) return;
    
    const rating = prompt('Rate our service (1-5 stars):');
    
    if (rating && rating >= 1 && rating <= 5) {
        const comment = prompt('Leave a comment (optional):') || '';
        
        // Save review
        const review = {
            id: 'REV' + Date.now(),
            bookingId: bookingId,
            userId: currentUser.id,
            userName: `${currentUser.firstName} ${currentUser.lastName}`,
            serviceType: booking.serviceType,
            rating: parseInt(rating),
            comment: comment,
            date: new Date().toISOString()
        };
        
        let reviews = JSON.parse(localStorage.getItem('reviews') || '[]');
        reviews.push(review);
        localStorage.setItem('reviews', JSON.stringify(reviews));
        
        // Mark booking as reviewed
        let bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
        const bookingIndex = bookings.findIndex(b => b.id === bookingId);
        if (bookingIndex !== -1) {
            bookings[bookingIndex].reviewed = true;
            localStorage.setItem('bookings', JSON.stringify(bookings));
            loadBookings();
        }
        
        showNotification('Thank you for your review!', 'success');
    } else if (rating) {
        showNotification('Please enter a rating between 1 and 5.', 'error');
    }
}

// Quote management
function requestNewQuote() {
    showModal('requestQuoteModal');
}

function submitQuoteRequest() {
    const serviceType = document.getElementById('quoteServiceType').value;
    const location = document.getElementById('quoteLocation').value;
    const description = document.getElementById('quoteDescription').value;
    
    if (!serviceType || !location || !description) {
        showNotification('Please fill in all fields.', 'error');
        return;
    }
    
    const quote = {
        id: 'QT' + Date.now(),
        userId: currentUser.id,
        userEmail: currentUser.email,
        userName: `${currentUser.firstName} ${currentUser.lastName}`,
        serviceType: serviceType,
        location: location,
        description: description,
        status: 'pending',
        createdAt: new Date().toISOString()
    };
    
    let quotes = JSON.parse(localStorage.getItem('quotes') || '[]');
    quotes.push(quote);
    localStorage.setItem('quotes', JSON.stringify(quotes));
    
    closeModal('requestQuoteModal');
    loadQuotes();
    showNotification('Quote request submitted successfully! We will contact you within 24 hours.', 'success');
    
    // Clear form
    document.getElementById('quoteRequestForm').reset();
}

// Modal functions
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

function showChangePasswordModal() {
    showModal('changePasswordModal');
}

function showDeleteAccountModal() {
    showModal('deleteAccountModal');
}

// Account actions
function changePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;
    
    if (!currentPassword || !newPassword || !confirmNewPassword) {
        showNotification('Please fill in all fields.', 'error');
        return;
    }
    
    if (currentPassword !== currentUser.password) {
        showNotification('Current password is incorrect.', 'error');
        return;
    }
    
    if (newPassword !== confirmNewPassword) {
        showNotification('New passwords do not match.', 'error');
        return;
    }
    
    if (newPassword.length < 8) {
        showNotification('Password must be at least 8 characters long.', 'error');
        return;
    }
    
    // Update password
    let users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    
    if (userIndex !== -1) {
        users[userIndex].password = newPassword;
        localStorage.setItem('users', JSON.stringify(users));
        
        currentUser.password = newPassword;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        closeModal('changePasswordModal');
        showNotification('Password changed successfully!', 'success');
        
        // Clear form
        document.getElementById('changePasswordForm').reset();
    }
}

function deleteAccount() {
    const password = document.getElementById('deleteAccountPassword').value;
    
    if (!password) {
        showNotification('Please enter your password.', 'error');
        return;
    }
    
    if (password !== currentUser.password) {
        showNotification('Password is incorrect.', 'error');
        return;
    }
    
    if (confirm('This action cannot be undone. Are you absolutely sure you want to delete your account?')) {
        // Remove user from users list
        let users = JSON.parse(localStorage.getItem('users') || '[]');
        users = users.filter(u => u.id !== currentUser.id);
        localStorage.setItem('users', JSON.stringify(users));
        
        // Remove user bookings
        let bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
        bookings = bookings.filter(b => b.userId !== currentUser.id);
        localStorage.setItem('bookings', JSON.stringify(bookings));
        
        // Remove user quotes
        let quotes = JSON.parse(localStorage.getItem('quotes') || '[]');
        quotes = quotes.filter(q => q.userId !== currentUser.id);
        localStorage.setItem('quotes', JSON.stringify(quotes));
        
        // Remove user reviews
        let reviews = JSON.parse(localStorage.getItem('reviews') || '[]');
        reviews = reviews.filter(r => r.userId !== currentUser.id);
        localStorage.setItem('reviews', JSON.stringify(reviews));
        
        // Remove current user session
        localStorage.removeItem('currentUser');
        
        // Redirect to home
        alert('Your account has been deleted successfully.');
        window.location.href = '../index.html';
    }
}

// FAQ functions
function toggleFaq(questionElement) {
    const faqItem = questionElement.closest('.faq-item');
    const isActive = faqItem.classList.contains('active');
    
    // Close all FAQ items
    document.querySelectorAll('.faq-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Toggle current item
    if (!isActive) {
        faqItem.classList.add('active');
    }
}

// Utility functions
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePhone(phone) {
    const re = /^(\+94|0)?[7][0-9]{8}$/;
    return re.test(phone.replace(/\s/g, ''));
}

function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notif => notif.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const iconMap = {
        'success': 'check-circle',
        'error': 'exclamation-circle',
        'warning': 'exclamation-triangle',
        'info': 'info-circle'
    };
    
    const colorMap = {
        'success': { bg: '#d4edda', border: '#c3e6cb', text: '#155724' },
        'error': { bg: '#f8d7da', border: '#f5c6cb', text: '#721c24' },
        'warning': { bg: '#fff3cd', border: '#ffeaa7', text: '#856404' },
        'info': { bg: '#d1ecf1', border: '#bee5eb', text: '#0c5460' }
    };
    
    notification.innerHTML = `
        <i class="fas fa-${iconMap[type]}"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add styles
    const colors = colorMap[type];
    notification.style.cssText = `
        position: fixed;
        top: 20px;
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
    
    // Style the close button
    const closeBtn = notification.querySelector('button');
    closeBtn.style.cssText = `
        background: none;
        border: none;
        cursor: pointer;
        font-size: 1rem;
        color: inherit;
        margin-left: auto;
        padding: 5px;
        border-radius: 3px;
        transition: background 0.3s ease;
    `;
    
    closeBtn.addEventListener('mouseenter', function() {
        this.style.background = 'rgba(0,0,0,0.1)';
    });
    
    closeBtn.addEventListener('mouseleave', function() {
        this.style.background = 'none';
    });
    
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
        sessionStorage.clear(); // Clear any session data
        window.location.href = '../index.html';
    }
}

// Add notification and other animations
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
    
    .booking-description {
        margin: 15px 0;
        padding: 10px;
        background: #f8f9fa;
        border-radius: 5px;
        font-size: 0.9rem;
        color: #666;
    }
    
    .quote-card {
        background: white;
        border-radius: 10px;
        padding: 20px;
        margin-bottom: 15px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        border-left: 4px solid #007bff;
        transition: all 0.3s ease;
    }
    
    .quote-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 20px rgba(0,0,0,0.15);
    }
    
    .quote-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 10px;
        flex-wrap: wrap;
        gap: 10px;
    }
    
    .quote-header h4 {
        margin: 0;
        color: #333;
        font-size: 1.1rem;
    }
    
    .quote-status {
        padding: 4px 8px;
        border-radius: 15px;
        font-size: 0.75rem;
        font-weight: 600;
    }
    
    .quote-description {
        color: #666;
        margin: 10px 0;
        line-height: 1.5;
    }
    
    .quote-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 15px;
        font-size: 0.85rem;
        color: #999;
        flex-wrap: wrap;
        gap: 10px;
    }
    
    .quote-id {
        font-family: monospace;
        background: #f8f9fa;
        padding: 2px 6px;
        border-radius: 3px;
    }
`;
document.head.appendChild(style);

// Handle browser back/forward
window.addEventListener('popstate', function(e) {
    const hash = window.location.hash.substring(1) || 'dashboard';
    if (document.getElementById(hash)) {
        showSection(hash);
    }
});

// Refresh data periodically
setInterval(() => {
    if (document.visibilityState === 'visible') {
        loadBookings();
        loadQuotes();
        updateStats();
    }
}, 30000); // Refresh every 30 seconds when tab is active

// Handle visibility change
document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') {
        // Refresh data when user returns to tab
        loadDashboardData();
    }
});

// Initialize tooltips and help text
function initializeHelpers() {
    // Add hover effects for stat cards
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
}

// Enhanced search functionality (for future implementation)
function initializeSearch() {
    // Placeholder for search functionality
    // Can be implemented to search through bookings, quotes, etc.
}

// Data export functionality
function exportBookingData() {
    const data = {
        user: {
            name: `${currentUser.firstName} ${currentUser.lastName}`,
            email: currentUser.email
        },
        bookings: userBookings,
        quotes: userQuotes,
        exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sealtech-data-${currentUser.id}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Data exported successfully!', 'success');
}

// Print booking details
function printBookingDetails(bookingId) {
    const booking = userBookings.find(b => b.id === bookingId);
    if (!booking) return;
    
    const printWindow = window.open('', '_blank');
    const serviceNames = {
        'roof': 'Roof Waterproofing',
        'wall': 'Wall Waterproofing',
        'foundation': 'Foundation Waterproofing',
        'bathroom': 'Bathroom Waterproofing',
        'basement': 'Basement Waterproofing',
        'commercial': 'Commercial Waterproofing'
    };
    
    printWindow.document.write(`
        <html>
        <head>
            <title>Booking Details - ${booking.id}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .detail { margin: 10px 0; }
                .label { font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>SealTech Engineering</h1>
                <h2>Booking Details</h2>
            </div>
            <div class="detail"><span class="label">Booking ID:</span> ${booking.id}</div>
            <div class="detail"><span class="label">Service:</span> ${serviceNames[booking.serviceType]}</div>
            <div class="detail"><span class="label">Customer:</span> ${currentUser.firstName} ${currentUser.lastName}</div>
            <div class="detail"><span class="label">Location:</span> ${booking.projectLocation}</div>
            <div class="detail"><span class="label">Date:</span> ${new Date(booking.inspectionDate).toLocaleDateString()}</div>
            <div class="detail"><span class="label">Time:</span> ${booking.timeSlot}</div>
            <div class="detail"><span class="label">Phone:</span> ${booking.contactPhone}</div>
            <div class="detail"><span class="label">Status:</span> ${booking.status}</div>
            <div class="detail"><span class="label">Description:</span> ${booking.problemDescription || 'N/A'}</div>
            <div class="detail"><span class="label">Submitted:</span> ${new Date(booking.submissionDate).toLocaleDateString()}</div>
        </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
}

// Initialize all helpers when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initializeHelpers();
    initializeSearch();
});

// Performance monitoring
const performanceMonitor = {
    startTime: Date.now(),
    
    logLoadTime: function() {
        const loadTime = Date.now() - this.startTime;
        console.log(`Dashboard loaded in ${loadTime}ms`);
        
        if (loadTime > 3000) {
            console.warn('Dashboard took longer than expected to load');
        }
    }
};

window.addEventListener('load', function() {
    performanceMonitor.logLoadTime();
});