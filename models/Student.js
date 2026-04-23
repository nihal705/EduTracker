// models/Student.js
const { query } = require('../config/database');

class Student {
    // Get all students
    static async findAll(institutionId = null) {
        let sql = `
            SELECT s.*, 
                   COUNT(DISTINCT sem.id) as semester_count,
                   COUNT(DISTINCT sub.id) as subject_count
            FROM students s
            LEFT JOIN semesters sem ON s.usn = sem.student_usn
            LEFT JOIN subjects sub ON sem.id = sub.semester_id
        `;
        const params = [];
        
        if (institutionId) {
            sql += ' WHERE s.institution_id = ?';
            params.push(institutionId);
        }
        
        sql += ' GROUP BY s.usn ORDER BY s.cgpa DESC';
        
        return await query(sql, params);
    }

    // Get student by USN
    static async findByUsn(usn) {
        const sql = `
            SELECT s.*, i.name as institution_name
            FROM students s
            LEFT JOIN institutions i ON s.institution_id = i.institution_id
            WHERE s.usn = ?
        `;
        const results = await query(sql, [usn]);
        return results[0] || null;
    }

    // Get student with complete performance data
    static async getCompleteProfile(usn) {
        const student = await this.findByUsn(usn);
        if (!student) return null;
        
        const semesters = await query(
            'SELECT * FROM semesters WHERE student_usn = ? ORDER BY semester_number',
            [usn]
        );
        
        for (const semester of semesters) {
            const subjects = await query(
                'SELECT * FROM subjects WHERE semester_id = ?',
                [semester.id]
            );
            semester.subjects = subjects;
        }
        
        student.semesters = semesters;
        
        // Calculate rank
        const allStudents = await this.findAll(student.institution_id);
        student.rank = allStudents.findIndex(s => s.usn === usn) + 1;
        
        return student;
    }

    // Create new student
    static async create(studentData) {
        const sql = `
            INSERT INTO students (usn, name, email, department, batch_year, institution_id, password)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const result = await query(sql, [
            studentData.usn, studentData.name, studentData.email,
            studentData.department, studentData.batch_year,
            studentData.institution_id, studentData.password
        ]);
        return await this.findByUsn(studentData.usn);
    }

    // Update student
    static async update(usn, updateData) {
        const fields = [];
        const values = [];
        
        if (updateData.name) { fields.push('name = ?'); values.push(updateData.name); }
        if (updateData.email) { fields.push('email = ?'); values.push(updateData.email); }
        if (updateData.department) { fields.push('department = ?'); values.push(updateData.department); }
        if (updateData.batch_year) { fields.push('batch_year = ?'); values.push(updateData.batch_year); }
        if (updateData.phone) { fields.push('phone = ?'); values.push(updateData.phone); }
        
        if (fields.length === 0) return null;
        
        values.push(usn);
        const sql = `UPDATE students SET ${fields.join(', ')} WHERE usn = ?`;
        await query(sql, values);
        return await this.findByUsn(usn);
    }

    // Update CGPA
    static async updateCgpa(usn) {
        const semesters = await query(
            'SELECT sgpa FROM semesters WHERE student_usn = ?',
            [usn]
        );
        
        const cgpa = semesters.length > 0 
            ? semesters.reduce((sum, s) => sum + s.sgpa, 0) / semesters.length 
            : 0;
        
        await query('UPDATE students SET cgpa = ? WHERE usn = ?', [cgpa, usn]);
        return cgpa;
    }

    // Get student statistics
    static async getStats(institutionId) {
        const sql = `
            SELECT 
                COUNT(*) as total,
                AVG(cgpa) as avg_cgpa,
                MAX(cgpa) as highest_cgpa,
                MIN(cgpa) as lowest_cgpa,
                COUNT(CASE WHEN cgpa >= 8.5 THEN 1 END) as distinction_count,
                COUNT(CASE WHEN cgpa >= 7 AND cgpa < 8.5 THEN 1 END) as first_class_count,
                COUNT(CASE WHEN cgpa >= 6 AND cgpa < 7 THEN 1 END) as second_class_count,
                COUNT(CASE WHEN cgpa < 6 THEN 1 END) as pass_class_count
            FROM students
            WHERE institution_id = ?
        `;
        const results = await query(sql, [institutionId]);
        return results[0];
    }

    // Search students
    static async search(institutionId, query_str) {
        const sql = `
            SELECT * FROM students 
            WHERE institution_id = ? 
            AND (usn LIKE ? OR name LIKE ? OR department LIKE ?)
            ORDER BY cgpa DESC
            LIMIT 50
        `;
        const searchTerm = `%${query_str}%`;
        return await query(sql, [institutionId, searchTerm, searchTerm, searchTerm]);
    }

    // Delete student
    static async delete(usn) {
        await query('DELETE FROM students WHERE usn = ?', [usn]);
        return true;
    }
}

module.exports = Student;