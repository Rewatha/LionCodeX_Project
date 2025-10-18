// Fixed Staff Dashboard with proper error handling and security

// Configuration
const CONFIG = {
    COMPANY_PHONE: '0776336464',
    API_BASE: '../backend/staff-api.php',
    LOCALE: 'en-LK' // Sri Lankan English
};

class StaffDashboardManager {
    constructor() {
        this.currentUser = null;
        this.isLoading = true;
        this.csrfToken = null;
        this.updateIntervals = [];
        this.init();
    }

    async init() {
        // Show loading screen
        this.showLoading();
        
        // Wait for session manager with proper promise
        await this.waitForSessionManager();
        
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

    waitForSessionManager() {
        return new Promise((resolve) => {
            if (window.sessionManager && window.sessionManager.isLoggedIn !== undefined) {
                resolve();
            } else {
                const checkInterval = setInterval(() => {
                    if (window.sessionManager && window.sessionManager.isLoggedIn !== undefined) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 50);
                
                // Timeout after 5 seconds
                setTimeout(() => {
                    clearInterval(checkInterval);
                    resolve();
                }, 5000);
            }
        });
    }

    checkAuthentication() {
        if (!window.sessionManager || !window.sessionManager.isLoggedIn) {
            return false;
        }

        this.currentUser = window.sessionManager.currentUser;
        return true;
    }

    verifyStaffAccess() {
        return this.currentUser && this.currentUser.userType === 'staff';
    }

    redirectToCorrectDashboard() {
        const dashboardUrls = {
            'admin': 'admin-dashboard.html',
            'individual': 'user-dashboard.html',
            'business': 'user-dashboard.html',
            'contractor': 'user-dashboard.html'
        };

        const correctDashboard = dashboardUrls[this.currentUser?.userType];
        if (correctDashboard) {
            window.location.href = correctDashboard;
        } else {
            this.showAccessDenied();
        }
    }

    async initializeStaffDashboard() {
        try {
            // Get CSRF token
            await this.getCsrfToken();
            
            // Set staff name
            const nameElement = document.getElementById('staffName');
            if (nameElement) {
                nameElement.textContent = this.currentUser.firstName || 'Staff Member';
            }

            // Load dashboard data
            await this.loadDashboardData();

            // Setup event listeners
            this.setupEventListeners();

            // Setup auto-refresh for schedule (every 5 minutes)
            this.setupAutoRefresh();

            // Hide loading and show dashboard
            this.showDashboard();

        } catch (error) {
            console.error('Staff dashboard initialization error:', error);
            this.showError('Failed to load dashboard. Please refresh the page.');
        }
    }

    async getCsrfToken() {
        try {
            const response = await this.apiCall('get-csrf', 'GET');
            if (response.success) {
                this.csrfToken = response.csrf_token;
            }
        } catch (error) {
            console.warn('Could not get CSRF token:', error);
        }
    }

    async apiCall(action, method = 'GET', data = null) {
        const url = `${CONFIG.API_BASE}?action=${action}`;
        const options = {
            method: method,
            credentials: 'include',
            headers: {}
        };

        if (method === 'POST' && data) {
            if (this.csrfToken) {
                if (data instanceof FormData) {
                    data.append('csrf_token', this.csrfToken);
                } else {
                    options.headers['X-CSRF-Token'] = this.csrfToken;
                }
            }
            options.body = data;
        }

        const response = await fetch(url, options);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    }

    async loadDashboardData() {
        try {
            const loadingStates = {
                schedule: this.loadTodaySchedule(),
                projects: this.loadAssignedProjects(),
                tasks: this.loadTaskProgress(),
                equipment: this.loadEquipmentStatus()
            };

            // Load all in parallel but handle errors individually
            const results = await Promise.allSettled(Object.values(loadingStates));
            
            results.forEach((result, index) => {
                if (result.status === 'rejected') {
                    console.warn(`Failed to load ${Object.keys(loadingStates)[index]}:`, result.reason);
                }
            });

        } catch (error) {
            console.error('Error loading staff dashboard data:', error);
        }
    }

    async loadTodaySchedule() {
        try {
            const data = await this.apiCall('schedule', 'GET');
            
            if (data.success) {
                this.displaySchedule(data.schedule || []);
                this.updateStatusCard('schedule', data.count || 0);
            } else {
                throw new Error(data.error || 'Failed to load schedule');
            }
        } catch (error) {
            console.error('Schedule loading error:', error);
            this.displaySchedule([], error.message);
        }
    }

    async loadAssignedProjects() {
        try {
            const data = await this.apiCall('projects', 'GET');
            
            if (data.success) {
                this.displayProjects(data.projects || []);
            } else {
                throw new Error(data.error || 'Failed to load projects');
            }
        } catch (error) {
            console.error('Projects loading error:', error);
            this.displayProjects([], error.message);
        }
    }

    async loadTaskProgress() {
        try {
            const data = await this.apiCall('tasks', 'GET');
            
            if (data.success) {
                this.displayTaskProgress(data.tasks || []);
            } else {
                throw new Error(data.error || 'Failed to load tasks');
            }
        } catch (error) {
            console.error('Tasks loading error:', error);
            this.displayTaskProgress([], error.message);
        }
    }

    async loadEquipmentStatus() {
        try {
            const data = await this.apiCall('equipment', 'GET');
            
            if (data.success) {
                this.displayEquipmentStatus(data.equipment || []);
            } else {
                throw new Error(data.error || 'Failed to load equipment');
            }
        } catch (error) {
            console.error('Equipment loading error:', error);
            this.displayEquipmentStatus([], error.message);
        }
    }

    updateStatusCard(type, value) {
        const statusCards = document.querySelectorAll('.status-card');
        statusCards.forEach(card => {
            const text = card.textContent.toLowerCase();
            if (type === 'schedule' && text.includes('tasks')) {
                const h3 = card.querySelector('h3');
                if (h3) h3.textContent = value;
            }
        });
    }

    displaySchedule(schedule, errorMsg = null) {
        const scheduleList = document.querySelector('.schedule-list');
        if (!scheduleList) return;
        
        if (errorMsg) {
            scheduleList.innerHTML = this.createErrorState('Schedule', errorMsg);
            return;
        }
        
        if (schedule.length === 0) {
            scheduleList.innerHTML = this.createEmptyState(
                'calendar-alt',
                'No Schedule Today',
                "You don't have any scheduled appointments for today."
            );
            return;
        }

        scheduleList.innerHTML = schedule.map(item => {
            const appointmentTime = new Date(item.appointment_date);
            const formattedTime = this.formatTime(appointmentTime);
            const isCurrent = this.isCurrentAppointment(appointmentTime);
            const statusClass = this.normalizeStatus(item.status);

            return `
                <div class="schedule-item ${isCurrent ? 'current' : ''}" data-schedule-id="${item.id}">
                    <div class="time">
                        <span class="hour">${formattedTime.hour}</span>
                        <span class="period">${formattedTime.period}</span>
                    </div>
                    <div class="task-info">
                        <h4>${this.escapeHtml(item.appointment_type)}</h4>
                        <p>${this.escapeHtml(item.description || 'No description')}</p>
                        <p class="customer">Customer: ${this.escapeHtml(item.customer_name)}</p>
                        ${item.project_name && item.project_name !== 'N/A' ? 
                            `<p class="project">Project: ${this.escapeHtml(item.project_name)}</p>` : ''}
                        ${item.location ? `<p class="location"><i class="fas fa-map-marker-alt"></i> ${this.escapeHtml(item.location)}</p>` : ''}
                    </div>
                    <div class="task-status">
                        <span class="status ${statusClass}">${this.formatStatus(item.status)}</span>
                        <button class="btn-small" onclick="staffDashboard.handleScheduleAction(${item.id}, '${item.status}')">${this.getActionText(item.status)}</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    displayProjects(projects, errorMsg = null) {
        const projectsList = document.querySelector('.projects-list');
        if (!projectsList) return;
        
        if (errorMsg) {
            projectsList.innerHTML = this.createErrorState('Projects', errorMsg);
            return;
        }
        
        if (projects.length === 0) {
            projectsList.innerHTML = this.createEmptyState(
                'project-diagram',
                'No Assigned Projects',
                "You don't have any projects assigned currently."
            );
            return;
        }

        projectsList.innerHTML = projects.map(project => {
            const progress = Math.max(0, Math.min(100, parseInt(project.progress_percentage) || 0));
            const priorityClass = this.normalizePriority(project.priority);
            const statusClass = this.normalizeStatus(project.status);

            return `
                <div class="project-card" data-project-id="${project.id}">
                    <div class="project-header">
                        <h4>${this.escapeHtml(project.project_name)}</h4>
                        <span class="priority ${priorityClass}">${this.formatPriority(project.priority)}</span>
                    </div>
                    <div class="project-details">
                        <p><strong>Customer:</strong> ${this.escapeHtml(project.customer_name)}</p>
                        <p><strong>Location:</strong> ${this.escapeHtml(project.location)}</p>
                        <p><strong>Status:</strong> <span class="status ${statusClass}">${this.formatStatus(project.status)}</span></p>
                        ${project.estimated_completion ? 
                            `<p><strong>Deadline:</strong> ${this.formatDate(project.estimated_completion)}</p>` : ''}
                        ${project.team_name && project.team_name !== 'Not Assigned' ? 
                            `<p><strong>Team:</strong> ${this.escapeHtml(project.team_name)}</p>` : ''}
                        <div class="progress-section">
                            <label>Progress: ${progress}%</label>
                            <div class="progress-bar">
                                <div class="progress" style="width: ${progress}%"></div>
                            </div>
                        </div>
                    </div>
                    <div class="project-actions">
                        <button class="btn-small" onclick="staffDashboard.viewProjectDetails(${project.id})">View Details</button>
                        <button class="btn-small primary" onclick="staffDashboard.showUpdateProgressModal(${project.id}, ${progress})">Update Progress</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    displayTaskProgress(tasks, errorMsg = null) {
        const taskList = document.querySelector('.task-progress-list');
        if (!taskList) return;
        
        if (errorMsg) {
            taskList.innerHTML = this.createErrorState('Tasks', errorMsg);
            return;
        }
        
        if (tasks.length === 0) {
            taskList.innerHTML = this.createEmptyState(
                'tasks',
                'No Active Tasks',
                "You don't have any active tasks assigned."
            );
            return;
        }

        taskList.innerHTML = tasks.map(task => {
            const statusClass = this.normalizeStatus(task.status);
            const priorityClass = this.normalizePriority(task.priority);

            return `
                <div class="task-item" data-task-id="${task.id}">
                    <div class="task-info">
                        <h4>${this.escapeHtml(task.task_name)}</h4>
                        <p>${this.escapeHtml(task.description)}</p>
                        <p class="project-name"><strong>Project:</strong> ${this.escapeHtml(task.project_name)}</p>
                        ${task.due_date ? `<p class="due-date"><i class="fas fa-clock"></i> Due: ${this.formatDate(task.due_date)}</p>` : ''}
                    </div>
                    <div class="task-status">
                        <span class="priority ${priorityClass}">${this.formatPriority(task.priority)}</span>
                        <span class="status ${statusClass}">${this.formatStatus(task.status)}</span>
                        ${this.getTaskStatusContent(task)}
                        <button class="btn-small primary" onclick="staffDashboard.showUpdateTaskModal(${task.id}, '${task.status}')">Update</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    displayEquipmentStatus(equipment, errorMsg = null) {
        const equipmentGrid = document.querySelector('.equipment-grid');
        if (!equipmentGrid) return;
        
        if (errorMsg) {
            equipmentGrid.innerHTML = this.createErrorState('Equipment', errorMsg);
            return;
        }
        
        if (equipment.length === 0) {
            equipmentGrid.innerHTML = this.createEmptyState(
                'tools',
                'No Equipment Assigned',
                'No equipment is currently assigned to you.'
            );
            return;
        }

        equipmentGrid.innerHTML = equipment.map(item => {
            const statusClass = this.normalizeStatus(item.status);
            return `
                <div class="equipment-item">
                    <i class="fas ${this.getEquipmentIcon(item.equipment_type)}"></i>
                    <h4>${this.escapeHtml(item.equipment_name)}</h4>
                    <span class="status ${statusClass}">${this.formatStatus(item.status)}</span>
                </div>
            `;
        }).join('');
    }

    // Modal-based update methods (replacing prompts)
    showUpdateProgressModal(projectId, currentProgress) {
        const modal = this.createModal('Update Project Progress', `
            <div class="modal-form">
                <div class="form-group">
                    <label for="progress-input">Progress Percentage (0-100)</label>
                    <input type="number" id="progress-input" min="0" max="100" value="${currentProgress}" class="form-control">
                    <div class="progress-preview">
                        <div class="progress-bar">
                            <div class="progress" id="progress-preview-bar" style="width: ${currentProgress}%"></div>
                        </div>
                        <span id="progress-preview-text">${currentProgress}%</span>
                    </div>
                </div>
                <div class="form-group">
                    <label for="notes-input">Notes (Optional)</label>
                    <textarea id="notes-input" class="form-control" rows="3" placeholder="Add any notes about this progress update..."></textarea>
                </div>
                <div class="modal-actions">
                    <button class="btn-secondary" onclick="staffDashboard.closeModal()">Cancel</button>
                    <button class="btn-primary" onclick="staffDashboard.submitProgressUpdate(${projectId})">
                        <i class="fas fa-save"></i> Update Progress
                    </button>
                </div>
            </div>
        `);

        // Add live progress preview
        const progressInput = modal.querySelector('#progress-input');
        const previewBar = modal.querySelector('#progress-preview-bar');
        const previewText = modal.querySelector('#progress-preview-text');

        progressInput.addEventListener('input', (e) => {
            const value = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
            previewBar.style.width = value + '%';
            previewText.textContent = value + '%';
        });
    }

    async submitProgressUpdate(projectId) {
        const progressInput = document.getElementById('progress-input');
        const notesInput = document.getElementById('notes-input');
        
        const progress = parseInt(progressInput.value);
        const notes = notesInput.value.trim();

        if (isNaN(progress) || progress < 0 || progress > 100) {
            this.showError('Please enter a valid progress percentage between 0 and 100');
            return;
        }

        this.showLoading('Updating progress...');

        try {
            const formData = new FormData();
            formData.append('project_id', projectId);
            formData.append('progress', progress);
            formData.append('notes', notes);

            const data = await this.apiCall('update-progress', 'POST', formData);
            
            if (data.success) {
                this.closeModal();
                this.showSuccess('Progress updated successfully!');
                await this.loadAssignedProjects();
            } else {
                throw new Error(data.error || 'Failed to update progress');
            }
        } catch (error) {
            console.error('Error updating progress:', error);
            this.showError(error.message || 'Failed to update progress');
        } finally {
            this.hideLoading();
        }
    }

    showUpdateTaskModal(taskId, currentStatus) {
        const statusOptions = [
            { value: 'pending', label: 'Pending' },
            { value: 'in_progress', label: 'In Progress' },
            { value: 'completed', label: 'Completed' },
            { value: 'on_hold', label: 'On Hold' }
        ];

        const modal = this.createModal('Update Task Status', `
            <div class="modal-form">
                <div class="form-group">
                    <label for="status-select">Task Status</label>
                    <select id="status-select" class="form-control">
                        ${statusOptions.map(opt => 
                            `<option value="${opt.value}" ${opt.value === currentStatus ? 'selected' : ''}>${opt.label}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="form-group" id="hours-group" style="display: none;">
                    <label for="hours-input">Hours Worked</label>
                    <input type="number" id="hours-input" min="0" step="0.5" class="form-control" placeholder="Enter hours worked">
                    <small class="form-text">Enter the total hours spent on this task</small>
                </div>
                <div class="modal-actions">
                    <button class="btn-secondary" onclick="staffDashboard.closeModal()">Cancel</button>
                    <button class="btn-primary" onclick="staffDashboard.submitTaskUpdate(${taskId})">
                        <i class="fas fa-save"></i> Update Task
                    </button>
                </div>
            </div>
        `);

        // Show hours input when status is completed
        const statusSelect = modal.querySelector('#status-select');
        const hoursGroup = modal.querySelector('#hours-group');

        statusSelect.addEventListener('change', (e) => {
            if (e.target.value === 'completed') {
                hoursGroup.style.display = 'block';
            } else {
                hoursGroup.style.display = 'none';
            }
        });

        // Trigger initial check
        if (statusSelect.value === 'completed') {
            hoursGroup.style.display = 'block';
        }
    }

    async submitTaskUpdate(taskId) {
        const statusSelect = document.getElementById('status-select');
        const hoursInput = document.getElementById('hours-input');
        
        const status = statusSelect.value;
        const hours = hoursInput.value ? parseFloat(hoursInput.value) : null;

        if (!status) {
            this.showError('Please select a task status');
            return;
        }

        if (status === 'completed' && (!hours || hours <= 0)) {
            this.showError('Please enter hours worked for completed tasks');
            return;
        }

        this.showLoading('Updating task...');

        try {
            const formData = new FormData();
            formData.append('task_id', taskId);
            formData.append('status', status);
            if (hours !== null) {
                formData.append('hours', hours);
            }

            const data = await this.apiCall('update-task', 'POST', formData);
            
            if (data.success) {
                this.closeModal();
                this.showSuccess('Task updated successfully!');
                await this.loadTaskProgress();
            } else {
                throw new Error(data.error || 'Failed to update task');
            }
        } catch (error) {
            console.error('Error updating task:', error);
            this.showError(error.message || 'Failed to update task');
        } finally {
            this.hideLoading();
        }
    }

    handleScheduleAction(scheduleId, status) {
        // For now, just show details
        this.showInfo(`Schedule item ${scheduleId} - Status: ${this.formatStatus(status)}`);
    }

    viewProjectDetails(projectId) {
        this.showInfo(`Detailed project view for project ${projectId} would open here. This feature will be implemented in the next phase.`);
    }

    // Modal creation utility
    createModal(title, content) {
        // Remove existing modal if any
        this.closeModal();

        const modalHTML = `
            <div class="modal-overlay" id="dashboard-modal">
                <div class="modal-container">
                    <div class="modal-header">
                        <h3>${this.escapeHtml(title)}</h3>
                        <button class="modal-close" onclick="staffDashboard.closeModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        ${content}
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modal = document.getElementById('dashboard-modal');
        
        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });

        // Close on escape key
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);

        return modal;
    }

    closeModal() {
        const modal = document.getElementById('dashboard-modal');
        if (modal) {
            modal.remove();
        }
    }

    // Empty state creator
    createEmptyState(icon, title, message) {
        return `
            <div class="empty-state">
                <i class="fas fa-${icon}"></i>
                <h3>${this.escapeHtml(title)}</h3>
                <p>${this.escapeHtml(message)}</p>
            </div>
        `;
    }

    // Error state creator
    createErrorState(section, errorMsg) {
        return `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Could Not Load ${this.escapeHtml(section)}</h3>
                <p>${this.escapeHtml(errorMsg)}</p>
                <button class="btn-small primary" onclick="staffDashboard.init()">
                    <i class="fas fa-sync"></i> Retry
                </button>
            </div>
        `;
    }

    setupEventListeners() {
        this.setupQuickActions();
        this.setupMessageInput();
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

    setupAutoRefresh() {
        // Refresh schedule every 5 minutes
        const scheduleInterval = setInterval(() => {
            this.loadTodaySchedule();
        }, 5 * 60 * 1000);

        this.updateIntervals.push(scheduleInterval);
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
                this.showInfo('Quick action: ' + actionText);
        }
    }

    sendMessage() {
        const messageInput = document.querySelector('.message-input input');
        if (!messageInput || !messageInput.value.trim()) return;
        
        const message = messageInput.value.trim();
        messageInput.value = '';
        
        this.addMessageToList({
            sender: 'You',
            time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            content: message,
            type: 'user'
        });
        
        this.showSuccess('Message sent to team!');
    }

    addMessageToList(message) {
        const messagesList = document.querySelector('.messages-list');
        if (!messagesList) return;
        
        const messageElement = document.createElement('div');
        messageElement.className = 'message-item';
        messageElement.innerHTML = `
            <div class="message-sender">
                <i class="fas fa-user"></i>
                <strong>${this.escapeHtml(message.sender)}</strong>
                <span class="time">${this.escapeHtml(message.time)}</span>
            </div>
            <div class="message-content">
                <p>${this.escapeHtml(message.content)}</p>
            </div>
        `;
        
        messagesList.appendChild(messageElement);
        messagesList.scrollTop = messagesList.scrollHeight;
    }

    // Quick action implementations
    handleClockInOut() {
        const isClocked = localStorage.getItem('clockedIn') === 'true';
        const action = isClocked ? 'Clock Out' : 'Clock In';
        
        if (confirm(`Are you sure you want to ${action}?`)) {
            localStorage.setItem('clockedIn', !isClocked);
            const time = new Date().toLocaleTimeString();
            this.showSuccess(`Successfully ${action.toLowerCase()}ed at ${time}`);
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
        this.showInfo('Photo upload functionality coming soon. Staff will be able to document work progress with photos.');
    }

    openReportForm() {
        this.showInfo('Daily report form coming soon for submitting work summaries.');
    }

    openMaterialRequest() {
        this.showInfo('Material request form coming soon for requesting additional supplies.');
    }

    contactSupervisor() {
        if (confirm('Contact supervisor via phone?')) {
            window.open('tel:' + CONFIG.COMPANY_PHONE);
        }
    }

    openIssueReport() {
        this.showInfo('Issue reporting form coming soon for reporting problems or safety concerns.');
    }

    // Notification methods
    showLoading(message = 'Loading...') {
        const loadingEl = document.getElementById('loading-screen');
        if (loadingEl) {
            loadingEl.style.display = 'flex';
            const loadingText = loadingEl.querySelector('p');
            if (loadingText) loadingText.textContent = message;
        }
    }

    hideLoading() {
        const loadingEl = document.getElementById('loading-screen');
        if (loadingEl) {
            loadingEl.style.display = 'none';
        }
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

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };

        notification.innerHTML = `
            <i class="fas fa-${icons[type]}"></i>
            <span>${this.escapeHtml(message)}</span>
            <button onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>
        `;
        
        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.classList.add('fade-out');
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showWarning(message) {
        this.showNotification(message, 'warning');
    }

    showInfo(message) {
        this.showNotification(message, 'info');
    }

    // Utility functions
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString(CONFIG.LOCALE, { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }

    formatTime(date) {
        const timeString = date.toLocaleTimeString(CONFIG.LOCALE, {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
        const parts = timeString.split(' ');
        return {
            hour: parts[0],
            period: parts[1] || ''
        };
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
        return statusMap[status] || status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    formatPriority(priority) {
        const priorityMap = {
            'urgent': 'Urgent',
            'high': 'High Priority',
            'medium': 'Medium Priority',
            'low': 'Low Priority'
        };
        return priorityMap[priority] || priority.replace(/\b\w/g, l => l.toUpperCase());
    }

    normalizeStatus(status) {
        return status.replace(/_/g, '-');
    }

    normalizePriority(priority) {
        return priority.replace(/_/g, '-');
    }

    getActionText(status) {
        const actionMap = {
            'scheduled': 'Start',
            'in_progress': 'Update',
            'confirmed': 'Start',
            'pending': 'Review',
            'completed': 'View'
        };
        return actionMap[status] || 'Update';
    }

    getTaskStatusContent(task) {
        const status = task.status;
        
        switch(status) {
            case 'completed':
                return task.completed_date ? 
                    `<div class="completion-time">Completed: ${this.formatDate(task.completed_date)}</div>` : '';
            case 'in_progress':
                const estimatedHours = parseFloat(task.estimated_hours) || 0;
                const actualHours = parseFloat(task.actual_hours) || 0;
                const progress = estimatedHours > 0 ? 
                    Math.min(100, Math.round((actualHours / estimatedHours) * 100)) : 0;
                return `
                    <div class="progress-small">
                        <div class="progress" style="width: ${progress}%"></div>
                    </div>
                    <div class="estimated-time">${actualHours}h / ${estimatedHours}h</div>
                `;
            case 'pending':
                return task.due_date ? 
                    `<div class="estimated-time">Due: ${this.formatDate(task.due_date)}</div>` : '';
            default:
                return '';
        }
    }

    getEquipmentIcon(equipmentType) {
        const iconMap = {
            'tools': 'tools',
            'spray': 'spray-can',
            'safety': 'hard-hat',
            'vehicle': 'truck',
            'machinery': 'cogs',
            'measurement': 'ruler',
            'general': 'toolbox'
        };
        return iconMap[equipmentType] || 'tools';
    }

    isCurrentAppointment(appointmentTime) {
        const now = new Date();
        const diffMinutes = Math.abs(now - appointmentTime) / (1000 * 60);
        return diffMinutes <= 30;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Cleanup on page unload
    destroy() {
        this.updateIntervals.forEach(interval => clearInterval(interval));
        this.updateIntervals = [];
    }
}

// Initialize staff dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.staffDashboard = new StaffDashboardManager();
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        if (window.staffDashboard) {
            window.staffDashboard.destroy();
        }
    });
});

// Global logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('clockedIn');
        sessionStorage.clear();
        window.location.href = 'auth.html';
    }
}