// utils/constants.js - Application Constants

module.exports = {
    // Grade Points Mapping
    GRADE_POINTS: {
        'S': 10,
        'A': 9,
        'B': 8,
        'C': 7,
        'D': 6,
        'E': 5,
        'F': 0
    },
    
    // Grade Letters
    GRADE_LETTERS: {
        10: 'S',
        9: 'A',
        8: 'B',
        7: 'C',
        6: 'D',
        5: 'E',
        0: 'F'
    },
    
    // Department List
    DEPARTMENTS: [
        { code: 'CSE', name: 'Computer Science Engineering' },
        { code: 'ECE', name: 'Electronics & Communication Engineering' },
        { code: 'ISE', name: 'Information Science Engineering' },
        { code: 'AIML', name: 'Artificial Intelligence & Machine Learning' },
        { code: 'DS', name: 'Data Science' },
        { code: 'CE', name: 'Civil Engineering' },
        { code: 'ME', name: 'Mechanical Engineering' },
        { code: 'EEE', name: 'Electrical & Electronics Engineering' }
    ],
    
    // Semesters
    SEMESTERS: [1, 2, 3, 4, 5, 6, 7, 8],
    
    // Credit ranges
    CREDIT_RANGE: { min: 1, max: 5, step: 0.5 },
    
    // Marks range
    MARKS_RANGE: { min: 0, max: 100 },
    
    // CGPA range
    CGPA_RANGE: { min: 0, max: 10 },
    
    // USN Pattern (VTU format)
    USN_PATTERN: /^[0-9]{1}[A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{3}$/,
    
    // Pagination defaults
    PAGINATION: {
        defaultLimit: 10,
        maxLimit: 100,
        defaultPage: 1
    },
    
    // Notification types
    NOTIFICATION_TYPES: {
        INFO: 'info',
        SUCCESS: 'success',
        WARNING: 'warning',
        DANGER: 'danger'
    },
    
    // Result status
    RESULT_STATUS: {
        PENDING: 'pending',
        PUBLISHED: 'published',
        UNDER_REVIEW: 'under_review'
    },
    
    // User roles
    USER_ROLES: {
        STUDENT: 'student',
        INSTITUTION: 'institution',
        ADMIN: 'admin'
    },
    
    // API response messages
    MESSAGES: {
        LOGIN_SUCCESS: 'Login successful',
        LOGIN_FAILED: 'Invalid credentials',
        REGISTER_SUCCESS: 'Registration successful',
        REGISTER_FAILED: 'Registration failed',
        RECORD_ADDED: 'Record added successfully',
        RECORD_UPDATED: 'Record updated successfully',
        RECORD_DELETED: 'Record deleted successfully',
        NOT_FOUND: 'Resource not found',
        UNAUTHORIZED: 'Unauthorized access',
        FORBIDDEN: 'Access forbidden',
        SERVER_ERROR: 'Internal server error'
    },
    
    // Chart colors
    CHART_COLORS: {
        primary: '#3b71ca',
        secondary: '#9fa6b2',
        success: '#14a44d',
        danger: '#dc4c64',
        warning: '#e4a11b',
        info: '#54b4d3',
        light: '#fbfbfb',
        dark: '#332d2d'
    }
};