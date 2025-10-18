<?php
// staff-api.php - Fixed Staff Dashboard API
// File: backend/staff-api.php

define('INCLUDED', true);
require_once __DIR__ . '/config.php';

// Set JSON header
header('Content-Type: application/json');

// CSRF Protection
session_start();
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $token = $_POST['csrf_token'] ?? $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (!hash_equals($_SESSION['csrf_token'] ?? '', $token)) {
        Response::error('Invalid CSRF token', 403);
    }
}

// Check if user is logged in and is staff
if (!User::isLoggedIn()) {
    Response::unauthorized('Please login to access staff panel');
}

if (!User::hasRole('staff')) {
    Response::forbidden('Staff access required');
}

// Get current user
$currentUser = User::getCurrentUser();
$staffId = $currentUser['id'];

// Get action
$action = isset($_GET['action']) ? $_GET['action'] : '';

// Route requests
switch ($action) {
    case 'schedule':
        handleSchedule();
        break;
        
    case 'projects':
        handleProjects();
        break;
        
    case 'tasks':
        handleTasks();
        break;
        
    case 'equipment':
        handleEquipment();
        break;
        
    case 'update-progress':
        handleUpdateProgress();
        break;
        
    case 'update-task':
        handleUpdateTask();
        break;
    
    case 'get-csrf':
        handleGetCsrf();
        break;
        
    default:
        Response::error('Invalid action', 400);
}

// ============================================
// GET CSRF TOKEN
// ============================================
function handleGetCsrf() {
    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    Response::success('CSRF token generated', ['csrf_token' => $_SESSION['csrf_token']]);
}

// ============================================
// TODAY'S SCHEDULE
// ============================================
function handleSchedule() {
    global $db, $staffId;
    
    try {
        // Check if appointments table exists
        $tableExists = $db->fetchOne("SHOW TABLES LIKE 'appointments'");
        
        if (!$tableExists) {
            Response::success('Schedule retrieved', ['schedule' => [], 'info' => 'Appointments feature not yet configured']);
            return;
        }
        
        // Use UTC for consistent date handling
        $today = gmdate('Y-m-d');
        $tomorrow = gmdate('Y-m-d', strtotime('+1 day'));
        
        $schedule = $db->fetchAll(
            "SELECT 
                a.id,
                a.appointment_type,
                a.description,
                a.appointment_date,
                a.status,
                a.location,
                CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')) as customer_name,
                COALESCE(p.project_name, 'N/A') as project_name
             FROM appointments a
             LEFT JOIN users u ON a.user_id = u.id
             LEFT JOIN projects p ON a.project_id = p.id
             WHERE a.assigned_staff_id = ?
             AND a.appointment_date >= ?
             AND a.appointment_date < ?
             ORDER BY a.appointment_date ASC",
            [$staffId, $today, $tomorrow]
        );
        
        Response::success('Schedule retrieved', [
            'schedule' => $schedule,
            'count' => count($schedule)
        ]);
        
    } catch (Exception $e) {
        error_log("Staff Schedule Error: " . $e->getMessage());
        Response::success('Schedule retrieved', ['schedule' => [], 'error' => 'Could not load schedule']);
    }
}

// ============================================
// ASSIGNED PROJECTS
// ============================================
function handleProjects() {
    global $db, $staffId;
    
    try {
        $tableExists = $db->fetchOne("SHOW TABLES LIKE 'projects'");
        
        if (!$tableExists) {
            Response::success('Projects retrieved', ['projects' => [], 'info' => 'Projects feature not yet configured']);
            return;
        }
        
        $projects = $db->fetchAll(
            "SELECT 
                p.id,
                p.project_name,
                p.location,
                p.status,
                COALESCE(p.priority, 'medium') as priority,
                COALESCE(p.progress_percentage, 0) as progress_percentage,
                p.estimated_completion,
                CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, 'Unknown')) as customer_name,
                COALESCE(t.team_name, 'Not Assigned') as team_name
             FROM projects p
             LEFT JOIN users u ON p.user_id = u.id
             LEFT JOIN teams t ON p.team_id = t.id
             WHERE p.assigned_staff_id = ? 
             AND p.status IN ('scheduled', 'in_progress')
             ORDER BY 
                CASE p.priority 
                    WHEN 'urgent' THEN 1
                    WHEN 'high' THEN 2
                    WHEN 'medium' THEN 3
                    WHEN 'low' THEN 4
                    ELSE 5
                END,
                p.estimated_completion ASC",
            [$staffId]
        );
        
        // Ensure progress_percentage is integer
        foreach ($projects as &$project) {
            $project['progress_percentage'] = max(0, min(100, (int)$project['progress_percentage']));
        }
        
        Response::success('Projects retrieved', [
            'projects' => $projects,
            'count' => count($projects)
        ]);
        
    } catch (Exception $e) {
        error_log("Staff Projects Error: " . $e->getMessage());
        Response::success('Projects retrieved', ['projects' => [], 'error' => 'Could not load projects']);
    }
}

// ============================================
// TASKS LIST
// ============================================
function handleTasks() {
    global $db, $staffId;
    
    try {
        $tableExists = $db->fetchOne("SHOW TABLES LIKE 'tasks'");
        
        if (!$tableExists) {
            Response::success('Tasks retrieved', ['tasks' => [], 'info' => 'Tasks feature not yet configured']);
            return;
        }
        
        $tasks = $db->fetchAll(
            "SELECT 
                t.id,
                t.task_name,
                t.description,
                t.status,
                COALESCE(t.priority, 'medium') as priority,
                COALESCE(t.estimated_hours, 0) as estimated_hours,
                COALESCE(t.actual_hours, 0) as actual_hours,
                t.due_date,
                t.completed_date,
                COALESCE(p.project_name, 'General Task') as project_name
             FROM tasks t
             LEFT JOIN projects p ON t.project_id = p.id
             WHERE t.assigned_to_staff_id = ?
             AND t.status IN ('pending', 'in_progress')
             ORDER BY 
                CASE t.priority 
                    WHEN 'urgent' THEN 1
                    WHEN 'high' THEN 2
                    WHEN 'medium' THEN 3
                    WHEN 'low' THEN 4
                    ELSE 5
                END,
                t.due_date ASC
             LIMIT 10",
            [$staffId]
        );
        
        Response::success('Tasks retrieved', [
            'tasks' => $tasks,
            'count' => count($tasks)
        ]);
        
    } catch (Exception $e) {
        error_log("Staff Tasks Error: " . $e->getMessage());
        Response::success('Tasks retrieved', ['tasks' => [], 'error' => 'Could not load tasks']);
    }
}

// ============================================
// EQUIPMENT STATUS
// ============================================
function handleEquipment() {
    global $db, $staffId;
    
    try {
        $tableExists = $db->fetchOne("SHOW TABLES LIKE 'equipment'");
        
        if (!$tableExists) {
            Response::success('Equipment retrieved', ['equipment' => [], 'info' => 'Equipment feature not yet configured']);
            return;
        }
        
        $equipment = $db->fetchAll(
            "SELECT 
                id,
                equipment_name,
                COALESCE(equipment_type, 'general') as equipment_type,
                COALESCE(status, 'available') as status
             FROM equipment
             WHERE assigned_to_staff_id = ? OR status = 'available'
             ORDER BY 
                CASE status
                    WHEN 'in_use' THEN 1
                    WHEN 'available' THEN 2
                    WHEN 'maintenance' THEN 3
                    ELSE 4
                END,
                equipment_name ASC",
            [$staffId]
        );
        
        Response::success('Equipment retrieved', [
            'equipment' => $equipment,
            'count' => count($equipment)
        ]);
        
    } catch (Exception $e) {
        error_log("Equipment Error: " . $e->getMessage());
        Response::success('Equipment retrieved', ['equipment' => [], 'error' => 'Could not load equipment']);
    }
}

// ============================================
// UPDATE PROJECT PROGRESS
// ============================================
function handleUpdateProgress() {
    global $db, $staffId;
    
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        Response::error('Method not allowed', 405);
    }
    
    $projectId = isset($_POST['project_id']) ? (int)$_POST['project_id'] : 0;
    $progress = isset($_POST['progress']) ? (int)$_POST['progress'] : 0;
    $notes = isset($_POST['notes']) ? trim($_POST['notes']) : '';
    
    // Validation
    if (!$projectId) {
        Response::error('Project ID is required');
    }
    
    if ($progress < 0 || $progress > 100) {
        Response::error('Progress must be between 0 and 100');
    }
    
    try {
        // Verify project is assigned to this staff
        $project = $db->fetchOne(
            "SELECT id, status FROM projects WHERE id = ? AND assigned_staff_id = ?",
            [$projectId, $staffId]
        );
        
        if (!$project) {
            Response::forbidden('Project not assigned to you');
        }
        
        // Update progress
        $status = $progress == 100 ? 'completed' : 'in_progress';
        $completionDate = $progress == 100 ? gmdate('Y-m-d H:i:s') : null;
        
        $db->execute(
            "UPDATE projects 
             SET progress_percentage = ?, 
                 status = ?,
                 completion_date = ?,
                 updated_at = NOW() 
             WHERE id = ?",
            [$progress, $status, $completionDate, $projectId]
        );
        
        // Log the update if notes provided
        if ($notes && $db->fetchOne("SHOW TABLES LIKE 'project_logs'")) {
            $db->execute(
                "INSERT INTO project_logs (project_id, user_id, action, notes, created_at)
                 VALUES (?, ?, 'progress_update', ?, NOW())",
                [$projectId, $staffId, "Progress updated to {$progress}%. {$notes}"]
            );
        }
        
        Response::success('Project progress updated successfully', [
            'project_id' => $projectId,
            'progress' => $progress,
            'status' => $status
        ]);
        
    } catch (Exception $e) {
        error_log("Update Progress Error: " . $e->getMessage());
        Response::serverError('Failed to update progress');
    }
}

// ============================================
// UPDATE TASK STATUS
// ============================================
function handleUpdateTask() {
    global $db, $staffId;
    
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        Response::error('Method not allowed', 405);
    }
    
    $taskId = isset($_POST['task_id']) ? (int)$_POST['task_id'] : 0;
    $status = isset($_POST['status']) ? trim($_POST['status']) : '';
    $hours = isset($_POST['hours']) ? (float)$_POST['hours'] : null;
    
    // Validation
    if (!$taskId || !$status) {
        Response::error('Task ID and status are required');
    }
    
    $validStatuses = ['pending', 'in_progress', 'completed', 'on_hold'];
    if (!in_array($status, $validStatuses)) {
        Response::error('Invalid status. Must be one of: ' . implode(', ', $validStatuses));
    }
    
    if ($hours !== null && $hours < 0) {
        Response::error('Hours must be a positive number');
    }
    
    try {
        // Verify task is assigned to this staff
        $task = $db->fetchOne(
            "SELECT id FROM tasks WHERE id = ? AND assigned_to_staff_id = ?",
            [$taskId, $staffId]
        );
        
        if (!$task) {
            Response::forbidden('Task not assigned to you');
        }
        
        // Update task
        $completedDate = $status === 'completed' ? gmdate('Y-m-d H:i:s') : null;
        
        if ($hours !== null) {
            $db->execute(
                "UPDATE tasks 
                 SET status = ?, 
                     actual_hours = ?,
                     completed_date = ?,
                     updated_at = NOW() 
                 WHERE id = ?",
                [$status, $hours, $completedDate, $taskId]
            );
        } else {
            $db->execute(
                "UPDATE tasks 
                 SET status = ?,
                     completed_date = ?,
                     updated_at = NOW() 
                 WHERE id = ?",
                [$status, $completedDate, $taskId]
            );
        }
        
        Response::success('Task updated successfully', [
            'task_id' => $taskId,
            'status' => $status,
            'hours' => $hours
        ]);
        
    } catch (Exception $e) {
        error_log("Update Task Error: " . $e->getMessage());
        Response::serverError('Failed to update task');
    }
}
?>