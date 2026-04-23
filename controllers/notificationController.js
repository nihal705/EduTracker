// controllers/notificationController.js
const Notification = require('../models/Notification');

class NotificationController {
    // Get student notifications
    static async getStudentNotifications(req, res) {
        try {
            const { usn } = req.params;
            const notifications = await Notification.getForStudent(usn);
            const unreadCount = await Notification.getUnreadCount(usn);
            
            res.json({
                success: true,
                data: notifications,
                unreadCount
            });
        } catch (error) {
            console.error('Get notifications error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    // Mark notification as read
    static async markAsRead(req, res) {
        try {
            const { id } = req.params;
            await Notification.markAsRead(id);
            res.json({ success: true, message: 'Notification marked as read' });
        } catch (error) {
            console.error('Mark read error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    // Mark all as read
    static async markAllAsRead(req, res) {
        try {
            const { usn } = req.params;
            await Notification.markAllAsRead(usn);
            res.json({ success: true, message: 'All notifications marked as read' });
        } catch (error) {
            console.error('Mark all read error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    // Send notification (Institution)
    static async sendNotification(req, res) {
        try {
            const { studentUsn, title, message, type } = req.body;
            
            const notification = await Notification.create({
                student_usn: studentUsn,
                institution_id: req.user.institutionId,
                title, message, type
            });
            
            const io = req.app.get('io');
            io.to(`student_${studentUsn}`).emit('new_notification', { title, message, type });
            
            res.json({ success: true, data: notification });
        } catch (error) {
            console.error('Send notification error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    // Delete notification
    static async deleteNotification(req, res) {
        try {
            const { id } = req.params;
            await Notification.delete(id);
            res.json({ success: true, message: 'Notification deleted' });
        } catch (error) {
            console.error('Delete notification error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }
}

module.exports = NotificationController;