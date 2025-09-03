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
            field.addEventListener('blur', function() {
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
            field.addEventListener('input', function() {
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
            field.addEventListener('blur', function() {
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
        phoneFieldElement.addEventListener('blur', function() {
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
        confirmPasswordField.addEventListener('input', function() {
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
    save: function(user) {
        // In a real application, this would be sent to your backend API
        localStorage.setItem('currentUser', JSON.stringify(user));
    },
    
    get: function() {
        const user = localStorage.getItem('currentUser');
        return user ? JSON.parse(user) : null;
    },
    
    remove: function() {
        localStorage.removeItem('currentUser');
    },
    
    authenticate: function(email, password) {
        // In a real application, this would validate against your backend
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        return users.find(user => user.email === email && user.password === password);
    },
    
    register: function(user) {
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
