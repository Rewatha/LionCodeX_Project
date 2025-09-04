// Global variables
let currentStep = 1;
let bookingData = {};
let uploadedFiles = [];

// Authentication check
function checkAuthentication() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    const loginPrompt = document.getElementById('loginPrompt');
    const bookingFormContainer = document.getElementById('bookingFormContainer');
    const authLink = document.getElementById('authLink');

    if (!currentUser) {
        // Show login prompt
        loginPrompt.style.display = 'block';
        bookingFormContainer.style.display = 'none';
        return false;
    } else {
        // Show booking form
        loginPrompt.style.display = 'none';
        bookingFormContainer.style.display = 'block';
        authLink.textContent = 'Dashboard';
        authLink.href = 'user-dashboard.html';
        return true;
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    if (!checkAuthentication()) {
        return; // Exit if user not logged in
    }

    initializeFormElements();
    setMinDate();
    loadFormData();
});

// Initialize form elements
function initializeFormElements() {
    // Service selection
    initializeServiceSelection();
    
    // Budget selection
    initializeBudgetSelection();
    
    // File upload
    initializeFileUpload();
    
    // Time slot selection
    initializeTimeSlots();
    
    // Form validation
    initializeFormValidation();
}

// Service selection functionality
function initializeServiceSelection() {
    const serviceCards = document.querySelectorAll('.service-card');
    const selectedServiceInput = document.getElementById('selectedService');

    serviceCards.forEach(card => {
        card.addEventListener('click', function() {
            // Remove selection from all cards
            serviceCards.forEach(c => c.classList.remove('selected'));
            
            // Add selection to clicked card
            this.classList.add('selected');
            
            // Update hidden input
            const serviceType = this.getAttribute('data-service');
            selectedServiceInput.value = serviceType;
            bookingData.serviceType = serviceType;
            
            // Save form data
            saveFormData();
        });
    });
}

// Budget selection functionality
function initializeBudgetSelection() {
    const budgetCards = document.querySelectorAll('.budget-card');
    const selectedBudgetInput = document.getElementById('selectedBudget');

    budgetCards.forEach(card => {
        card.addEventListener('click', function() {
            // Remove selection from all cards
            budgetCards.forEach(c => c.classList.remove('selected'));
            
            // Add selection to clicked card
            this.classList.add('selected');
            
            // Update hidden input
            const budgetRange = this.getAttribute('data-budget');
            selectedBudgetInput.value = budgetRange;
            bookingData.budgetRange = budgetRange;
            
            // Save form data
            saveFormData();
        });
    });
}

// File upload functionality
function initializeFileUpload() {
    const fileUploadArea = document.getElementById('fileUploadArea');
    const fileInput = document.getElementById('projectImages');
    const uploadedImagesContainer = document.getElementById('uploadedImages');

    // Click to browse
    fileUploadArea.addEventListener('click', function() {
        fileInput.click();
    });

    // Drag and drop
    fileUploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.classList.add('dragover');
    });

    fileUploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        this.classList.remove('dragover');
    });

    fileUploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        this.classList.remove('dragover');
        
        const files = Array.from(e.dataTransfer.files);
        handleFileSelection(files);
    });

    // File input change
    fileInput.addEventListener('change', function(e) {
        const files = Array.from(e.target.files);
        handleFileSelection(files);
    });

    function handleFileSelection(files) {
        files.forEach(file => {
            if (file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024) { // 5MB limit
                uploadedFiles.push(file);
                displayUploadedImage(file);
            } else {
                alert('Please upload only image files under 5MB.');
            }
        });
        
        bookingData.images = uploadedFiles.length;
        saveFormData();
    }

    function displayUploadedImage(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const imagePreview = document.createElement('div');
            imagePreview.className = 'image-preview';
            imagePreview.innerHTML = `
                <img src="${e.target.result}" alt="Project Image">
                <button class="remove-image" onclick="removeImage(${uploadedFiles.length - 1})">
                    <i class="fas fa-times"></i>
                </button>
            `;
            uploadedImagesContainer.appendChild(imagePreview);
        };
        reader.readAsDataURL(file);
    }
}

// Remove uploaded image
function removeImage(index) {
    uploadedFiles.splice(index, 1);
    const uploadedImagesContainer = document.getElementById('uploadedImages');
    uploadedImagesContainer.children[index].remove();
    
    // Update indices for remaining remove buttons
    Array.from(uploadedImagesContainer.children).forEach((child, newIndex) => {
        const removeBtn = child.querySelector('.remove-image');
        removeBtn.setAttribute('onclick', `removeImage(${newIndex})`);
    });
    
    bookingData.images = uploadedFiles.length;
    saveFormData();
}

// Time slot selection
function initializeTimeSlots() {
    const timeSlots = document.querySelectorAll('.time-slot');
    const selectedTimeSlotInput = document.getElementById('selectedTimeSlot');

    timeSlots.forEach(slot => {
        slot.addEventListener('click', function() {
            // Remove selection from all slots
            timeSlots.forEach(s => s.classList.remove('selected'));
            
            // Add selection to clicked slot
            this.classList.add('selected');
            
            // Update hidden input
            const timeSlot = this.getAttribute('data-time');
            selectedTimeSlotInput.value = timeSlot;
            bookingData.timeSlot = timeSlot;
            
            // Save form data
            saveFormData();
        });
    });
}

// Set minimum date for inspection
function setMinDate() {
    const dateInput = document.getElementById('inspectionDate');
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    dateInput.min = tomorrow.toISOString().split('T')[0];
    
    // Set default to 3 days from now
    const defaultDate = new Date(today);
    defaultDate.setDate(defaultDate.getDate() + 3);
    dateInput.value = defaultDate.toISOString().split('T')[0];
}

// Form validation
function initializeFormValidation() {
    const inputs = document.querySelectorAll('input[required], textarea[required], select[required]');
    
    inputs.forEach(input => {
        input.addEventListener('blur', validateField);
        input.addEventListener('input', validateField);
    });
}

function validateField(e) {
    const field = e.target;
    const value = field.value.trim();
    
    // Remove previous error styling
    field.style.borderColor = '#e9ecef';
    
    if (field.hasAttribute('required') && !value) {
        field.style.borderColor = '#dc3545';
        return false;
    }
    
    // Email validation
    if (field.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            field.style.borderColor = '#dc3545';
            return false;
        }
    }
    
    // Phone validation
    if (field.type === 'tel' && value) {
        const phoneRegex = /^(\+94|0)?[7][0-9]{8}$/;
        if (!phoneRegex.test(value.replace(/\s/g, ''))) {
            field.style.borderColor = '#dc3545';
            return false;
        }
    }
    
    // Area validation
    if (field.id === 'projectArea' && value) {
        if (parseInt(value) < 1) {
            field.style.borderColor = '#dc3545';
            return false;
        }
    }
    
    // Date validation
    if (field.type === 'date' && value) {
        const selectedDate = new Date(value);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        if (selectedDate < tomorrow) {
            field.style.borderColor = '#dc3545';
            return false;
        }
    }
    
    field.style.borderColor = '#28a745';
    return true;
}

// Step navigation
function nextStep() {
    if (validateCurrentStep()) {
        collectCurrentStepData();
        
        if (currentStep < 3) {
            // Hide current step
            document.getElementById(`step${currentStep}`).classList.remove('active');
            
            // Update progress
            document.querySelector(`[data-step="${currentStep}"]`).classList.add('completed');
            
            currentStep++;
            
            // Show next step
            document.getElementById(`step${currentStep}`).classList.add('active');
            document.querySelector(`[data-step="${currentStep}"]`).classList.add('active');
            
            if (currentStep === 3) {
                updateBookingSummary();
            }
            
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            // Update navigation buttons
            updateNavigationButtons();
        }
    }
}

function prevStep() {
    if (currentStep > 1) {
        // Hide current step
        document.getElementById(`step${currentStep}`).classList.remove('active');
        document.querySelector(`[data-step="${currentStep}"]`).classList.remove('active');
        
        currentStep--;
        
        // Show previous step
        document.getElementById(`step${currentStep}`).classList.add('active');
        document.querySelector(`[data-step="${currentStep}"]`).classList.add('active');
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Update navigation buttons
        updateNavigationButtons();
    }
}

function updateNavigationButtons() {
    const prevButtons = document.querySelectorAll('.btn-secondary');
    const nextButtons = document.querySelectorAll('.btn-primary');
    
    prevButtons.forEach(btn => {
        btn.disabled = currentStep === 1;
    });
}

// Validate current step
function validateCurrentStep() {
    let isValid = true;
    
    switch (currentStep) {
        case 1:
            // Check service selection
            if (!document.getElementById('selectedService').value) {
                alert('Please select a service type.');
                return false;
            }
            
            // Check required fields in step 1
            const step1Inputs = document.getElementById('step1').querySelectorAll('input[required], textarea[required], select[required]');
            step1Inputs.forEach(input => {
                if (!validateField({ target: input })) {
                    isValid = false;
                }
            });
            
            if (!isValid) {
                alert('Please fill in all required fields correctly.');
                return false;
            }
            break;
            
        case 2:
            // Check date selection
            const inspectionDate = document.getElementById('inspectionDate').value;
            if (!inspectionDate) {
                alert('Please select an inspection date.');
                return false;
            }
            
            // Check time slot selection
            if (!document.getElementById('selectedTimeSlot').value) {
                alert('Please select a preferred time slot.');
                return false;
            }
            
            // Check required fields in step 2
            const step2Inputs = document.getElementById('step2').querySelectorAll('input[required], textarea[required], select[required]');
            step2Inputs.forEach(input => {
                if (!validateField({ target: input })) {
                    isValid = false;
                }
            });
            
            if (!isValid) {
                alert('Please fill in all required fields correctly.');
                return false;
            }
            break;
            
        case 3:
            // Check terms agreement
            if (!document.getElementById('agreeTerms').checked) {
                alert('Please agree to the terms and conditions.');
                return false;
            }
            break;
    }
    
    return true;
}

// Collect data from current step
function collectCurrentStepData() {
    const currentStepElement = document.getElementById(`step${currentStep}`);
    const inputs = currentStepElement.querySelectorAll('input, textarea, select');
    
    inputs.forEach(input => {
        if (input.type === 'checkbox') {
            bookingData[input.name || input.id] = input.checked;
        } else if (input.type !== 'hidden') {
            bookingData[input.name || input.id] = input.value;
        }
    });
    
    // Add hidden field values
    if (currentStep === 1) {
        bookingData.serviceType = document.getElementById('selectedService').value;
        bookingData.budgetRange = document.getElementById('selectedBudget').value;
    }
    
    if (currentStep === 2) {
        bookingData.timeSlot = document.getElementById('selectedTimeSlot').value;
    }
    
    saveFormData();
}

// Update booking summary
function updateBookingSummary() {
    // Service details
    const serviceTypes = {
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
    
    document.getElementById('summaryService').textContent = serviceTypes[bookingData.serviceType] || '-';
    document.getElementById('summaryPropertyType').textContent = bookingData.propertyType || '-';
    document.getElementById('summaryArea').textContent = bookingData.projectArea ? `${bookingData.projectArea} sq ft` : '-';
    document.getElementById('summaryBudget').textContent = budgetRanges[bookingData.budgetRange] || '-';
    document.getElementById('summaryDate').textContent = bookingData.inspectionDate ? formatDate(bookingData.inspectionDate) : '-';
    document.getElementById('summaryTime').textContent = timeSlotLabels[bookingData.timeSlot] || '-';
    document.getElementById('summaryPhone').textContent = bookingData.contactPhone || '-';
    document.getElementById('summaryLocation').textContent = bookingData.projectLocation || '-';
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Submit booking
function submitBooking() {
    if (!validateCurrentStep()) {
        return;
    }
    
    // Collect final step data
    collectCurrentStepData();
    
    // Show loading state
    const submitBtn = document.querySelector('#step3 .btn-primary');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Submitting...';
    submitBtn.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
        const bookingReference = generateBookingReference();
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        
        // Create booking object
        const booking = {
            id: bookingReference,
            userId: currentUser.id,
            userEmail: currentUser.email,
            userName: `${currentUser.firstName} ${currentUser.lastName}`,
            ...bookingData,
            submissionDate: new Date().toISOString(),
            status: 'pending',
            images: uploadedFiles.length
        };
        
        // Save booking
        saveBooking(booking);
        
        // Show success modal
        showSuccessModal(bookingReference);
        
        // Reset form
        resetForm();
        
        // Reset button
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        
    }, 2000);
}

// Generate booking reference
function generateBookingReference() {
    const prefix = 'ST';
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}${timestamp}${random}`;
}

// Save booking to localStorage (simulate database)
function saveBooking(booking) {
    let bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    bookings.push(booking);
    localStorage.setItem('bookings', JSON.stringify(bookings));
}

// Show success modal
function showSuccessModal(bookingReference) {
    const modal = document.getElementById('successModal');
    const bookingRefElement = document.getElementById('bookingReference');
    
    bookingRefElement.textContent = bookingReference;
    modal.classList.add('show');
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
}

// Close success modal
function closeSuccessModal() {
    const modal = document.getElementById('successModal');
    modal.classList.remove('show');
    
    // Restore body scroll
    document.body.style.overflow = 'auto';
    
    // Redirect to dashboard or home
    window.location.href = 'user-dashboard.html';
}

// Reset form
function resetForm() {
    currentStep = 1;
    bookingData = {};
    uploadedFiles = [];
    
    // Clear form inputs
    document.getElementById('bookingForm').reset();
    
    // Clear selections
    document.querySelectorAll('.selected').forEach(el => {
        el.classList.remove('selected');
    });
    
    // Clear uploaded images
    document.getElementById('uploadedImages').innerHTML = '';
    
    // Reset hidden inputs
    document.getElementById('selectedService').value = '';
    document.getElementById('selectedBudget').value = '';
    document.getElementById('selectedTimeSlot').value = '';
    
    // Reset steps
    document.querySelectorAll('.form-step').forEach(step => {
        step.classList.remove('active');
    });
    document.getElementById('step1').classList.add('active');
    
    // Reset progress
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active', 'completed');
    });
    document.querySelector('[data-step="1"]').classList.add('active');
    
    // Clear saved form data
    sessionStorage.removeItem('bookingFormData');
}

// Save form data to session storage
function saveFormData() {
    sessionStorage.setItem('bookingFormData', JSON.stringify(bookingData));
}

// Load form data from session storage
function loadFormData() {
    const savedData = sessionStorage.getItem('bookingFormData');
    if (savedData) {
        bookingData = JSON.parse(savedData);
        
        // Restore form values
        Object.keys(bookingData).forEach(key => {
            const element = document.getElementById(key) || document.querySelector(`[name="${key}"]`);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = bookingData[key];
                } else {
                    element.value = bookingData[key];
                }
                
                // Trigger label animation for text inputs
                if (element.value && element.nextElementSibling && element.nextElementSibling.tagName === 'LABEL') {
                    element.nextElementSibling.style.top = '-10px';
                    element.nextElementSibling.style.fontSize = '0.85rem';
                    element.nextElementSibling.style.color = '#007bff';
                    element.nextElementSibling.style.background = 'white';
                }
            }
        });
        
        // Restore selections
        if (bookingData.serviceType) {
            const serviceCard = document.querySelector(`[data-service="${bookingData.serviceType}"]`);
            if (serviceCard) {
                serviceCard.classList.add('selected');
                document.getElementById('selectedService').value = bookingData.serviceType;
            }
        }
        
        if (bookingData.budgetRange) {
            const budgetCard = document.querySelector(`[data-budget="${bookingData.budgetRange}"]`);
            if (budgetCard) {
                budgetCard.classList.add('selected');
                document.getElementById('selectedBudget').value = bookingData.budgetRange;
            }
        }
        
        if (bookingData.timeSlot) {
            const timeSlot = document.querySelector(`[data-time="${bookingData.timeSlot}"]`);
            if (timeSlot) {
                timeSlot.classList.add('selected');
                document.getElementById('selectedTimeSlot').value = bookingData.timeSlot;
            }
        }
    }
}

// Auto-save form data on input
document.addEventListener('input', function(e) {
    if (e.target.form && e.target.form.id === 'bookingForm') {
        const key = e.target.name || e.target.id;
        if (key && key !== 'projectImages') {
            if (e.target.type === 'checkbox') {
                bookingData[key] = e.target.checked;
            } else {
                bookingData[key] = e.target.value;
            }
            saveFormData();
        }
    }
});

// Clear saved data on successful submission
window.addEventListener('beforeunload', function() {
    // Only clear if we're navigating away from the booking process
    if (!window.location.href.includes('booking.html')) {
        sessionStorage.removeItem('bookingFormData');
    }
});

// Handle browser back button
window.addEventListener('popstate', function(e) {
    if (currentStep > 1) {
        e.preventDefault();
        prevStep();
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + Enter to proceed to next step
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (currentStep < 3) {
            nextStep();
        } else {
            submitBooking();
        }
    }
    
    // Escape to go back
    if (e.key === 'Escape' && currentStep > 1) {
        e.preventDefault();
        prevStep();
    }
});

// Booking analytics and tracking
const bookingAnalytics = {
    trackStepCompletion: function(step) {
        // Track step completion for analytics
        console.log(`Step ${step} completed`);
        
        // In a real application, you would send this to your analytics service
        // analytics.track('Booking Step Completed', { step: step });
    },
    
    trackServiceSelection: function(serviceType) {
        console.log(`Service selected: ${serviceType}`);
        
        // Track popular services
        let serviceStats = JSON.parse(localStorage.getItem('serviceStats') || '{}');
        serviceStats[serviceType] = (serviceStats[serviceType] || 0) + 1;
        localStorage.setItem('serviceStats', JSON.stringify(serviceStats));
    },
    
    trackBudgetSelection: function(budgetRange) {
        console.log(`Budget selected: ${budgetRange}`);
        
        // Track budget preferences
        let budgetStats = JSON.parse(localStorage.getItem('budgetStats') || '{}');
        budgetStats[budgetRange] = (budgetStats[budgetRange] || 0) + 1;
        localStorage.setItem('budgetStats', JSON.stringify(budgetStats));
    }
};

// Enhanced service selection with analytics
function enhancedServiceSelection() {
    const serviceCards = document.querySelectorAll('.service-card');
    
    serviceCards.forEach(card => {
        card.addEventListener('click', function() {
            const serviceType = this.getAttribute('data-service');
            bookingAnalytics.trackServiceSelection(serviceType);
        });
    });
}

// Enhanced budget selection with analytics
function enhancedBudgetSelection() {
    const budgetCards = document.querySelectorAll('.budget-card');
    
    budgetCards.forEach(card => {
        card.addEventListener('click', function() {
            const budgetRange = this.getAttribute('data-budget');
            bookingAnalytics.trackBudgetSelection(budgetRange);
        });
    });
}

// Initialize enhanced features
document.addEventListener('DOMContentLoaded', function() {
    enhancedServiceSelection();
    enhancedBudgetSelection();
});

// Form completion tracking
const originalNextStep = nextStep;
nextStep = function() {
    if (validateCurrentStep()) {
        bookingAnalytics.trackStepCompletion(currentStep);
        originalNextStep();
    }
};

// Error handling and user feedback
function showError(message) {
    // Create or update error notification
    let errorNotification = document.getElementById('errorNotification');
    
    if (!errorNotification) {
        errorNotification = document.createElement('div');
        errorNotification.id = 'errorNotification';
        errorNotification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #dc3545;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            z-index: 1001;
            max-width: 300px;
            animation: slideInRight 0.3s ease;
        `;
        document.body.appendChild(errorNotification);
    }
    
    errorNotification.textContent = message;
    errorNotification.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        if (errorNotification) {
            errorNotification.style.display = 'none';
        }
    }, 5000);
}

function showSuccess(message) {
    // Create or update success notification
    let successNotification = document.getElementById('successNotification');
    
    if (!successNotification) {
        successNotification = document.createElement('div');
        successNotification.id = 'successNotification';
        successNotification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            z-index: 1001;
            max-width: 300px;
            animation: slideInRight 0.3s ease;
        `;
        document.body.appendChild(successNotification);
    }
    
    successNotification.textContent = message;
    successNotification.style.display = 'block';
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        if (successNotification) {
            successNotification.style.display = 'none';
        }
    }, 3000);
}

// Add CSS animation for notifications
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
`;
document.head.appendChild(style);