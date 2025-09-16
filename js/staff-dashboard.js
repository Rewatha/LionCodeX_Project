// Protected Staff Dashboard functionality with backend integration

class StaffDashboardManager {
    constructor() {
        this.currentUser = null;
        this.isLoading = true;
        this.init();
    }

    async init() {
        // Show loading screen
        this.showLoading();
        
        // Check authentication
        if (!this.checkAuthentication()) {
            this.showAccessDenied();
            return;
        }

        // Verify staff access
        if (!this.verifyStaffAccess()) {
            this.redirectToCorrectDashboard();
            return;
        }

        // Initialize dashboard
        await this.initializeStaffDashboard();
    }

    checkAuthentication() {
        // Check session manager
        if (!window.sessionManager || !window.sessionManager.isLoggedIn) {
            return false;
        }

        this.currentUser = window.sessionManager.currentUser;
        return true;
    }

    verifyStaffAccess() {
        // Only allow staff user type
        return this.currentUser.userType === 'staff';
    }

    redirectToCorrectDashboard() {
        const dashboardUrls = {
            'admin': 'admin-dashboard.html',
            'individual': 'user-dashboard.html',
            'business': 'user-dashboard.html',
            'contractor': 'user-dashboard.html'
        };

        const correctDashboard = dashboardUrls[this.currentUser.userType];
        if (correctDashboard) {
            window.location.href = correctDashboard;
        } else {
            this.showAccessDenied();
        }
    }

    async initializeStaffDashboard() {
        try {
            // Set staff name
            document.getElementById('staffName').textContent = this.currentUser.firstName || 'Staff Member';

            // Load dashboard data
            await this.loadDashboardData();

            // Setup event listeners
            this.setupEventListeners();

            // Hide loading and show dashboard
            this.showDashboard();

        } catch (error) {
            console.error('Staff dashboard initialization error:', error);
            this.showError('Failed to load dashboard. Please refresh the page.');
        }
    }

    async loadDashboardData() {
        try {
            // Load data in parallel
            await Promise.all([
                this.loadTodaySchedule(),
                this.loadAssignedProjects(),
                this.loadTaskProgress(),
                this.loadEquipmentStatus()
            ]);
        } catch (error) {
            console.error('Error loading staff dashboard data:', error);
            this.showFallbackData();
        }
    }

    async loadTodaySchedule() {
        try {
            const response = await fetch(`staff-api.php?action=schedule`, {
                method: 'GET',
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                this.displaySchedule(data.schedule || []);
            } else {
                throw new Error('Failed to load schedule');
            }
        } catch (error) {
            console.error('Schedule loading error:', error);
            this.displaySchedule([]);
        }
    }

    async loadAssignedProjects() {
        try {
            const response = await fetch(`staff-api.php?action=projects`, {
                method: 'GET',
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                this.displayProjects(data.projects || []);
            } else {
                throw new Error('Failed to load projects');
            }
        } catch (error) {
            console.error('Projects loading error:', error);
            this.displayProjects([]);
        }
    }

    async loadTaskProgress() {
        try {
            const response = await fetch(`staff-api.php?action=tasks`, {
                method: 'GET',
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                this.displayTaskProgress(data.tasks || []);
            } else {
                throw new Error('Failed to load tasks');
            }
        } catch (error) {
            console.error('Tasks loading error:', error);
            this.displayTaskProgress([]);
        }
    }

    async loadEquipmentStatus() {
        try {
            const response = await fetch(`staff-api.php?action=equipment`, {
                method: 'GET',
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                this.displayEquipmentStatus(data.equipment || []);
            } else {
                throw new Error('Failed to load equipment');
            }
        } catch (error) {
            console.error('Equipment loading error:', error);
            this.displayEquipmentStatus([]);
        }
    }

    displaySchedule(schedule) {
        const scheduleList = document.querySelector('.schedule-list');
        
        if (schedule.length === 0) {
            scheduleList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-alt"></i>
                    <h3>No Schedule Today</h3>
                    <p>You don't have any scheduled appointments for today.</p>
                </div>
            `;
            return;
        }

        scheduleList.innerHTML = schedule.map(item => {
            const appointmentTime = new Date(item.appointment_date);
            const hour = appointmentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
            const isCurrent = this.isCurrentAppointment(appointmentTime);

            return `
                <div class="schedule-item ${isCurrent ? 'current' : ''}" data-schedule-id="${item.id}">
                    <div class="time">
                        <span class="hour">${hour.split(' ')[0]}</span>
                        <span class="period">${hour.split(' ')[1]}</span>
                    </div>
                    <div class="task-info">
                        <h4>${item.appointment_type}</h4>
                        <p>${item.description || 'No description'}</p>
                        <p class="customer">Customer: ${item.customer_name}</p>
                        ${item.project_name ? `<p class="project">Project: ${item.project_name}</p>` : ''}
                    </div>
                    <div class="task-status">
                        <span class="status ${item.status}">${this.formatStatus(item.status)}</span>
                        <button class="btn-small" onclick="staffDashboard.updateAppointmentStatus(${item.id})">${this.getActionText(item.status)}</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    displayProjects(projects) {
        const projectsList = document.querySelector('.projects-list');
        
        if (projects.length === 0) {
            projectsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-project-diagram"></i>
                    <h3>No Assigned Projects</h3>
                    <p>You don't have any projects assigned to your team currently.</p>
                </div>
            `;
            return;
        }

        projectsList.innerHTML = projects.map(project => `
            <div class="project-card" data-project-id="${project.id}">
                <div class="project-header">
                    <h4>${project.project_name}</h4>
                    <span class="priority ${project.priority}">${this.formatPriority(project.priority)}</span>
                </div>
                <div class="project-details">
                    <p><strong>Customer:</strong> ${project.customer_name}</p>
                    <p><strong>Location:</strong> ${project.location}</p>
                    <p><strong>Deadline:</strong> ${this.formatDate(project.estimated_completion)}</p>
                    <p><strong>Team:</strong> ${project.team_name || 'Not assigned'}</p>
                    <div class="progress-section">
                        <label>Progress: ${project.progress_percentage}%</label>
                        <div class="progress-bar">
                            <div class="progress" style="width: ${project.progress_percentage}%"></div>
                        </div>
                    </div>
                </div>
                <div class="project-actions">
                    <button class="btn-small" onclick="staffDashboard.viewProjectDetails(${project.id})">View Details</button>
                    <button class="btn-small primary" onclick="staffDashboard.updateProgress(${project.id})">Update Progress</button>
                </div>
            </div>
        `).join('');
    }

    displayTaskProgress(tasks) {
        const taskList = document.querySelector('.task-progress-list');
        
        if (tasks.length === 0) {
            taskList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-tasks"></i>
                    <h3>No Active Tasks</h3>
                    <p>You don't have any active tasks assigned.</p>
                </div>
            `;
            return;
        }

        taskList.innerHTML = tasks.map(task => `
            <div class="task-item" data-task-id="${task.id}">
                <div class="task-info">
                    <h4>${task.task_name}</h4>
                    <p>${task.description}</p>
                    <p class="project-name"><strong>Project:</strong> ${task.project_name}</p>
                </div>
                <div class="task-status">
                    <span class="status ${task.status}">${this.formatStatus(task.status)}</span>
                    ${this.getTaskStatusContent(task)}
                    <button class="btn-small primary" onclick="staffDashboard.updateTaskStatus(${task.id})">Update</button>
                </div>
            </div>
        `).join('');
    }

    displayEquipmentStatus(equipment) {
        const equipmentGrid = document.querySelector('.equipment-grid');
        
        if (equipment.length === 0) {
            equipmentGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-tools"></i>
                    <h3>No Equipment Assigned</h3>
                    <p>No equipment is currently assigned to you.</p>
                </div>
            `;
            return;
        }

        equipmentGrid.innerHTML = equipment.map(item => `
            <div class="equipment-item">
                <i class="fas ${this.getEquipmentIcon(item.equipment_type)}"></i>
                <h4>${item.equipment_name}</h4>
                <span class="status ${item.status}">${this.formatStatus(item.status)}</span>
            </div>
        `).join('');
    }

    setupEventListeners() {
        // Setup quick actions
        this.setupQuickActions();
        
        // Setup message input
        this.setupMessageInput();
        
        // Add any other event listeners
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('status-card')) {
                this.handleStatusCardClick(e.target);
            }
        });
    }

    setupQuickActions() {
        const actionItems = document.querySelectorAll('.action-item');
        actionItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const actionText = item.textContent.trim();
                this.handleQuickAction(actionText);
            });
        });
    }

    setupMessageInput() {
        const messageInput = document.querySelector('.message-input input');
        const sendButton = document.querySelector('.message-input .btn-small');
        
        if (messageInput && sendButton) {
            sendButton.addEventListener('click', () => this.sendMessage());
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendMessage();
                }
            });
        }
    }

    async updateAppointmentStatus(appointmentId) {
        const newStatus = prompt('Update appointment status (scheduled/in_progress/completed):');
        if (!newStatus) return;

        try {
            // This would typically call an API endpoint
            alert(`Appointment ${appointmentId} status updated to: ${newStatus}`);
            // Reload schedule to reflect changes
            await this.loadTodaySchedule();
        } catch (error) {
            console.error('Error updating appointment:', error);
            this.showError('Failed to update appointment status');
        }
    }

    async updateProgress(projectId) {
        const newProgress = prompt('Enter new progress percentage (0-100):');
        if (!newProgress || isNaN(newProgress) || newProgress < 0 || newProgress > 100) {
            if (newProgress !== null) {
                alert('Please enter a valid number between 0 and 100');
            }
            return;
        }

        const notes = prompt('Add any notes about this progress update (optional):') || '';

        try {
            const formData = new FormData();
            formData.append('project_id', projectId);
            formData.append('progress', newProgress);
            formData.append('notes', notes);

            const response = await fetch('staff-api.php?action=update-progress', {
                method: 'POST',
                credentials: 'include',
                body: formData
            });

            const data = await response.json();
            
            if (data.success) {
                alert('Progress updated successfully!');
                await this.loadAssignedProjects();
            } else {
                alert(data.error || 'Failed to update progress');
            }
        } catch (error) {
            console.error('Error updating progress:', error);
            this.showError('Failed to update progress');
        }
    }

    async updateTaskStatus(taskId) {
        const newStatus = prompt('Update task status (pending/in_progress/completed):');
        if (!newStatus) return;

        const hours = newStatus === 'completed' ? prompt('Enter hours worked on this task:') : null;

        try {
            const formData = new FormData();
            formData.append('task_id', taskId);
            formData.append('status', newStatus);
            if (hours) formData.append('hours', hours);

            const response = await fetch('staff-api.php?action=update-task', {
                method: 'POST',
                credentials: 'include',
                body: formData
            });

            const data = await response.json();
            
            if (data.success) {
                alert('Task updated successfully!');
                await this.loadTaskProgress();
            } else {
                alert(data.error || 'Failed to update task');
            }
        } catch (error) {
            console.error('Error updating task:', error);
            this.showError('Failed to update task');
        }
    }

    viewProjectDetails(projectId) {
        // This would open a modal with project details
        alert(`Project details for project ${projectId} would be shown here`);
    }

    handleQuickAction(actionText) {
        switch(actionText) {
            case 'Clock In/Out':
                this.handleClockInOut();
                break;
            case 'Upload Photos':
                this.openPhotoUpload();
                break;
            case 'Submit Report':
                this.openReportForm();
                break;
            case 'Request Materials':
                this.openMaterialRequest();
                break;
            case 'Contact Supervisor':
                this.contactSupervisor();
                break;
            case 'Report Issue':
                this.openIssueReport();
                break;
            default:
                console.log('Quick action:', actionText);
        }
    }

    sendMessage() {
        const messageInput = document.querySelector('.message-input input');
        if (!messageInput || !messageInput.value.trim()) return;
        
        const message = messageInput.value.trim();
        messageInput.value = '';
        
        // Add message to the list (simulate sending)
        this.addMessageToList({
            sender: 'You',
            time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            content: message,
            type: 'user'
        });
        
        alert('Message sent to team!');
    }

    addMessageToList(message) {
        const messagesList = document.querySelector('.messages-list');
        if (!messagesList) return;
        
        const messageElement = document.createElement('div');
        messageElement.className = 'message-item';
        messageElement.innerHTML = `
            <div class="message-sender">
                <i class="fas fa-user"></i>
                <strong>${message.sender}</strong>
                <span class="time">${message.time}</span>
            </div>
            <div class="message-content">
                <p>${message.content}</p>
            </div>
        `;
        
        messagesList.appendChild(messageElement);
        messagesList.scrollTop = messagesList.scrollHeight;
    }

    showFallbackData() {
        this.displaySchedule([]);
        this.displayProjects([]);
        this.displayTaskProgress([]);
        this.displayEquipmentStatus([]);
    }

    showLoading() {
        document.getElementById('loading-screen').style.display = 'flex';
        document.getElementById('dashboard-content').style.display = 'none';
        document.getElementById('access-denied').style.display = 'none';
    }

    showAccessDenied() {
        document.getElementById('loading-screen').style.display = 'none';
        document.getElementById('dashboard-content').style.display = 'none';
        document.getElementById('access-denied').style.display = 'flex';
    }

    showDashboard() {
        document.getElementById('loading-screen').style.display = 'none';
        document.getElementById('access-denied').style.display = 'none';
        document.getElementById('dashboard-content').style.display = 'block';
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-notification';
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">×</button>
        `;
        document.body.appendChild(errorDiv);

        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    }

    // Utility functions
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }

    formatStatus(status) {
        const statusMap = {
            'scheduled': 'Scheduled',
            'in_progress': 'In Progress',
            'completed': 'Completed',
            'pending': 'Pending',
            'confirmed': 'Confirmed',
            'available': 'Available',
            'in_use': 'In Use',
            'maintenance': 'Maintenance',
            'on_hold': 'On Hold'
        };
        return statusMap[status] || status;
    }

    formatPriority(priority) {
        const priorityMap = {
            'high': 'High Priority',
            'medium': 'Medium Priority',
            'low': 'Low Priority',
            'urgent': 'Urgent'
        };
        return priorityMap[priority] || priority;
    }

    getActionText(status) {
        const actionMap = {
            'scheduled': 'Start',
            'in_progress': 'Update',
            'confirmed': 'Start',
            'pending': 'Review'
        };
        return actionMap[status] || 'Update';
    }

    getTaskStatusContent(task) {
        switch(task.status) {
            case 'completed':
                return `<div class="completion-time">Completed: ${this.formatDate(task.completed_date)}</div>`;
            case 'in_progress':
                const progress = task.actual_hours && task.estimated_hours ? 
                    Math.min(100, (task.actual_hours / task.estimated_hours) * 100) : 0;
                return `<div class="progress-small"><div class="progress" style="width: ${progress}%"></div></div>`;
            case 'pending':
                return task.due_date ? `<div class="estimated-time">Due: ${this.formatDate(task.due_date)}</div>` : '';
            default:
                return '';
        }
    }

    getEquipmentIcon(equipmentType) {
        const iconMap = {
            'tools': 'fa-tools',
            'spray': 'fa-spray-can',
            'safety': 'fa-hard-hat',
            'vehicle': 'fa-truck',
            'machinery': 'fa-cogs',
            'measurement': 'fa-ruler'
        };
        return iconMap[equipmentType] || 'fa-tools';
    }

    isCurrentAppointment(appointmentTime) {
        const now = new Date();
        const diffMinutes = Math.abs(now - appointmentTime) / (1000 * 60);
        return diffMinutes <= 30; // Within 30 minutes
    }

    handleStatusCardClick(card) {
        card.style.transform = 'scale(0.98)';
        setTimeout(() => {
            card.style.transform = '';
        }, 150);
    }

    // Quick action implementations
    handleClockInOut() {
        const isClocked = localStorage.getItem('clockedIn') === 'true';
        const action = isClocked ? 'Clock Out' : 'Clock In';
        
        if (confirm(`Are you sure you want to ${action}?`)) {
            localStorage.setItem('clockedIn', !isClocked);
            alert(`Successfully ${action.toLowerCase()}ed at ${new Date().toLocaleTimeString()}`);
            // Update status card if exists
            this.updateClockStatus(!isClocked);
        }
    }

    updateClockStatus(clockedIn) {
        const statusCards = document.querySelectorAll('.status-card');
        statusCards.forEach(card => {
            const cardText = card.textContent;
            if (cardText.includes('Clock') || cardText.includes('Time')) {
                const h3 = card.querySelector('h3');
                const p = card.querySelector('p');
                if (h3 && p) {
                    if (clockedIn) {
                        h3.textContent = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                        p.textContent = 'Clock In Time';
                        card.classList.add('active');
                    } else {
                        h3.textContent = '--:--';
                        p.textContent = 'Clocked Out';
                        card.classList.remove('active');
                    }
                }
            }
        });
    }

    openPhotoUpload() {
        alert('Photo upload functionality would open here. Staff can document work progress with photos.');
    }

    openReportForm() {
        alert('Daily report form would open here for submitting work summaries.');
    }

    openMaterialRequest() {
        alert('Material request form would open here for requesting additional supplies.');
    }

    contactSupervisor() {
        if (confirm('Contact supervisor via phone?')) {
            window.open('tel:' + COMPANY_PHONE);
        }
    }

    openIssueReport() {
        alert('Issue reporting form would open here for reporting problems or safety concerns.');
    }
}

// Initialize staff dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Wait for session manager to initialize
    setTimeout(() => {
        window.staffDashboard = new StaffDashboardManager();
    }, 100);
});

// Logout function (global)
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        // Clear user data
        localStorage.removeItem('currentUser');
        localStorage.removeItem('clockedIn');
        sessionStorage.clear();
        
        // Redirect to login
        window.location.href = 'auth.html';
    }
}