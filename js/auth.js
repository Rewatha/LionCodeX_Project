// Form switching functionality
function switchForm(formType) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const toggleButtons = document.querySelectorAll('.toggle-btn');
    const slider = document.getElementById('toggleSlider');

    // Clear any alerts
    hideAlert();

    // Remove active class from all buttons
    toggleButtons.forEach(btn => btn.classList.remove('active'));

    if (formType === 'login') {
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
        toggleButtons[0].classList.add('active');
        slider.classList.remove('register');
    } else {
        registerForm.classList.add('active');
        loginForm.classList.remove('active');
        toggleButtons[1].classList.add('active');
        slider.classList.add('register');
    }
}

// Password toggle functionality
function togglePassword(fieldId) {
    const field = document.getElementById(fieldId);
    const toggleIcon = field.parentElement.querySelector('.password-toggle');

    if (field.type === 'password') {
        field.type = 'text';
        toggleIcon.classList.remove('fa-eye');
        toggleIcon.classList.add('fa-eye-slash');
    } else {
        field.type = 'password';
        toggleIcon.classList.remove('fa-eye-slash');
        toggleIcon.classList.add('fa-eye');
    }
}

// Alert message functionality
function showAlert(message, type) {
    const alert = document.getElementById('alertMessage');
    alert.textContent = message;
    alert.className = `alert ${type} show`;

    // Auto-hide after 5 seconds
    setTimeout(() => {
        hideAlert();
    }, 5000);
}

function hideAlert() {
    const alert = document.getElementById('alertMessage');
    alert.classList.remove('show');
    setTimeout(() => {
        alert.className = 'alert';
    }, 300);
}

// Forgot password functionality
function showForgotPassword() {
    const email = prompt('Enter your email address to reset password:');
    if (email && validateEmail(email)) {
        showAlert('Password reset instructions have been sent to your email.', 'success');
    } else if (email) {
        showAlert('Please enter a valid email address.', 'error');
    }
}

// Validation functions
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePassword(password) {
    return password.length >= 8;
}

function validatePhone(phone) {
    // Sri Lankan phone number validation (basic)
    const re = /^(\+94|0)?[7][0-9]{8}$/;
    return re.test(phone.replace(/\s/g, ''));
}

function validateName(name) {
    return name.trim().length >= 2 && /^[a-zA-Z\s]+$/.test(name.trim());
}

// Form field validation with real-time feedback
function addFieldValidation() {
    const emailFields = ['loginEmail', 'registerEmail'];
    const passwordFields = ['loginPassword', 'registerPassword', 'confirmPassword'];
    const nameFields = ['firstName', 'lastName'];
    const phoneField = 'phone';

    // Email validation
    emailFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('blur', function () {
                if (this.value && !validateEmail(this.value)) {
                    this.style.borderColor = '#dc3545';
                } else {
                    this.style.borderColor = '#e9ecef';
                }
            });
        }
    });

    // Password validation
    passwordFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('input', function () {
                if (this.value && !validatePassword(this.value)) {
                    this.style.borderColor = '#ffc107';
                } else if (this.value) {
                    this.style.borderColor = '#28a745';
                } else {
                    this.style.borderColor = '#e9ecef';
                }
            });
        }
    });

    // Name validation
    nameFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('blur', function () {
                if (this.value && !validateName(this.value)) {
                    this.style.borderColor = '#dc3545';
                } else {
                    this.style.borderColor = '#e9ecef';
                }
            });
        }
    });

    // Phone validation
    const phoneFieldElement = document.getElementById(phoneField);
    if (phoneFieldElement) {
        phoneFieldElement.addEventListener('blur', function () {
            if (this.value && !validatePhone(this.value)) {
                this.style.borderColor = '#dc3545';
            } else {
                this.style.borderColor = '#e9ecef';
            }
        });
    }

    // Confirm password validation
    const confirmPasswordField = document.getElementById('confirmPassword');
    if (confirmPasswordField) {
        confirmPasswordField.addEventListener('input', function () {
            const password = document.getElementById('registerPassword').value;
            if (this.value && this.value !== password) {
                this.style.borderColor = '#dc3545';
            } else if (this.value) {
                this.style.borderColor = '#28a745';
            } else {
                this.style.borderColor = '#e9ecef';
            }
        });
    }
}

// User data management
const userData = {
    save: function (user) {
        // In a real application, this would be sent to your backend API
        localStorage.setItem('currentUser', JSON.stringify(user));
    },

    get: function () {
        const user = localStorage.getItem('currentUser');
        return user ? JSON.parse(user) : null;
    },

    remove: function () {
        localStorage.removeItem('currentUser');
    },

    authenticate: function (email, password) {
        // In a real application, this would validate against your backend
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        return users.find(user => user.email === email && user.password === password);
    },

    register: function (user) {
        // In a real application, this would be sent to your backend API
        let users = JSON.parse(localStorage.getItem('users') || '[]');

        // Check if user already exists
        if (users.find(u => u.email === user.email)) {
            return { success: false, message: 'Email already registered' };
        }

        // Add user
        user.id = Date.now();
        user.createdAt = new Date().toISOString();
        user.verified = false;
        users.push(user);
        localStorage.setItem('users', JSON.stringify(users));

        return { success: true, message: 'Registration successful' };
    }
};

// Login form submission
document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('loginForm');

    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;
            const rememberMe = document.getElementById('rememberMe').checked;

            // Validation
            if (!validateEmail(email)) {
                showAlert('Please enter a valid email address.', 'error');
                return;
            }

            if (!validatePassword(password)) {
                showAlert('Password must be at least 8 characters long.', 'error');
                return;
            }

            // Show loading state
            const submitBtn = this.querySelector('.submit-btn');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Signing In...';
            submitBtn.disabled = true;

            // Simulate API call
            setTimeout(() => {
                // Attempt to authenticate user
                const user = userData.authenticate(email, password);

                if (user) {
                    userData.save(user);
                    showAlert('Login successful! Redirecting...', 'success');

                    setTimeout(() => {
                        // Redirect based on user type
                        switch (user.userType) {
                            case 'admin':
                                window.location.href = 'admin-dashboard.html';
                                break;
                            case 'staff':
                                window.location.href = 'staff-dashboard.html';
                                break;
                            default:
                                window.location.href = 'user-dashboard.html';
                        }
                    }, 1500);
                } else {
                    showAlert('Invalid email or password. Please try again.', 'error');
                }

                // Reset button
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }, 1500);
        });
    }

    // Register form submission
    const registerForm = document.getElementById('registerForm');

    if (registerForm) {
        registerForm.addEventListener('submit', function (e) {
            e.preventDefault();

            // ADD THIS DEBUG CODE:
            console.log('Registration form submitted!');
            console.log('Form data:', {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email
            });
            alert('Form submission detected!');
            // END DEBUG CODE

            const formData = {
                firstName: document.getElementById('firstName').value.trim(),
                lastName: document.getElementById('lastName').value.trim(),
                email: document.getElementById('registerEmail').value.trim(),
                phone: document.getElementById('phone').value.trim(),
                address: document.getElementById('address').value.trim(),
                password: document.getElementById('registerPassword').value,
                confirmPassword: document.getElementById('confirmPassword').value,
                userType: document.getElementById('userType').value,
                agreeTerms: document.getElementById('agreeTerms').checked,
                newsletter: document.getElementById('newsletter').checked
            };

            // Validation
            if (!validateName(formData.firstName)) {
                showAlert('Please enter a valid first name.', 'error');
                return;
            }

            if (!validateName(formData.lastName)) {
                showAlert('Please enter a valid last name.', 'error');
                return;
            }

            if (!validateEmail(formData.email)) {
                showAlert('Please enter a valid email address.', 'error');
                return;
            }

            if (!validatePhone(formData.phone)) {
                showAlert('Please enter a valid Sri Lankan phone number.', 'error');
                return;
            }

            if (formData.address.length < 10) {
                showAlert('Please enter a complete address.', 'error');
                return;
            }

            if (!validatePassword(formData.password)) {
                showAlert('Password must be at least 8 characters long.', 'error');
                return;
            }

            if (formData.password !== formData.confirmPassword) {
                showAlert('Passwords do not match.', 'error');
                return;
            }

            if (!formData.userType) {
                showAlert('Please select an account type.', 'error');
                return;
            }

            if (!formData.agreeTerms) {
                showAlert('Please agree to the Terms of Service and Privacy Policy.', 'error');
                return;
            }

            // Show loading state
            const submitBtn = this.querySelector('.submit-btn');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Creating Account...';
            submitBtn.disabled = true;

            // Simulate API call
            setTimeout(() => {
                const result = userData.register(formData);

                if (result.success) {
                    showAlert('Registration successful! Please check your email for verification.', 'success');

                    // Reset form
                    this.reset();

                    // Switch to login form after delay
                    setTimeout(() => {
                        switchForm('login');
                        showAlert('Account created! You can now sign in.', 'success');
                    }, 2000);
                } else {
                    showAlert(result.message, 'error');
                }

                // Reset button
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }, 2000);
        });
    }

    // Initialize field validation
    addFieldValidation();
});

// Session management
const sessionManager = {
    init: function () {
        // Check if user is already logged in
        const currentUser = userData.get();
        if (currentUser && window.location.pathname.includes('auth.html')) {
            // Redirect logged-in users away from auth page
            this.redirectToDashboard(currentUser);
        }
    },

    redirectToDashboard: function (user) {
        switch (user.userType) {
            case 'admin':
                window.location.href = 'admin-dashboard.html';
                break;
            case 'staff':
                window.location.href = 'staff-dashboard.html';
                break;
            default:
                window.location.href = 'user-dashboard.html';
        }
    },

    logout: function () {
        userData.remove();
        window.location.href = 'auth.html';
    }
};

// Initialize session management
sessionManager.init();

// Auto-save form data (prevent data loss on refresh)
const formAutoSave = {
    save: function (formId) {
        const form = document.getElementById(formId);
        if (!form) return;

        const formData = new FormData(form);
        const data = {};

        for (let [key, value] of formData.entries()) {
            if (key !== 'password' && key !== 'confirmPassword') { // Don't save passwords
                data[key] = value;
            }
        }

        sessionStorage.setItem(`${formId}_data`, JSON.stringify(data));
    },

    load: function (formId) {
        const savedData = sessionStorage.getItem(`${formId}_data`);
        if (!savedData) return;

        const data = JSON.parse(savedData);
        const form = document.getElementById(formId);
        if (!form) return;

        Object.keys(data).forEach(key => {
            const field = form.querySelector(`[name="${key}"]`);
            if (field && field.type !== 'password') {
                field.value = data[key];

                // Trigger label animation for non-empty fields
                if (data[key] && field.nextElementSibling && field.nextElementSibling.tagName === 'LABEL') {
                    field.nextElementSibling.classList.add('active');
                }
            }
        });
    },

    clear: function (formId) {
        sessionStorage.removeItem(`${formId}_data`);
    }
};

// Auto-save form data on input
document.addEventListener('input', function (e) {
    if (e.target.form && (e.target.form.id === 'loginForm' || e.target.form.id === 'registerForm')) {
        formAutoSave.save(e.target.form.id);
    }
});

// Load saved form data on page load
window.addEventListener('load', function () {
    formAutoSave.load('loginForm');
    formAutoSave.load('registerForm');
});

// Clear saved data on successful submission
document.addEventListener('submit', function (e) {
    if (e.target.id === 'loginForm' || e.target.id === 'registerForm') {
        formAutoSave.clear(e.target.id);
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', function (e) {
    // Ctrl/Cmd + Enter to submit active form
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const activeForm = document.querySelector('.auth-form.active');
        if (activeForm) {
            e.preventDefault();
            activeForm.querySelector('.submit-btn').click();
        }
    }

    // Escape to clear alerts
    if (e.key === 'Escape') {
        hideAlert();
    }
});

// Accessibility enhancements
document.addEventListener('DOMContentLoaded', function () {
    // Add ARIA labels
    const forms = document.querySelectorAll('.auth-form');
    forms.forEach(form => {
        form.setAttribute('role', 'form');
        form.setAttribute('aria-labelledby', form.querySelector('.form-title').id || 'form-title');
    });

    // Announce form switches to screen readers
    const originalSwitchForm = window.switchForm;
    window.switchForm = function (formType) {
        originalSwitchForm(formType);

        // Announce to screen readers
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.style.position = 'absolute';
        announcement.style.left = '-10000px';
        announcement.textContent = `Switched to ${formType} form`;
        document.body.appendChild(announcement);

        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    };
});