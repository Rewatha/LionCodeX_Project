// Add Customer Form Handler
// File: js/add-customer.js

document.addEventListener('DOMContentLoaded', function() {
    console.log('Add Customer page loaded');
    
    // Check if user is admin
    if (!window.sessionManager || !window.sessionManager.isLoggedIn) {
        console.log('User not logged in, redirecting...');
        window.location.href = 'auth.html';
        return;
    }

    if (window.sessionManager.currentUser.userType !== 'admin') {
        alert('Admin access required');
        window.location.href = 'user-dashboard.html';
        return;
    }

    console.log('User authenticated as admin');

    // Handle form submission
    document.getElementById('addCustomerForm').addEventListener('submit', handleSubmit);
    
    // Password validation
    document.getElementById('password').addEventListener('input', validatePassword);
    document.getElementById('confirmPassword').addEventListener('input', validatePassword);
});

function validatePassword() {
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const confirmInput = document.getElementById('confirmPassword');
    
    // Check if passwords match
    if (confirmPassword && password !== confirmPassword) {
        confirmInput.setCustomValidity('Passwords do not match');
    } else {
        confirmInput.setCustomValidity('');
    }
}

async function handleSubmit(e) {
    e.preventDefault();
    
    console.log('Form submitted');

    // Hide alerts
    document.getElementById('alert-success').style.display = 'none';
    document.getElementById('alert-error').style.display = 'none';

    // Get form data
    const formData = new FormData(e.target);
    
    // Validate password match
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');
    
    if (password !== confirmPassword) {
        document.getElementById('error-message').textContent = 'Passwords do not match';
        document.getElementById('alert-error').style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }
    
    // Validate password strength
    if (password.length < 8) {
        document.getElementById('error-message').textContent = 'Password must be at least 8 characters long';
        document.getElementById('alert-error').style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }
    
    // Log form data for debugging
    for (let [key, value] of formData.entries()) {
        if (key !== 'password' && key !== 'confirmPassword') {
            console.log(key + ':', value);
        }
    }

    // Disable submit button
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';

    try {
        const response = await fetch('../backend/admin-api.php?action=create-customer', {
            method: 'POST',
            credentials: 'include',
            body: formData
        });

        console.log('Create customer response status:', response.status);
        
        const text = await response.text();
        console.log('Response text:', text.substring(0, 500));
        
        let data;
        try {
            data = JSON.parse(text);
        } catch (parseError) {
            console.error('Failed to parse response:', parseError);
            throw new Error('Server returned invalid response: ' + text.substring(0, 100));
        }

        if (data.success) {
            // Show success message
            document.getElementById('alert-success').style.display = 'block';
            
            // Reset form
            e.target.reset();
            
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            // Redirect after 2 seconds
            setTimeout(() => {
                window.location.href = 'admin-dashboard.html';
            }, 2000);
        } else {
            throw new Error(data.error || 'Failed to create customer');
        }
    } catch (error) {
        console.error('Error creating customer:', error);
        document.getElementById('error-message').textContent = error.message;
        document.getElementById('alert-error').style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-check"></i> Create Customer';
    }
}