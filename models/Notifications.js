// models/Notification.js
const { query } = require('../config/database');

class Notification {
    // Get notifications for a student
    static async getForStudent(usn, limit = 50) {
        const sql = `
            SELECT * FROM notifications 
            WHERE student_usn = ? 
            ORDER BY created_at DESC 
            LIMIT ?
        `;
        return await query(sql, [usn, limit]);
    }

    // Get unread count
    static async getUnreadCount(usn) {
        const sql = 'SELECT COUNT(*) as count FROM notifications WHERE student_usn = ? AND is_read = FALSE';
        const results = await query(sql, [usn]);
        return results[0]?.count || 0;
    }

    // Create notification
    static async create(notificationData) {
        const sql = `
            INSERT INTO notifications (student_usn, institution_id, title, message, type)
            VALUES (?, ?, ?, ?, ?)
        `;
        const result = await query(sql, [
            notificationData.student_usn, notificationData.institution_id,
            notificationData.title, notificationData.message, notificationData.type || 'info'
        ]);
        return await this.findById(result.insertId);
    }

    // Create bulk notifications
    static async createBulk(students, notificationData) {
        const results = [];
        for (const student of students) {
            const result = await this.create({
                ...notificationData,
                student_usn: student.usn
            });
            results.push(result);
        }
        return results;
    }

    // Find notification by ID
    static async findById(id) {
        const sql = 'SELECT * FROM notifications WHERE id = ?';
        const results = await query(sql, [id]);
        return results[0] || null;
    }

    // Mark as read
    static async markAsRead(id) {
        const sql = 'UPDATE notifications SET is_read = TRUE WHERE id = ?';
        await query(sql, [id]);
        return await this.findById(id);
    }

    // Mark all as read for student
    static async markAllAsRead(usn) {
        const sql = 'UPDATE notifications SET is_read = TRUE WHERE student_usn = ?';
        await query(sql, [usn]);
        return true;
    }

    // Delete notification
    static async delete(id) {
        await query('DELETE FROM notifications WHERE id = ?', [id]);
        return true;
    }

    // Delete old notifications
    static async deleteOld(days = 30) {
        const sql = 'DELETE FROM notifications WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)';
        const result = await query(sql, [days]);
        return result.affectedRows;
    }
}

module.exports = Notification;