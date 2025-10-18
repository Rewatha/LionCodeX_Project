// Updated Contact Form JavaScript with Authentication
// File: js/contact.js

(function() {
    'use strict';
    
    console.log('Contact.js loaded');
    
    // Wait for DOM and session manager
    document.addEventListener('DOMContentLoaded', function() {
        initContactForm();
        initFormAnimations();
        initMethodCards();
    });
    
    // Form animations and interactions
    function initFormAnimations() {
        const formInputs = document.querySelectorAll('.form-group input, .form-group textarea, .form-group select');
        
        formInputs.forEach(input => {
            // Handle floating labels
            input.addEventListener('input', () => {
                const label = input.nextElementSibling;
                if (label && label.tagName === 'LABEL') {
                    if (input.value.trim() !== '') {
                        label.classList.add('active');
                    } else {
                        label.classList.remove('active');
                    }
                }
            });
            
            // Add focus effects
            input.addEventListener('focus', () => {
                if (input.parentElement) {
                    input.parentElement.style.transform = 'scale(1.02)';
                }
            });
            
            input.addEventListener('blur', () => {
                if (input.parentElement) {
                    input.parentElement.style.transform = 'scale(1)';
                }
            });
        });
    }
    
    // Initialize contact form submission
    function initContactForm() {
        const contactForm = document.getElementById('contactForm');
        
        if (!contactForm) {
            console.log('Contact form not found');
            return;
        }
        
        console.log('Contact form found, attaching handler');
        
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            console.log('Contact form submitted');
            
            // Check if user is logged in
            if (!window.sessionManager || !window.sessionManager.isLoggedIn) {
                alert('❌ You must be logged in to send a message.\n\nRedirecting to login page...');
                if (window.sessionManager && window.sessionManager.requireLogin) {
                    window.sessionManager.requireLogin();
                } else {
                    window.location.href = 'auth.html';
                }
                return;
            }
            
            // Basic form validation
            const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'serviceType', 'message'];
            let isValid = true;
            let invalidFields = [];
            
            requiredFields.forEach(fieldName => {
                const field = document.getElementById(fieldName);
                if (field && !field.value.trim()) {
                    isValid = false;
                    invalidFields.push(fieldName);
                    field.style.borderColor = '#ff6b6b';
                    setTimeout(() => {
                        field.style.borderColor = '#e9ecef';
                    }, 3000);
                }
            });
            
            if (!isValid) {
                showAlert('Please fill in all required fields: ' + invalidFields.join(', '), 'error');
                return;
            }
            
            // Prepare form data
            const formData = new FormData(this);
            
            // Add user information
            if (window.sessionManager && window.sessionManager.currentUser) {
                formData.append('user_id', window.sessionManager.currentUser.id);
                formData.append('user_name', window.sessionManager.currentUser.name || 'User');
            }
            
            // Show loading state
            const submitBtn = this.querySelector('.submit-btn');
            const originalHTML = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            submitBtn.disabled = true;
            
            console.log('Sending form to backend...');
            
            // Submit form via AJAX
            fetch('../backend/submit_form.php', {
                method: 'POST',
                body: formData
            })
            .then(response => {
                console.log('Response status:', response.status);
                if (!response.ok) {
                    throw new Error('Server responded with status: ' + response.status);
                }
                return response.json();
            })
            .then(data => {
                console.log('Response data:', data);
                
                if (data.success) {
                    // Show success message
                    submitBtn.innerHTML = '<i class="fas fa-check"></i> Message Sent!';
                    submitBtn.style.background = '#28a745';
                    
                    // Show success alert
                    showAlert(data.message || 'Thank you for your inquiry! We will contact you within 24 hours.', 'success');
                    
                    // Reset form after delay
                    setTimeout(() => {
                        submitBtn.innerHTML = originalHTML;
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
                showAlert('Failed to send message: ' + error.message + '\n\nPlease try again or contact us directly.', 'error');
                
                // Reset button
                submitBtn.innerHTML = originalHTML;
                submitBtn.style.background = 'linear-gradient(45deg, #007bff, #0056b3)';
                submitBtn.disabled = false;
            });
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
            <button class="form-alert-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Insert alert at top of form section
        const formSection = document.querySelector('.contact-form-section .container');
        if (formSection) {
            formSection.insertBefore(alert, formSection.firstChild);
            
            // Scroll to alert
            alert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, 5000);
    }
    
    // Intersection Observer for fade-in animations
    function initIntersectionObserver() {
        const contactObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });
        
        // Observe fade-in elements
        document.querySelectorAll('.fade-in').forEach(el => {
            contactObserver.observe(el);
        });
    }
    
    // Method cards hover effect
    function initMethodCards() {
        const methodCards = document.querySelectorAll('.method-card');
        
        methodCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-15px) scale(1.02)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0) scale(1)';
            });
        });
    }
    
    // Initialize everything when session manager is ready
    setTimeout(() => {
        initIntersectionObserver();
    }, 100);
    
})();