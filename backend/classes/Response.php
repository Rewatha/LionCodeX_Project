<?php
// Response.php - API Response Helper Class
// File: backend/classes/Response.php

class Response {
    
    // Send success response
    public static function success($message = '', $data = null, $code = 200) {
        http_response_code($code);
        $response = ['success' => true];
        
        if (!empty($message)) {
            $response['message'] = $message;
        }
        
        if ($data !== null) {
            if (is_array($data)) {
                $response = array_merge($response, $data);
            } else {
                $response['data'] = $data;
            }
        }
        
        echo json_encode($response, JSON_PRETTY_PRINT);
        exit;
    }
    
    // Send error response
    public static function error($message = 'An error occurred', $code = 400, $details = null) {
        http_response_code($code);
        $response = [
            'success' => false,
            'error' => $message
        ];
        
        if ($details !== null) {
            $response['details'] = $details;
        }
        
        echo json_encode($response, JSON_PRETTY_PRINT);
        exit;
    }
    
    // Send validation error
    public static function validationError($errors) {
        self::error('Validation failed', 422, $errors);
    }
    
    // Send unauthorized response
    public static function unauthorized($message = 'Unauthorized access') {
        self::error($message, 401);
    }
    
    // Send forbidden response
    public static function forbidden($message = 'Access forbidden') {
        self::error($message, 403);
    }
    
    // Send not found response
    public static function notFound($message = 'Resource not found') {
        self::error($message, 404);
    }
    
    // Send server error response
    public static function serverError($message = 'Internal server error') {
        self::error($message, 500);
    }
    
    // Sanitize input
    public static function sanitize($data) {
        if (is_array($data)) {
            return array_map([self::class, 'sanitize'], $data);
        }
        return htmlspecialchars(strip_tags(trim($data)), ENT_QUOTES, 'UTF-8');
    }
    
    // Validate email
    public static function validateEmail($email) {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }
    
    // Validate phone (Sri Lankan format)
    public static function validatePhone($phone) {
        $phone = preg_replace('/\s+/', '', $phone);
        return preg_match('/^(\+94|0)?[7][0-9]{8}$/', $phone);
    }
    
    // Validate required fields
    public static function validateRequired($data, $fields) {
        $errors = [];
        foreach ($fields as $field) {
            if (!isset($data[$field]) || empty(trim($data[$field]))) {
                $errors[$field] = ucfirst(str_replace('_', ' ', $field)) . ' is required';
            }
        }
        
        if (!empty($errors)) {
            self::validationError($errors);
        }
        
        return true;
    }
}
?>