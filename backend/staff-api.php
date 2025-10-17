<?php
// staff-api.php - Staff Dashboard API
// File: backend/staff-api.php

define('INCLUDED', true);
require_once __DIR__ . '/config.php';

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
        
    default:
        Response::error('Invalid action', 400);
}

// ============================================
// TODAY'S SCHEDULE
// ============================================
function handleSchedule() {
    global $db, $staffId;
    
    try {
        $schedule = $db->fetchAll(
            "SELECT 
                a.id,
                a.appointment_type,
                a.description,
                a.appointment_date,
                a.status,
                a.location,
                CONCAT(u.first_name, ' ', u.last_name) as customer_name,
                p.project_name
             FROM appointments a
             LEFT JOIN users u ON a.user_id = u.id
             LEFT JOIN projects p ON a.project_id = p.id
             WHERE a.assigned_staff_id = ?
             AND DATE(a.appointment_date) = CURDATE()
             ORDER BY a.appointment_date ASC",
            [$staffId]
        );
        
        Response::success('Schedule retrieved', ['schedule' => $schedule]);
        
    } catch (Exception $e) {
        error_log("Staff Schedule Error: " . $e->getMessage());
        Response::serverError('Failed to load schedule');
    }
}

// ============================================
// ASSIGNED PROJECTS
// ============================================
function handleProjects() {
    global $db, $staffId;
    
    try {
        $projects = $db->fetchAll(
            "SELECT 
                p.id,
                p.project_name,
                p.location,
                p.status,
                p.priority,
                p.progress_percentage,
                p.estimated_completion,
                CONCAT(u.first_name, ' ', u.last_name) as customer_name,
                t.team_name
             FROM projects p
             LEFT JOIN users u ON p.user_id = u.id
             LEFT JOIN teams t ON p.team_id = t.id
             WHERE p.assigned_staff_id = ? 
             AND p.status IN ('scheduled', 'in_progress')
             ORDER BY p.priority DESC, p.estimated_completion ASC",
            [$staffId]
        );
        
        Response::success('Projects retrieved', ['projects' => $projects]);
        
    } catch (Exception $e) {
        error_log("Staff Projects Error: " . $e->getMessage());
        Response::serverError('Failed to load projects');
    }
}

// ============================================
// TASKS LIST
// ============================================
function handleTasks() {
    global $db, $staffId;
    
    try {
        $tasks = $db->fetchAll(
            "SELECT 
                t.id,
                t.task_name,
                t.description,
                t.status,
                t.priority,
                t.estimated_hours,
                t.actual_hours,
                t.due_date,
                t.completed_date,
                p.project_name
             FROM tasks t
             LEFT JOIN projects p ON t.project_id = p.id
             WHERE t.assigned_to_staff_id = ?
             AND t.status IN ('pending', 'in_progress')
             ORDER BY t.priority DESC, t.due_date ASC
             LIMIT 10",
            [$staffId]
        );
        
        Response::success('Tasks retrieved', ['tasks' => $tasks]);
        
    } catch (Exception $e) {
        error_log("Staff Tasks Error: " . $e->getMessage());
        Response::serverError('Failed to load tasks');
    }
}

// ============================================
// EQUIPMENT STATUS
// ============================================
function handleEquipment() {
    global $db, $staffId;
    
    try {
        $equipment = $db->fetchAll(
            "SELECT 
                id,
                equipment_name,
                equipment_type,
                status
             FROM equipment
             WHERE assigned_to_staff_id = ? OR status = 'available'
             ORDER BY status ASC, equipment_name ASC",
            [$staffId]
        );
        
        Response::success('Equipment retrieved', ['equipment' => $equipment]);
        
    } catch (Exception $e) {
        error_log("Equipment Error: " . $e->getMessage());
        Response::serverError('Failed to load equipment');
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
    
    if (!$projectId) {
        Response::error('Project ID is required');
    }
    
    if ($progress < 0 || $progress > 100) {
        Response::error('Progress must be between 0 and 100');
    }
    
    try {
        // Verify project is assigned to this staff
        $project = $db->fetchOne(
            "SELECT id FROM projects WHERE id = ? AND assigned_staff_id = ?",
            [$projectId, $staffId]
        );
        
        if (!$project) {
            Response::forbidden('Project not assigned to you');
        }
        
        // Update progress
        $status = $progress == 100 ? 'completed' : 'in_progress';
        $completionDate = $progress == 100 ? date('Y-m-d') : null;
        
        $db->execute(
            "UPDATE projects 
             SET progress_percentage = ?, 
                 status = ?,
                 completion_date = ?,
                 updated_at = NOW() 
             WHERE id = ?",
            [$progress, $status, $completionDate, $projectId]
        );
        
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
    
    if (!$taskId || !$status) {
        Response::error('Task ID and status are required');
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
        $completedDate = $status === 'completed' ? date('Y-m-d') : null;
        
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
            'status' => $status
        ]);
        
    } catch (Exception $e) {
        error_log("Update Task Error: " . $e->getMessage());
        Response::serverError('Failed to update task');
    }
}
?>