// routes/notifications.js - Complete Notifications Routes
const express = require('express');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { query } = require('../config/database');

const router = express.Router();

// Get notifications for a student
router.get('/student/:usn', authenticateToken, async (req, res) => {
    try {
        const { usn } = req.params;
        
        const notifications = await query(
            `SELECT id, title, message, type, is_read, created_at 
             FROM notifications 
             WHERE student_usn = ? 
             ORDER BY created_at DESC 
             LIMIT 50`,
            [usn]
        );
        
        const unreadCount = notifications.filter(n => !n.is_read).length;
        
        res.json({ 
            success: true, 
            data: notifications,
            unreadCount 
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Mark notification as read
router.put('/:id/read', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        await query('UPDATE notifications SET is_read = TRUE WHERE id = ?', [id]);
        
        res.json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
        console.error('Mark read error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Mark all notifications as read
router.put('/student/:usn/read-all', authenticateToken, async (req, res) => {
    try {
        const { usn } = req.params;
        
        await query('UPDATE notifications SET is_read = TRUE WHERE student_usn = ?', [usn]);
        
        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Mark all read error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Send notification to a student (Institution only)
router.post('/send', authenticateToken, authorizeRoles('institution'), async (req, res) => {
    try {
        const { studentUsn, title, message, type } = req.body;
        const institutionId = req.user.institutionId;
        
        if (!studentUsn || !title || !message) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }
        
        await query(
            'INSERT INTO notifications (student_usn, institution_id, title, message, type) VALUES (?, ?, ?, ?, ?)',
            [studentUsn, institutionId, title, message, type || 'info']
        );
        
        // Emit socket notification
        const io = req.app.get('io');
        io.to(`student_${studentUsn}`).emit('new_notification', { title, message, type });
        
        res.json({ success: true, message: 'Notification sent successfully' });
    } catch (error) {
        console.error('Send notification error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Send bulk notifications (Institution only)
router.post('/send-bulk', authenticateToken, authorizeRoles('institution'), async (req, res) => {
    try {
        const { department, semester, title, message, type } = req.body;
        const institutionId = req.user.institutionId;
        
        let students = [];
        
        if (department && semester) {
            students = await query(
                `SELECT s.usn FROM students s
                 JOIN semesters sem ON s.usn = sem.student_usn
                 WHERE s.institution_id = ? AND s.department = ? AND sem.semester_number = ?
                 GROUP BY s.usn`,
                [institutionId, department, semester]
            );
        } else if (department) {
            students = await query(
                'SELECT usn FROM students WHERE institution_id = ? AND department = ?',
                [institutionId, department]
            );
        } else {
            students = await query(
                'SELECT usn FROM students WHERE institution_id = ?',
                [institutionId]
            );
        }
        
        for (const student of students) {
            await query(
                'INSERT INTO notifications (student_usn, institution_id, title, message, type) VALUES (?, ?, ?, ?, ?)',
                [student.usn, institutionId, title, message, type || 'info']
            );
            
            const io = req.app.get('io');
            io.to(`student_${student.usn}`).emit('new_notification', { title, message, type });
        }
        
        res.json({ success: true, message: `Sent to ${students.length} students` });
    } catch (error) {
        console.error('Bulk notification error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Delete notification
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        await query('DELETE FROM notifications WHERE id = ?', [id]);
        
        res.json({ success: true, message: 'Notification deleted' });
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;