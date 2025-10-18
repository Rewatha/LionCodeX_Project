<?php
// admin-api.php - Admin Dashboard API
// File: backend/admin-api.php

define('INCLUDED', true);
require_once __DIR__ . '/config.php';

// Check if user is logged in and is admin
if (!User::isLoggedIn()) {
    Response::unauthorized('Please login to access admin panel');
}

if (!User::hasRole('admin')) {
    Response::forbidden('Admin access required');
}

// Get current user
$currentUser = User::getCurrentUser();

// Get action
$action = isset($_GET['action']) ? $_GET['action'] : '';

// Route requests
switch ($action) {
    case 'overview':
        handleOverview();
        break;

    case 'inquiries':
        handleInquiries();
        break;

    case 'inquiry-details':
        handleInquiryDetails();
        break;

    case 'projects':
        handleProjects();
        break;

    case 'team-status':
        handleTeamStatus();
        break;

    case 'revenue':
        handleRevenue();
        break;

    case 'assign-inquiry':
        handleAssignInquiry();
        break;

    case 'update-project':
        handleUpdateProject();
        break;

    case 'get-customers':
        handleGetCustomers();
        break;

    case 'get-teams':
        handleGetTeams();
        break;

    case 'create-project':
        handleCreateProject();
        break;

    case 'create-customer':
        handleCreateCustomer();
        break;

    default:
        Response::error('Invalid action', 400);
}

// ============================================
// ADMIN OVERVIEW
// ============================================
function handleOverview()
{
    global $db;

    try {
        // Total customers
        $totalCustomers = $db->fetchOne(
            "SELECT COUNT(*) as count FROM users WHERE user_type IN ('individual', 'business', 'contractor')"
        )['count'];

        // Active projects
        $activeProjects = $db->fetchOne(
            "SELECT COUNT(*) as count FROM projects WHERE status IN ('scheduled', 'in_progress')"
        )['count'];

        // New inquiries
        $newInquiries = $db->fetchOne(
            "SELECT COUNT(*) as count FROM inquiries WHERE status = 'new'"
        )['count'];

        // Monthly revenue (current month)
        $monthlyRevenue = $db->fetchOne(
            "SELECT COALESCE(SUM(actual_cost), 0) as total 
             FROM projects 
             WHERE status = 'completed' 
             AND MONTH(completion_date) = MONTH(CURRENT_DATE())
             AND YEAR(completion_date) = YEAR(CURRENT_DATE())"
        )['total'];

        Response::success('Admin overview retrieved', [
            'totalCustomers' => (int) $totalCustomers,
            'activeProjects' => (int) $activeProjects,
            'newInquiries' => (int) $newInquiries,
            'monthlyRevenue' => 'LKR ' . number_format($monthlyRevenue, 2)
        ]);

    } catch (Exception $e) {
        error_log("Admin Overview Error: " . $e->getMessage());
        Response::serverError('Failed to load overview data');
    }
}

// ============================================
// INQUIRIES LIST
// ============================================
function handleInquiries()
{
    global $db;

    try {
        $inquiries = $db->fetchAll(
            "SELECT 
                i.id,
                i.first_name,
                i.last_name,
                CONCAT(i.first_name, ' ', i.last_name) as name,
                i.email,
                i.phone,
                i.service_type,
                i.message,
                i.status,
                i.created_at,
                u.email as user_email
             FROM inquiries i
             LEFT JOIN users u ON i.user_id = u.id
             ORDER BY i.created_at DESC 
             LIMIT 20"
        );

        Response::success('Inquiries retrieved', ['inquiries' => $inquiries]);

    } catch (Exception $e) {
        error_log("Admin Inquiries Error: " . $e->getMessage());
        Response::serverError('Failed to load inquiries');
    }
}

// ============================================
// PROJECTS LIST
// ============================================
function handleProjects()
{
    global $db;

    try {
        $projects = $db->fetchAll(
            "SELECT 
                p.id,
                p.project_name,
                CONCAT(u.first_name, ' ', u.last_name) as customer_name,
                t.team_name,
                p.progress_percentage,
                p.estimated_completion,
                p.status
             FROM projects p
             LEFT JOIN users u ON p.user_id = u.id
             LEFT JOIN teams t ON p.team_id = t.id
             WHERE p.status IN ('scheduled', 'in_progress')
             ORDER BY p.created_at DESC 
             LIMIT 20"
        );

        Response::success('Projects retrieved', ['projects' => $projects]);

    } catch (Exception $e) {
        error_log("Admin Projects Error: " . $e->getMessage());
        Response::serverError('Failed to load projects');
    }
}

// ============================================
// TEAM STATUS
// ============================================
function handleTeamStatus()
{
    global $db;

    try {
        $teamMembers = $db->fetchAll(
            "SELECT 
                u.id,
                u.first_name,
                u.last_name,
                CASE 
                    WHEN u.id IN (SELECT assigned_staff_id FROM projects WHERE status = 'in_progress') 
                    THEN 'on-site'
                    ELSE 'available'
                END as status,
                t.team_name,
                'Team Member' as role
             FROM users u
             LEFT JOIN projects p ON u.id = p.assigned_staff_id AND p.status = 'in_progress'
             LEFT JOIN teams t ON p.team_id = t.id
             WHERE u.user_type = 'staff' AND u.status = 'active'
             GROUP BY u.id
             ORDER BY u.first_name"
        );

        Response::success('Team status retrieved', ['team_members' => $teamMembers]);

    } catch (Exception $e) {
        error_log("Team Status Error: " . $e->getMessage());
        Response::serverError('Failed to load team status');
    }
}

// ============================================
// REVENUE DATA
// ============================================
function handleRevenue()
{
    global $db;

    try {
        // Get last 6 months revenue
        $revenueData = $db->fetchAll(
            "SELECT 
                DATE_FORMAT(completion_date, '%b') as month,
                COALESCE(SUM(actual_cost), 0) as revenue
             FROM projects
             WHERE status = 'completed'
             AND completion_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 MONTH)
             GROUP BY YEAR(completion_date), MONTH(completion_date)
             ORDER BY completion_date ASC"
        );

        // Calculate percentages for chart
        $maxRevenue = 0;
        foreach ($revenueData as $data) {
            if ($data['revenue'] > $maxRevenue) {
                $maxRevenue = $data['revenue'];
            }
        }

        foreach ($revenueData as &$data) {
            $data['percentage'] = $maxRevenue > 0 ? ($data['revenue'] / $maxRevenue) * 100 : 0;
            $data['revenue'] = (float) $data['revenue'];
        }

        Response::success('Revenue data retrieved', ['revenue_data' => $revenueData]);

    } catch (Exception $e) {
        error_log("Revenue Error: " . $e->getMessage());
        Response::serverError('Failed to load revenue data');
    }
}

// ============================================
// ASSIGN/RESPOND TO INQUIRY
// ============================================
function handleAssignInquiry()
{
    global $db;

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        Response::error('Method not allowed', 405);
    }

    $inquiryId = isset($_POST['inquiry_id']) ? (int) $_POST['inquiry_id'] : 0;
    $status = isset($_POST['status']) ? $_POST['status'] : 'contacted';
    $response = isset($_POST['response']) ? trim($_POST['response']) : '';

    if (!$inquiryId) {
        Response::error('Inquiry ID is required');
    }

    try {
        $db->execute(
            "UPDATE inquiries SET status = ?, response = ?, updated_at = NOW() WHERE id = ?",
            [$status, $response, $inquiryId]
        );

        Response::success('Inquiry updated successfully');

    } catch (Exception $e) {
        error_log("Assign Inquiry Error: " . $e->getMessage());
        Response::serverError('Failed to update inquiry');
    }
}

// ============================================
// UPDATE PROJECT
// ============================================
function handleUpdateProject()
{
    global $db;

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        Response::error('Method not allowed', 405);
    }

    $projectId = isset($_POST['project_id']) ? (int) $_POST['project_id'] : 0;
    $status = isset($_POST['status']) ? $_POST['status'] : '';

    if (!$projectId || !$status) {
        Response::error('Project ID and status are required');
    }

    try {
        $db->execute(
            "UPDATE projects SET status = ?, updated_at = NOW() WHERE id = ?",
            [$status, $projectId]
        );

        Response::success('Project updated successfully');

    } catch (Exception $e) {
        error_log("Update Project Error: " . $e->getMessage());
        Response::serverError('Failed to update project');
    }
}

// ============================================
// INQUIRY DETAILS
// ============================================
function handleInquiryDetails()
{
    global $db;

    $inquiryId = isset($_GET['inquiry_id']) ? (int) $_GET['inquiry_id'] : 0;

    if (!$inquiryId) {
        Response::error('Inquiry ID is required');
    }

    try {
        $inquiry = $db->fetchOne(
            "SELECT 
                i.*,
                CONCAT(i.first_name, ' ', i.last_name) as name,
                u.email as user_email
             FROM inquiries i
             LEFT JOIN users u ON i.user_id = u.id
             WHERE i.id = ?",
            [$inquiryId]
        );

        if (!$inquiry) {
            Response::notFound('Inquiry not found');
        }

        Response::success('Inquiry details retrieved', ['inquiry' => $inquiry]);

    } catch (Exception $e) {
        error_log("Inquiry Details Error: " . $e->getMessage());
        Response::serverError('Failed to load inquiry details');
    }
}

// ============================================
// GET CUSTOMERS LIST
// ============================================
function handleGetCustomers()
{
    global $db;

    try {
        $customers = $db->fetchAll(
            "SELECT id, first_name, last_name, email 
             FROM users 
             WHERE user_type IN ('individual', 'business', 'contractor') 
             AND status = 'active'
             ORDER BY first_name, last_name"
        );

        Response::success('Customers retrieved', ['customers' => $customers]);

    } catch (Exception $e) {
        error_log("Get Customers Error: " . $e->getMessage());
        Response::serverError('Failed to load customers');
    }
}

// ============================================
// GET TEAMS LIST
// ============================================
function handleGetTeams()
{
    global $db;

    try {
        $teams = $db->fetchAll(
            "SELECT id, team_name 
             FROM teams 
             WHERE status = 'active'
             ORDER BY team_name"
        );

        Response::success('Teams retrieved', ['teams' => $teams]);

    } catch (Exception $e) {
        error_log("Get Teams Error: " . $e->getMessage());
        Response::serverError('Failed to load teams');
    }
}

// ============================================
// CREATE PROJECT
// ============================================
function handleCreateProject()
{
    global $db;

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        Response::error('Method not allowed', 405);
    }

    // Get form data
    $projectName = isset($_POST['projectName']) ? trim($_POST['projectName']) : '';
    $customerId = isset($_POST['customerId']) ? (int) $_POST['customerId'] : 0;
    $projectType = isset($_POST['projectType']) ? trim($_POST['projectType']) : '';
    $location = isset($_POST['location']) ? trim($_POST['location']) : '';
    $teamId = isset($_POST['teamId']) ? (int) $_POST['teamId'] : null;
    $startDate = isset($_POST['startDate']) ? $_POST['startDate'] : null;
    $estimatedCompletion = isset($_POST['estimatedCompletion']) ? $_POST['estimatedCompletion'] : null;
    $estimatedCost = isset($_POST['estimatedCost']) ? (float) $_POST['estimatedCost'] : null;
    $status = isset($_POST['status']) ? $_POST['status'] : 'planning';
    $description = isset($_POST['description']) ? trim($_POST['description']) : '';

    // Validate required fields
    if (empty($projectName) || !$customerId || empty($projectType) || empty($location) || empty($startDate)) {
        Response::error('Please fill in all required fields');
    }

    // If teamId is 0 or empty, set to NULL
    if (empty($teamId)) {
        $teamId = null;
    }

    // If estimatedCompletion is empty, set to NULL
    if (empty($estimatedCompletion)) {
        $estimatedCompletion = null;
    }

    // If estimatedCost is empty or 0, set to NULL
    if (empty($estimatedCost)) {
        $estimatedCost = null;
    }

    try {
        // Insert project
        $db->execute(
            "INSERT INTO projects (
                project_name, user_id, project_type, location, team_id,
                start_date, estimated_completion, estimated_cost, status,
                description, progress_percentage, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NOW())",
            [
                $projectName,
                $customerId,
                $projectType,
                $location,
                $teamId,
                $startDate,
                $estimatedCompletion,
                $estimatedCost,
                $status,
                $description
            ]
        );

        // Get the inserted project ID using PDO method
        $projectId = $db->getConnection()->lastInsertId();

        Response::success('Project created successfully', [
            'project_id' => (int) $projectId
        ]);

    } catch (Exception $e) {
        error_log("Create Project Error: " . $e->getMessage());
        Response::serverError('Failed to create project: ' . $e->getMessage());
    }
}

// ============================================
// CREATE CUSTOMER
// ============================================
function handleCreateCustomer()
{
    global $db;

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        Response::error('Method not allowed', 405);
    }

    // Get form data
    $firstName = isset($_POST['firstName']) ? trim($_POST['firstName']) : '';
    $lastName = isset($_POST['lastName']) ? trim($_POST['lastName']) : '';
    $email = isset($_POST['email']) ? trim($_POST['email']) : '';
    $phone = isset($_POST['phone']) ? trim($_POST['phone']) : '';
    $userType = isset($_POST['userType']) ? $_POST['userType'] : '';
    $status = isset($_POST['status']) ? $_POST['status'] : 'active';
    $password = isset($_POST['password']) ? $_POST['password'] : '';

    // Validate required fields
    if (empty($firstName) || empty($lastName) || empty($email) || empty($phone) || empty($userType) || empty($password)) {
        Response::error('Please fill in all required fields');
    }

    // Validate email format
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        Response::error('Invalid email format');
    }

    // Validate password strength
    if (strlen($password) < 8) {
        Response::error('Password must be at least 8 characters long');
    }

    // Check if email already exists
    try {
        $existingUser = $db->fetchOne(
            "SELECT id FROM users WHERE email = ?",
            [$email]
        );

        if ($existingUser) {
            Response::error('Email address already registered');
        }
    } catch (Exception $e) {
        error_log("Email check error: " . $e->getMessage());
    }

    // Hash password
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);

    try {
        // Insert customer with only the core fields
        $db->execute(
            "INSERT INTO users (
                first_name, last_name, email, phone, password_hash, 
                user_type, status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())",
            [
                $firstName,
                $lastName,
                $email,
                $phone,
                $passwordHash,
                $userType,
                $status
            ]
        );

        // Get the inserted customer ID
        $customerId = $db->getConnection()->lastInsertId();

        Response::success('Customer created successfully', [
            'customer_id' => (int)$customerId,
            'email' => $email
        ]);

    } catch (Exception $e) {
        error_log("Create Customer Error: " . $e->getMessage());
        error_log("SQL Error Details: " . print_r($e, true));
        Response::serverError('Failed to create customer: ' . $e->getMessage());
    }
}

?>