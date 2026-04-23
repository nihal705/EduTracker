// models/Subject.js
const { query } = require('../config/database');

class Subject {
    // Get subject by ID
    static async findById(id) {
        const sql = 'SELECT * FROM subjects WHERE id = ?';
        const results = await query(sql, [id]);
        return results[0] || null;
    }

    // Get all subjects for a semester
    static async findBySemester(semesterId) {
        const sql = 'SELECT * FROM subjects WHERE semester_id = ? ORDER BY id';
        return await query(sql, [semesterId]);
    }

    // Create subject
    static async create(subjectData) {
        const sql = `
            INSERT INTO subjects (semester_id, subject_name, marks, credits, grade_point, grade)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const result = await query(sql, [
            subjectData.semester_id, subjectData.subject_name, subjectData.marks,
            subjectData.credits, subjectData.grade_point, subjectData.grade
        ]);
        return await this.findById(result.insertId);
    }

    // Update subject
    static async update(id, updateData) {
        const fields = [];
        const values = [];
        
        if (updateData.subject_name) { fields.push('subject_name = ?'); values.push(updateData.subject_name); }
        if (updateData.marks !== undefined) { fields.push('marks = ?'); values.push(updateData.marks); }
        if (updateData.credits !== undefined) { fields.push('credits = ?'); values.push(updateData.credits); }
        if (updateData.grade_point !== undefined) { fields.push('grade_point = ?'); values.push(updateData.grade_point); }
        if (updateData.grade) { fields.push('grade = ?'); values.push(updateData.grade); }
        
        if (fields.length === 0) return null;
        
        values.push(id);
        const sql = `UPDATE subjects SET ${fields.join(', ')} WHERE id = ?`;
        await query(sql, values);
        return await this.findById(id);
    }

    // Delete subject
    static async delete(id) {
        await query('DELETE FROM subjects WHERE id = ?', [id]);
        return true;
    }

    // Get subject statistics
    static async getStats(institutionId) {
        const sql = `
            SELECT 
                sub.subject_name,
                AVG(sub.marks) as avg_marks,
                AVG(sub.grade_point) as avg_grade_point,
                COUNT(DISTINCT sem.student_usn) as student_count
            FROM subjects sub
            JOIN semesters sem ON sub.semester_id = sem.id
            JOIN students s ON sem.student_usn = s.usn
            WHERE s.institution_id = ?
            GROUP BY sub.subject_name
            ORDER BY avg_marks DESC
        `;
        return await query(sql, [institutionId]);
    }
}

module.exports = Subject;