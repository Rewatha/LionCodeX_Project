// Add Project Form Handler
// File: js/add-project.js

document.addEventListener('DOMContentLoaded', function() {
    console.log('Add Project page loaded');
    
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

    // Load customers and teams
    loadCustomers();
    loadTeams();

    // Set default start date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('startDate').value = today;

    // Handle form submission
    document.getElementById('addProjectForm').addEventListener('submit', handleSubmit);
});

async function loadCustomers() {
    console.log('Loading customers...');
    
    try {
        const response = await fetch('../backend/admin-api.php?action=get-customers', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json'
            }
        });

        console.log('Customers response status:', response.status);
        
        const text = await response.text();
        console.log('Customers response text:', text.substring(0, 200));
        
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error('Failed to parse JSON:', e);
            console.error('Response was:', text);
            return;
        }

        if (data.success && data.customers) {
            const select = document.getElementById('customerId');
            
            data.customers.forEach(customer => {
                const option = document.createElement('option');
                option.value = customer.id;
                option.textContent = `${customer.first_name} ${customer.last_name} (${customer.email})`;
                select.appendChild(option);
            });
            
            console.log('Loaded', data.customers.length, 'customers');
        } else {
            console.error('Invalid response:', data);
        }
    } catch (error) {
        console.error('Error loading customers:', error);
    }
}

async function loadTeams() {
    console.log('Loading teams...');
    
    try {
        const response = await fetch('../backend/admin-api.php?action=get-teams', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json'
            }
        });

        console.log('Teams response status:', response.status);
        
        const text = await response.text();
        console.log('Teams response text:', text.substring(0, 200));
        
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error('Failed to parse JSON:', e);
            console.error('Response was:', text);
            return;
        }

        if (data.success && data.teams) {
            const select = document.getElementById('teamId');
            
            data.teams.forEach(team => {
                const option = document.createElement('option');
                option.value = team.id;
                option.textContent = team.team_name;
                select.appendChild(option);
            });
            
            console.log('Loaded', data.teams.length, 'teams');
        } else {
            console.error('Invalid response:', data);
        }
    } catch (error) {
        console.error('Error loading teams:', error);
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
    
    // Log form data for debugging
    for (let [key, value] of formData.entries()) {
        console.log(key + ':', value);
    }

    // Disable submit button
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';

    try {
        const response = await fetch('../backend/admin-api.php?action=create-project', {
            method: 'POST',
            credentials: 'include',
            body: formData
        });

        console.log('Create project response status:', response.status);
        
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
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('startDate').value = today;
            
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            // Redirect after 2 seconds
            setTimeout(() => {
                window.location.href = 'admin-dashboard.html';
            }, 2000);
        } else {
            throw new Error(data.error || 'Failed to create project');
        }
    } catch (error) {
        console.error('Error creating project:', error);
        document.getElementById('error-message').textContent = error.message;
        document.getElementById('alert-error').style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-check"></i> Create Project';
    }
}