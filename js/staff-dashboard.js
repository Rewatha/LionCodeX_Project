// Staff Dashboard functionality
document.addEventListener('DOMContentLoaded', function() {
    initializeStaffDashboard();
    loadStaffData();
    setupStaffEventListeners();
});

// Initialize staff dashboard
function initializeStaffDashboard() {
    // Verify staff access
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.userType !== 'staff') {
        alert('Access denied. Staff privileges required.');
        window.location.href = 'auth.html';
        return;
    }
    
    // Set staff name
    document.getElementById('staffName').textContent = currentUser.firstName || 'Staff Member';
    
    // Initialize staff components
    initializeStaffComponents();
    setupLocationTracking();
}

// Get current user from storage
function getCurrentUser() {
    try {
        const user = localStorage.getItem('currentUser');
        return user ? JSON.parse(user) : null;
    } catch (error) {
        console.error('Error loading user data:', error);
        return null;
    }
}

// Load staff-specific data
function loadStaffData() {
    loadTodaySchedule();
    loadAssignedProjects();
    loadTaskProgress();
    loadTeamMessages();
    loadEquipmentStatus();
    loadPerformanceStats();
}

// Load today's schedule
function loadTodaySchedule() {
    const todaySchedule = [
        {
            id: 1,
            time: '9:00 AM',
            title: 'Site Inspection',
            description: 'Villa Roof Assessment - Colombo 7',
            customer: 'Mr. K. Rathnayake',
            status: 'in-progress',
            current: true
        },
        {
            id: 2,
            time: '11:30 AM',
            title: 'Material Pickup',
            description: 'Collect waterproofing materials from warehouse',
            customer: 'For: Office Building Project',
            status: 'pending'
        },
        {
            id: 3,
            time: '2:00 PM',
            title: 'Foundation Waterproofing',
            description: 'Continue foundation sealing work - Phase 2',
            customer: 'Customer: ABC Company Ltd',
            status: 'scheduled'
        }
    ];
    
    displaySchedule(todaySchedule);
}

// Display schedule items
function displaySchedule(schedule) {
    const scheduleList = document.querySelector('.schedule-list');
    if (!scheduleList) return;
    
    scheduleList.innerHTML = schedule.map(item => `
        <div class="schedule-item ${item.current ? 'current' : ''}" data-schedule-id="${item.id}">
            <div class="time">
                <span class="hour">${item.time.split(' ')[0]}</span>
                <span class="period">${item.time.split(' ')[1]}</span>
            </div>
            <div class="task-info">
                <h4>${item.title}</h4>
                <p>${item.description}</p>
                <p class="customer">${item.customer}</p>
            </div>
            <div class="task-status">
                <span class="status ${item.status}">${formatStatus(item.status)}</span>
                <button class="btn-small" onclick="updateTaskStatus(${item.id})">${getActionText(item.status)}</button>
            </div>
        </div>
    `).join('');
}

// Load assigned projects
function loadAssignedProjects() {
    const assignedProjects = [
        {
            id: 1,
            title: 'Luxury Villa Waterproofing',
            customer: 'Mr. K. Rathnayake',
            location: 'Colombo 7',
            deadline: '2025-01-30',
            progress: 65,
            priority: 'high'
        },
        {
            id: 2,
            title: 'Office Building Foundation',
            customer: 'ABC Company Ltd',
            location: 'Negombo',
            deadline: '2025-02-15',
            progress: 30,
            priority: 'medium'
        }
    ];
    
    displayProjects(assignedProjects);
}

// Display assigned projects
function displayProjects(projects) {
    const projectsList = document.querySelector('.projects-list');
    if (!projectsList) return;
    
    projectsList.innerHTML = projects.map(project => `
        <div class="project-card" data-project-id="${project.id}">
            <div class="project-header">
                <h4>${project.title}</h4>
                <span class="priority ${project.priority}">${formatPriority(project.priority)}</span>
            </div>
            <div class="project-details">
                <p><strong>Customer:</strong> ${project.customer}</p>
                <p><strong>Location:</strong> ${project.location}</p>
                <p><strong>Deadline:</strong> ${formatDate(project.deadline)}</p>
                <div class="progress-section">
                    <label>Progress: ${project.progress}%</label>
                    <div class="progress-bar">
                        <div class="progress" style="width: ${project.progress}%"></div>
                    </div>
                </div>
            </div>
            <div class="project-actions">
                <button class="btn-small" onclick="viewProjectDetails(${project.id})">View Details</button>
                <button class="btn-small primary" onclick="updateProgress(${project.id})">Update Progress</button>
            </div>
        </div>
    `).join('');
}

// Load task progress
function loadTaskProgress() {
    const tasks = [
        {
            id: 1,
            title: 'Roof Surface Preparation',
            description: 'Clean and prepare roof surface for waterproofing',
            status: 'completed',
            completedAt: '10:30 AM'
        },
        {
            id: 2,
            title: 'Primer Application',
            description: 'Apply waterproofing primer to prepared surface',
            status: 'in-progress',
            progress: 70
        },
        {
            id: 3,
            title: 'Membrane Installation',
            description: 'Install waterproofing membrane system',
            status: 'pending',
            estimatedTime: '2:00 PM'
        }
    ];
    
    displayTaskProgress(tasks);
}

// Display task progress
function displayTaskProgress(tasks) {
    const taskList = document.querySelector('.task-progress-list');
    if (!taskList) return;
    
    taskList.innerHTML = tasks.map(task => `
        <div class="task-item" data-task-id="${task.id}">
            <div class="task-info">
                <h4>${task.title}</h4>
                <p>${task.description}</p>
            </div>
            <div class="task-status">
                <span class="status ${task.status}">${formatStatus(task.status)}</span>
                ${getTaskStatusContent(task)}
            </div>
        </div>
    `).join('');
}

// Get task status content based on status
function getTaskStatusContent(task) {
    switch(task.status) {
        case 'completed':
            return `<div class="completion-time">Completed at ${task.completedAt}</div>`;
        case 'in-progress':
            return `<div class="progress-small"><div class="progress" style="width: ${task.progress}%"></div></div>`;
        case 'pending':
            return `<div class="estimated-time">Est. ${task.estimatedTime}</div>`;
        default:
            return '';
    }
}

// Load team messages
function loadTeamMessages() {
    const messages = [
        {
            id: 1,
            sender: 'Supervisor',
            time: '10:15 AM',
            content: 'Great work on the roof preparation. Please ensure the surface is completely dry before applying primer.',
            type: 'supervisor'
        },
        {
            id: 2,
            sender: 'Priya (Team Lead)',
            time: '9:45 AM',
            content: 'Material delivery arrived on time. All equipment is ready for the foundation project this afternoon.',
            type: 'team'
        },
        {
            id: 3,
            sender: 'System Alert',
            time: '9:00 AM',
            content: 'Weather update: Clear skies expected all day. Perfect conditions for outdoor waterproofing work.',
            type: 'system'
        }
    ];
    
    displayMessages(messages);
}

// Display team messages
function displayMessages(messages) {
    const messagesList = document.querySelector('.messages-list');
    if (!messagesList) return;
    
    messagesList.innerHTML = messages.map(message => `
        <div class="message-item" data-message-id="${message.id}">
            <div class="message-sender">
                <i class="fas ${getMessageIcon(message.type)}"></i>
                <strong>${message.sender}</strong>
                <span class="time">${message.time}</span>
            </div>
            <div class="message-content">
                <p>${message.content}</p>
            </div>
        </div>
    `).join('');
}

// Get message icon based on type
function getMessageIcon(type) {
    const icons = {
        supervisor: 'fa-user-tie',
        team: 'fa-user',
        system: 'fa-exclamation-circle'
    };
    return icons[type] || 'fa-user';
}

// Load equipment status
function loadEquipmentStatus() {
    const equipment = [
        { name: 'Basic Tools', icon: 'fa-tools', status: 'available' },
        { name: 'Spray Equipment', icon: 'fa-spray-can', status: 'in-use' },
        { name: 'Safety Gear', icon: 'fa-hard-hat', status: 'available' },
        { name: 'Service Vehicle', icon: 'fa-truck', status: 'available' }
    ];
    
    displayEquipmentStatus(equipment);
}

// Display equipment status
function displayEquipmentStatus(equipment) {
    const equipmentGrid = document.querySelector('.equipment-grid');
    if (!equipmentGrid) return;
    
    equipmentGrid.innerHTML = equipment.map(item => `
        <div class="equipment-item">
            <i class="fas ${item.icon}"></i>
            <h4>${item.name}</h4>
            <span class="status ${item.status}">${formatStatus(item.status)}</span>
        </div>
    `).join('');
}

// Load performance statistics
function loadPerformanceStats() {
    const stats = {
        projectsCompleted: 12,
        customerRating: 4.8,
        onTimeRate: 95
    };
    
    updatePerformanceStats(stats);
}

// Update performance statistics
function updatePerformanceStats(stats) {
    const statItems = document.querySelectorAll('.stat-item');
    const values = [stats.projectsCompleted, stats.customerRating, `${stats.onTimeRate}%`];
    
    statItems.forEach((item, index) => {
        const h3 = item.querySelector('h3');
        if (h3 && values[index] !== undefined) {
            h3.textContent = values[index];
        }
    });
}

// Setup staff event listeners
function setupStaffEventListeners() {
    setupQuickActions();
    setupMessageInput();
    setupClockInOut();
    setupPhotoUpload();
}

// Setup quick actions
function setupQuickActions() {
    const actionItems = document.querySelectorAll('.action-item');
    actionItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const actionText = this.textContent.trim();
            handleQuickAction(actionText);
        });
    });
}

// Handle quick action clicks
function handleQuickAction(actionText) {
    switch(actionText) {
        case 'Clock In/Out':
            handleClockInOut();
            break;
        case 'Upload Photos':
            openPhotoUpload();
            break;
        case 'Submit Report':
            openReportForm();
            break;
        case 'Request Materials':
            openMaterialRequest();
            break;
        case 'Contact Supervisor':
            contactSupervisor();
            break;
        case 'Report Issue':
            openIssueReport();
            break;
        default:
            console.log('Quick action:', actionText);
    }
}

// Setup message input
function setupMessageInput() {
    const messageInput = document.querySelector('.message-input input');
    const sendButton = document.querySelector('.message-input .btn-small');
    
    if (messageInput && sendButton) {
        sendButton.addEventListener('click', sendMessage);
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
}

// Send message to team
function sendMessage() {
    const messageInput = document.querySelector('.message-input input');
    if (!messageInput || !messageInput.value.trim()) return;
    
    const message = messageInput.value.trim();
    messageInput.value = '';
    
    // Add message to the list (simulate sending)
    addMessageToList({
        sender: 'You',
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        content: message,
        type: 'user'
    });
    
    alert('Message sent to team!');
}

// Add message to message list
function addMessageToList(message) {
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

// Initialize staff components
function initializeStaffComponents() {
    setupGPSTracking();
    initializeNotifications();
    setupOfflineMode();
}

// Setup GPS tracking (mock)
function setupGPSTracking() {
    console.log('GPS tracking initialized');
}

// Setup location tracking
function setupLocationTracking() {
    // In a real app, this would track staff location for job assignments
    console.log('Location tracking setup');
}

// Initialize notifications for staff
function initializeNotifications() {
    // Check for new assignments, messages, etc.
    checkStaffNotifications();
}

// Check for staff-specific notifications
function checkStaffNotifications() {
    console.log('Checking staff notifications...');
}

// Setup offline mode support
function setupOfflineMode() {
    // Enable offline functionality for field workers
    console.log('Offline mode support enabled');
}

// Setup clock in/out functionality
function setupClockInOut() {
    // Initialize clock in/out tracking
    console.log('Clock in/out system initialized');
}

// Setup photo upload functionality
function setupPhotoUpload() {
    // Initialize photo upload for progress documentation
    console.log('Photo upload system initialized');
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

function formatStatus(status) {
    const statusMap = {
        'in-progress': 'In Progress',
        'pending': 'Pending',
        'scheduled': 'Scheduled',
        'completed': 'Completed',
        'available': 'Available',
        'in-use': 'In Use'
    };
    return statusMap[status] || status;
}

function formatPriority(priority) {
    const priorityMap = {
        'high': 'High Priority',
        'medium': 'Medium Priority',
        'low': 'Low Priority'
    };
    return priorityMap[priority] || priority;
}

function getActionText(status) {
    const actionMap = {
        'in-progress': 'Update',
        'pending': 'Start',
        'scheduled': 'View Details'
    };
    return actionMap[status] || 'Update';
}

// Action functions
function updateTaskStatus(scheduleId) {
    alert(`Updating status for task ${scheduleId}`);
}

function viewProjectDetails(projectId) {
    alert(`Viewing project details for project ${projectId}`);
}

function updateProgress(projectId) {
    const newProgress = prompt('Enter new progress percentage (0-100):');
    if (newProgress && !isNaN(newProgress) && newProgress >= 0 && newProgress <= 100) {
        alert(`Progress updated to ${newProgress}% for project ${projectId}`);
        // Update the UI
        updateProjectProgress(projectId, newProgress);
    }
}

function updateProjectProgress(projectId, progress) {
    const projectCard = document.querySelector(`[data-project-id="${projectId}"]`);
    if (projectCard) {
        const progressBar = projectCard.querySelector('.progress');
        const progressLabel = projectCard.querySelector('.progress-section label');
        
        if (progressBar) progressBar.style.width = progress + '%';
        if (progressLabel) progressLabel.textContent = `Progress: ${progress}%`;
    }
}

// Quick action functions
function handleClockInOut() {
    const isClocked = localStorage.getItem('clockedIn') === 'true';
    const action = isClocked ? 'Clock Out' : 'Clock In';
    
    if (confirm(`Are you sure you want to ${action}?`)) {
        localStorage.setItem('clockedIn', !isClocked);
        alert(`Successfully ${action.toLowerCase()}ed at ${new Date().toLocaleTimeString()}`);
    }
}

function openPhotoUpload() {
    alert('Photo upload functionality would open here. Staff can document work progress.');
}

function openReportForm() {
    alert('Daily report form would open here.');
}

function openMaterialRequest() {
    alert('Material request form would open here.');
}

function contactSupervisor() {
    alert('Contacting supervisor via phone: 077 633 6464');
}

function openIssueReport() {
    alert('Issue reporting form would open here.');
}

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