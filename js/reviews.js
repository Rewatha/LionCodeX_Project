// Global variables
let allReviews = [];
let filteredReviews = [];
let currentFilter = 'all';
let currentSort = 'newest';
let reviewsPerPage = 10;
let currentPage = 1;
let currentRating = 0;

// Sample reviews data (replace with API calls in production)
const sampleReviews = [
    {
        id: 1,
        name: "Rajesh Patel",
        email: "rajesh@example.com",
        service: "roof",
        rating: 5,
        title: "Exceptional Roof Waterproofing Service",
        content: "SealTech Engineering provided outstanding roof waterproofing for our home. The team was professional, punctual, and delivered quality work. Our roof has been completely leak-free even during heavy monsoon rains. Highly recommend their services!",
        date: "2024-01-15",
        helpful: 12,
        recommend: true,
        verified: true,
        images: []
    },
    {
        id: 2,
        name: "Priya Fernando",
        email: "priya@example.com",
        service: "bathroom",
        rating: 5,
        title: "Perfect Bathroom Waterproofing",
        content: "Had my bathroom waterproofed by SealTech and couldn't be happier. No more moisture issues or tile problems. The work was completed on schedule and within budget. Great customer service throughout the project.",
        date: "2024-01-10",
        helpful: 8,
        recommend: true,
        verified: true,
        images: []
    },
    {
        id: 3,
        name: "Kamal Silva",
        email: "kamal@example.com",
        service: "foundation",
        rating: 4,
        title: "Good Foundation Work",
        content: "Professional team that completed our foundation waterproofing efficiently. Minor delay in starting the project but they communicated well and delivered quality results. Would use their services again.",
        date: "2024-01-08",
        helpful: 5,
        recommend: true,
        verified: true,
        images: []
    },
    {
        id: 4,
        name: "Lisa Wong",
        email: "lisa@example.com",
        service: "wall",
        rating: 4,
        title: "Great Wall Waterproofing",
        content: "External wall waterproofing was done professionally. The team explained the process clearly and completed the work as promised. Very satisfied with the results and the warranty provided.",
        date: "2024-01-05",
        helpful: 7,
        recommend: true,
        verified: true,
        images: []
    },
    {
        id: 5,
        name: "David Perera",
        email: "david@example.com",
        service: "commercial",
        rating: 5,
        title: "Outstanding Commercial Project",
        content: "SealTech handled our large commercial waterproofing project with excellent professionalism. Met all deadlines, stayed within budget, and delivered superior quality work. Highly recommend for commercial projects.",
        date: "2024-01-03",
        helpful: 15,
        recommend: true,
        verified: true,
        images: []
    },
    {
        id: 6,
        name: "Sarah Ahmed",
        email: "sarah@example.com",
        service: "basement",
        rating: 5,
        title: "Basement Completely Dry Now",
        content: "Had persistent water seepage issues in our basement for years. SealTech's team identified the problem and provided a comprehensive solution. Our basement has been completely dry for months now. Excellent service!",
        date: "2023-12-28",
        helpful: 9,
        recommend: true,
        verified: true,
        images: []
    }
];

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    loadReviews();
    initializeEventListeners();
    updateReviewStats();
});

// Load and display reviews
function loadReviews() {
    // In production, this would be an API call
    allReviews = [...sampleReviews];
    filteredReviews = [...allReviews];
    sortReviews();
    displayReviews();
}

// Initialize event listeners
function initializeEventListeners() {
    // Filter buttons
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            filterButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.getAttribute('data-filter');
            filterReviews();
        });
    });

    // Sort dropdown
    const sortSelect = document.getElementById('sortReviews');
    sortSelect.addEventListener('change', function() {
        currentSort = this.value;
        sortReviews();
        displayReviews();
    });

    // Load more button
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    loadMoreBtn.addEventListener('click', loadMoreReviews);

    // Star rating in form
    initializeStarRating();

    // Character counter
    const reviewTextarea = document.getElementById('reviewText');
    if (reviewTextarea) {
        reviewTextarea.addEventListener('input', updateCharacterCount);
    }

    // Review form submission
    const reviewForm = document.getElementById('reviewForm');
    if (reviewForm) {
        reviewForm.addEventListener('submit', handleReviewSubmission);
    }
}

// Filter reviews based on selected criteria
function filterReviews() {
    switch (currentFilter) {
        case 'all':
            filteredReviews = [...allReviews];
            break;
        case '5':
        case '4':
        case '3':
        case '2':
        case '1':
            filteredReviews = allReviews.filter(review => review.rating === parseInt(currentFilter));
            break;
        case 'service':
            // Could add service-specific filtering here
            filteredReviews = [...allReviews];
            break;
        case 'recent':
            const lastMonth = new Date();
            lastMonth.setMonth(lastMonth.getMonth() - 1);
            filteredReviews = allReviews.filter(review => new Date(review.date) > lastMonth);
            break;
        default:
            filteredReviews = [...allReviews];
    }
    
    currentPage = 1;
    sortReviews();
    displayReviews();
}

// Sort reviews based on selected criteria
function sortReviews() {
    switch (currentSort) {
        case 'newest':
            filteredReviews.sort((a, b) => new Date(b.date) - new Date(a.date));
            break;
        case 'oldest':
            filteredReviews.sort((a, b) => new Date(a.date) - new Date(b.date));
            break;
        case 'highest':
            filteredReviews.sort((a, b) => b.rating - a.rating);
            break;
        case 'lowest':
            filteredReviews.sort((a, b) => a.rating - b.rating);
            break;
        case 'helpful':
            filteredReviews.sort((a, b) => b.helpful - a.helpful);
            break;
        default:
            filteredReviews.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
}

// Display reviews in the grid
function displayReviews() {
    const reviewsGrid = document.getElementById('reviewsGrid');
    const reviewsToShow = filteredReviews.slice(0, currentPage * reviewsPerPage);
    
    reviewsGrid.innerHTML = reviewsToShow.map(review => createReviewCard(review)).join('');
    
    // Update load more button visibility
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (reviewsToShow.length >= filteredReviews.length) {
        loadMoreBtn.style.display = 'none';
    } else {
        loadMoreBtn.style.display = 'block';
    }

    // Add event listeners to helpful buttons
    addHelpfulListeners();
}

// Create HTML for a review card
function createReviewCard(review) {
    const serviceNames = {
        'roof': 'Roof Waterproofing',
        'wall': 'Wall Waterproofing',
        'foundation': 'Foundation Waterproofing',
        'bathroom': 'Bathroom Waterproofing',
        'basement': 'Basement Waterproofing',
        'commercial': 'Commercial Waterproofing'
    };

    const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
    const initials = review.name.split(' ').map(n => n.charAt(0)).join('');
    const formattedDate = new Date(review.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return `
        <div class="review-card" data-review-id="${review.id}">
            <div class="review-header">
                <div class="reviewer-info">
                    <div class="reviewer-avatar">${initials}</div>
                    <div class="reviewer-details">
                        <h4>${review.name} ${review.verified ? '<i class="fas fa-check-circle" style="color: #28a745; font-size: 0.8rem;"></i>' : ''}</h4>
                        <div class="review-date">${formattedDate}</div>
                    </div>
                </div>
                <div class="review-service-badge">${serviceNames[review.service] || review.service}</div>
            </div>
            
            <div class="review-rating-display">
                <div class="review-stars">${stars}</div>
                <div class="review-score">${review.rating}.0</div>
            </div>
            
            <h3 class="review-title">${review.title}</h3>
            
            <div class="review-content">${review.content}</div>
            
            ${review.images && review.images.length > 0 ? `
                <div class="review-images">
                    ${review.images.map(img => `
                        <div class="review-image">
                            <img src="${img}" alt="Project photo" onclick="openImageModal('${img}')">
                        </div>
                    `).join('')}
                </div>
            ` : ''}
            
            <div class="review-footer">
                ${review.recommend ? `
                    <div class="review-recommendation">
                        <i class="fas fa-thumbs-up"></i>
                        Recommends SealTech Engineering
                    </div>
                ` : ''}
                
                <div class="review-helpful">
                    <button class="helpful-btn" onclick="markHelpful(${review.id})">
                        <i class="fas fa-thumbs-up"></i>
                        Helpful (${review.helpful})
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Load more reviews
function loadMoreReviews() {
    currentPage++;
    displayReviews();
}

// Mark review as helpful
function markHelpful(reviewId) {
    const review = allReviews.find(r => r.id === reviewId);
    if (review) {
        // Check if already marked helpful (in production, check backend)
        const alreadyMarked = localStorage.getItem(`helpful_${reviewId}`);
        
        if (!alreadyMarked) {
            review.helpful++;
            localStorage.setItem(`helpful_${reviewId}`, 'true');
            
            // Update display
            const helpfulBtn = document.querySelector(`[data-review-id="${reviewId}"] .helpful-btn`);
            if (helpfulBtn) {
                helpfulBtn.innerHTML = `<i class="fas fa-thumbs-up"></i> Helpful (${review.helpful})`;
                helpfulBtn.classList.add('active');
                helpfulBtn.disabled = true;
            }
            
            showAlert('Thank you for your feedback!', 'success');
        } else {
            showAlert('You have already marked this review as helpful.', 'info');
        }
    }
}

// Update review statistics
function updateReviewStats() {
    const totalReviews = allReviews.length;
    const averageRating = allReviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews;
    
    document.getElementById('totalReviews').textContent = totalReviews;
    document.getElementById('overallRating').textContent = averageRating.toFixed(1);
    
    // Update rating breakdown
    for (let i = 1; i <= 5; i++) {
        const count = allReviews.filter(review => review.rating === i).length;
        const percentage = (count / totalReviews) * 100;
        
        const ratingBarItems = document.querySelectorAll('.rating-bar-item');
        if (ratingBarItems[5 - i]) {
            const fill = ratingBarItems[5 - i].querySelector('.rating-fill');
            const percentageSpan = ratingBarItems[5 - i].querySelector('.rating-percentage');
            
            if (fill) fill.style.width = `${percentage}%`;
            if (percentageSpan) percentageSpan.textContent = `${Math.round(percentage)}%`;
        }
    }
}

// Show/hide review form modal
function showReviewForm() {
    document.getElementById('reviewModal').classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeReviewForm() {
    document.getElementById('reviewModal').classList.remove('show');
    document.body.style.overflow = 'auto';
    document.getElementById('reviewForm').reset();
    resetStarRating();
}

// Initialize star rating functionality
function initializeStarRating() {
    const stars = document.querySelectorAll('.star-rating i');
    const ratingInput = document.getElementById('ratingValue');
    
    stars.forEach((star, index) => {
        star.addEventListener('click', function() {
            currentRating = index + 1;
            ratingInput.value = currentRating;
            updateStarDisplay();
        });
        
        star.addEventListener('mouseover', function() {
            highlightStars(index + 1);
        });
    });
    
    document.querySelector('.star-rating').addEventListener('mouseleave', function() {
        updateStarDisplay();
    });
}

// Update star rating display
function updateStarDisplay() {
    const stars = document.querySelectorAll('.star-rating i');
    stars.forEach((star, index) => {
        if (index < currentRating) {
            star.classList.remove('far');
            star.classList.add('fas', 'active');
        } else {
            star.classList.remove('fas', 'active');
            star.classList.add('far');
        }
    });
}

// Highlight stars on hover
function highlightStars(rating) {
    const stars = document.querySelectorAll('.star-rating i');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.remove('far');
            star.classList.add('fas', 'active');
        } else {
            star.classList.remove('fas', 'active');
            star.classList.add('far');
        }
    });
}

// Reset star rating
function resetStarRating() {
    currentRating = 0;
    document.getElementById('ratingValue').value = '';
    updateStarDisplay();
}

// Update character count for review text
function updateCharacterCount() {
    const textarea = document.getElementById('reviewText');
    const counter = document.getElementById('charCount');
    const count = textarea.value.length;
    counter.textContent = count;
    
    if (count > 500) {
        counter.style.color = '#dc3545';
        textarea.value = textarea.value.substring(0, 500);
        counter.textContent = '500';
    } else {
        counter.style.color = '#666';
    }
}

// Handle review form submission
function handleReviewSubmission(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const reviewData = {
        id: Date.now(),
        name: formData.get('reviewerName'),
        email: formData.get('reviewerEmail'),
        service: formData.get('serviceType'),
        rating: parseInt(formData.get('rating')),
        title: formData.get('reviewTitle'),
        content: formData.get('reviewText'),
        date: new Date().toISOString().split('T')[0],
        helpful: 0,
        recommend: formData.get('recommend') === 'on',
        verified: false,
        images: []
    };
    
    // Validate required fields
    if (!reviewData.name || !reviewData.email || !reviewData.service || !reviewData.rating || !reviewData.title || !reviewData.content) {
        showAlert('Please fill in all required fields.', 'error');
        return;
    }
    
    if (reviewData.rating < 1 || reviewData.rating > 5) {
        showAlert('Please select a rating between 1 and 5 stars.', 'error');
        return;
    }
    
    // Handle file uploads (in production, upload to server)
    const fileInput = document.getElementById('projectPhotos');
    if (fileInput.files.length > 0) {
        // In production, upload files and get URLs
        reviewData.images = Array.from(fileInput.files).map(file => URL.createObjectURL(file));
    }
    
    // Submit review (in production, send to API)
    submitReview(reviewData);
}

// Submit review to backend (simulated)
function submitReview(reviewData) {
    // Simulate API call
    setTimeout(() => {
        // Add to reviews array
        allReviews.unshift(reviewData);
        
        // Update display
        updateReviewStats();
        filterReviews();
        
        // Close modal
        closeReviewForm();
        
        // Show success message
        showAlert('Thank you for your review! It will be published after moderation.', 'success');
        
        // In production, send to backend
        console.log('Review submitted:', reviewData);
    }, 1000);
}

// Add event listeners for helpful buttons
function addHelpfulListeners() {
    const helpfulBtns = document.querySelectorAll('.helpful-btn');
    helpfulBtns.forEach(btn => {
        const reviewId = parseInt(btn.getAttribute('onclick').match(/\d+/)[0]);
        const alreadyMarked = localStorage.getItem(`helpful_${reviewId}`);
        
        if (alreadyMarked) {
            btn.classList.add('active');
            btn.disabled = true;
        }
    });
}

// Show alert messages
function showAlert(message, type = 'info') {
    const alert = document.getElementById('alertMessage');
    alert.textContent = message;
    alert.className = `alert ${type} show`;
    
    setTimeout(() => {
        alert.classList.remove('show');
    }, 5000);
}

// Open image modal (for review images)
function openImageModal(imageSrc) {
    // Create and show image modal
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px;">
            <div class="modal-header">
                <h2>Project Photo</h2>
                <button class="modal-close" onclick="this.closest('.modal').remove(); document.body.style.overflow = 'auto';">&times;</button>
            </div>
            <div class="modal-body" style="text-align: center;">
                <img src="${imageSrc}" alt="Project photo" style="max-width: 100%; height: auto; border-radius: 8px;">
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    // Close on backdrop click
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
            document.body.style.overflow = 'auto';
        }
    });
}

// Close modal on escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const modals = document.querySelectorAll('.modal.show');
        modals.forEach(modal => {
            if (modal.id === 'reviewModal') {
                closeReviewForm();
            } else {
                modal.remove();
                document.body.style.overflow = 'auto';
            }
        });
    }
});