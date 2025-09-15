// Updated Contact Form JavaScript with Authentication
// File: js/contact.js

// Form animations and interactions
const formInputs = document.querySelectorAll('.form-group input, .form-group textarea, .form-group select');

formInputs.forEach(input => {
    // Handle floating labels
    input.addEventListener('input', () => {
        const label = input.nextElementSibling;
        if (input.value.trim() !== '') {
            label.classList.add('active');
        } else {
            label.classList.remove('active');
        }
    });

    // Add focus effects
    input.addEventListener('focus', () => {
        input.parentElement.style.transform = 'scale(1.02)';
    });

    input.addEventListener('blur', () => {
        input.parentElement.style.transform = 'scale(1)';
    });
});

// Form submission with authentication check
const contactForm = document.getElementById('contactForm');

if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
        e.preventDefault();

        // Check if user is logged in
        if (!window.sessionManager || !window.sessionManager.isLoggedIn) {
            alert('You must be logged in to send a message. Redirecting to login page...');
            window.sessionManager.requireLogin();
            return;
        }

        // Basic form validation
        const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'serviceType', 'message'];
        let isValid = true;

        requiredFields.forEach(fieldName => {
            const field = document.getElementById(fieldName);
            if (!field.value.trim()) {
                isValid = false;
                field.style.borderColor = '#ff6b6b';
                setTimeout(() => {
                    field.style.borderColor = '#e9ecef';
                }, 3000);
            }
        });

        if (isValid) {
            // Add user information to form data
            const formData = new FormData(this);
            formData.append('user_id', window.sessionManager.currentUser.id);
            formData.append('user_name', window.sessionManager.currentUser.name);

            // Show loading state
            const submitBtn = document.querySelector('.submit-btn');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            submitBtn.disabled = true;

            // Submit form via AJAX
            fetch('submit_form.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Show success message
                    submitBtn.innerHTML = '<i class="fas fa-check"></i> Message Sent!';
                    submitBtn.style.background = '#28a745';
                    
                    // Show success alert
                    showAlert(data.message || 'Thank you for your inquiry! We will contact you within 24 hours.', 'success');
                    
                    // Reset form after delay
                    setTimeout(() => {
                        submitBtn.innerHTML = originalText;
                        submitBtn.style.background = 'linear-gradient(45deg, #007bff, #0056b3)';
                        submitBtn.disabled = false;
                        contactForm.reset();
                    }, 3000);
                } else {
                    throw new Error(data.error || 'Failed to send message');
                }
            })
            .catch(error => {
                console.error('Form submission error:', error);
                showAlert('Failed to send message. Please try again or contact us directly.', 'error');
                
                // Reset button
                submitBtn.innerHTML = originalText;
                submitBtn.style.background = 'linear-gradient(45deg, #007bff, #0056b3)';
                submitBtn.disabled = false;
            });
        } else {
            // Show error message
            showAlert('Please fill in all required fields.', 'error');
        }
    });
}

// Alert function for user feedback
function showAlert(message, type) {
    // Remove existing alerts
    const existingAlert = document.querySelector('.form-alert');
    if (existingAlert) {
        existingAlert.remove();
    }

    // Create new alert
    const alert = document.createElement('div');
    alert.className = `form-alert alert-${type}`;
    alert.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
        <button class="alert-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;

    // Insert alert before the form
    const formSection = document.querySelector('.contact-form-section');
    if (formSection) {
        formSection.insertBefore(alert, formSection.firstChild);
    }

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (alert.parentNode) {
            alert.remove();
        }
    }, 5000);
}

// Intersection Observer for fade-in animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

// Observe fade-in elements
document.querySelectorAll('.fade-in').forEach(el => {
    observer.observe(el);
});

// Method cards hover effect
const methodCards = document.querySelectorAll('.method-card');

methodCards.forEach(card => {
    card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-15px) scale(1.02)';
    });

    card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0) scale(1)';
    });
});

// Contact detail click handling with authentication check
document.querySelectorAll('.contact-detail').forEach(link => {
    link.addEventListener('click', (e) => {
        // Check if user is logged in
        if (!window.sessionManager || !window.sessionManager.isLoggedIn) {
            e.preventDefault();
            alert('You must be logged in to view contact details. Redirecting to login page...');
            window.sessionManager.requireLogin();
            return;
        }
        
        // You can add analytics tracking here
        console.log('Contact method used:', link.textContent);
    });
});

// Protect emergency contact section
document.addEventListener('DOMContentLoaded', function() {
    const emergencyContact = document.querySelector('.emergency-contact');
    if (emergencyContact && window.sessionManager && !window.sessionManager.isLoggedIn) {
        emergencyContact.style.display = 'none';
    }
});