// Add Project Form Handler
// File: js/add-project.js

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is admin
    if (!window.sessionManager || !window.sessionManager.isLoggedIn) {
        window.location.href = 'auth.html';
        return;
    }

    if (window.sessionManager.currentUser.userType !== 'admin') {
        alert('Admin access required');
        window.location.href = 'user-dashboard.html';
        return;
    }

    // Load customers and teams
    loadCustomers();
    loadTeams();

    // Set default start date to today
    document.getElementById('startDate').valueAsDate = new Date();

    // Handle form submission
    document.getElementById('addProjectForm').addEventListener('submit', handleSubmit);
});

async function loadCustomers() {
    try {
        const response = await fetch('../backend/admin-api.php?action=get-customers', {
            credentials: 'include'
        });

        if (response.ok) {
            const data = await response.json();
            const select = document.getElementById('customerId');
            
            if (data.success && data.customers) {
                data.customers.forEach(customer => {
                    const option = document.createElement('option');
                    option.value = customer.id;
                    option.textContent = `${customer.first_name} ${customer.last_name} (${customer.email})`;
                    select.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Error loading customers:', error);
    }
}

async function loadTeams() {
    try {
        const response = await fetch('../backend/admin-api.php?action=get-teams', {
            credentials: 'include'
        });

        if (response.ok) {
            const data = await response.json();
            const select = document.getElementById('teamId');
            
            if (data.success && data.teams) {
                data.teams.forEach(team => {
                    const option = document.createElement('option');
                    option.value = team.id;
                    option.textContent = team.team_name;
                    select.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Error loading teams:', error);
    }
}

async function handleSubmit(e) {
    e.preventDefault();

    // Hide alerts
    document.getElementById('alert-success').style.display = 'none';
    document.getElementById('alert-error').style.display = 'none';

    // Get form data
    const formData = new FormData(e.target);

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

        const data = await response.json();

        if (data.success) {
            // Show success message
            document.getElementById('alert-success').style.display = 'block';
            
            // Reset form
            e.target.reset();
            document.getElementById('startDate').valueAsDate = new Date();
            
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