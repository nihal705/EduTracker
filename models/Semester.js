// models/Institution.js
const { query } = require('../config/database');

class Institution {
    // Get all institutions
    static async findAll() {
        const sql = `
            SELECT i.*, COUNT(s.usn) as student_count
            FROM institutions i
            LEFT JOIN students s ON i.institution_id = s.institution_id
            GROUP BY i.institution_id
            ORDER BY i.name
        `;
        return await query(sql);
    }

    // Get institution by ID
    static async findById(institutionId) {
        const sql = `
            SELECT i.*, COUNT(s.usn) as student_count
            FROM institutions i
            LEFT JOIN students s ON i.institution_id = s.institution_id
            WHERE i.institution_id = ?
            GROUP BY i.institution_id
        `;
        const results = await query(sql, [institutionId]);
        return results[0] || null;
    }

    // Create new institution
    static async create(institutionData) {
        const institutionId = 'INST' + Math.random().toString(36).substring(2, 8).toUpperCase();
        const sql = `
            INSERT INTO institutions (institution_id, name, email, admin_name, phone, address, password)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        await query(sql, [
            institutionId, institutionData.name, institutionData.email,
            institutionData.admin_name, institutionData.phone || null,
            institutionData.address || null, institutionData.password
        ]);
        return await this.findById(institutionId);
    }

    // Update institution
    static async update(institutionId, updateData) {
        const fields = [];
        const values = [];
        
        if (updateData.name) { fields.push('name = ?'); values.push(updateData.name); }
        if (updateData.email) { fields.push('email = ?'); values.push(updateData.email); }
        if (updateData.admin_name) { fields.push('admin_name = ?'); values.push(updateData.admin_name); }
        if (updateData.phone) { fields.push('phone = ?'); values.push(updateData.phone); }
        if (updateData.address) { fields.push('address = ?'); values.push(updateData.address); }
        
        if (fields.length === 0) return null;
        
        values.push(institutionId);
        const sql = `UPDATE institutions SET ${fields.join(', ')} WHERE institution_id = ?`;
        await query(sql, values);
        return await this.findById(institutionId);
    }

    // Get dashboard stats
    static async getDashboardStats(institutionId) {
        const sql = `
            SELECT 
                (SELECT COUNT(*) FROM students WHERE institution_id = ?) as total_students,
                (SELECT COUNT(*) FROM semesters s JOIN students st ON s.student_usn = st.usn WHERE st.institution_id = ?) as total_semesters,
                (SELECT ROUND(AVG(cgpa), 2) FROM students WHERE institution_id = ? AND cgpa > 0) as avg_cgpa,
                (SELECT COUNT(*) FROM students WHERE institution_id = ? AND cgpa >= 8.5) as distinction_students,
                (SELECT name FROM students WHERE institution_id = ? ORDER BY cgpa DESC LIMIT 1) as top_student
        `;
        const results = await query(sql, [institutionId, institutionId, institutionId, institutionId, institutionId]);
        return results[0];
    }

    // Delete institution
    static async delete(institutionId) {
        await query('DELETE FROM institutions WHERE institution_id = ?', [institutionId]);
        return true;
    }
}

module.exports = Institution;