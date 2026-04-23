// routes/students.js
const express = require('express');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { query } = require('../config/database');

const router = express.Router();

// Get student performance
router.get('/performance/:usn', authenticateToken, async (req, res) => {
  try {
    const { usn } = req.params;
    
    // Get student details
    const students = await query('SELECT usn, name, department, cgpa FROM students WHERE usn = ?', [usn]);
    if (students.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    
    const student = students[0];
    
    // Get semesters
    const semesters = await query(
      'SELECT id, semester_number, sgpa FROM semesters WHERE student_usn = ? ORDER BY semester_number',
      [usn]
    );
    
    // Get subjects for each semester
    for (let semester of semesters) {
      const subjects = await query(
        'SELECT subject_name, marks, credits, grade_point, grade FROM subjects WHERE semester_id = ?',
        [semester.id]
      );
      semester.subjects = subjects;
    }
    
    res.json({ success: true, student: { ...student, semesters } });
  } catch (error) {
    console.error('Get performance error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add performance record (Institution only)
router.post('/performance/add', authenticateToken, authorizeRoles('institution'), async (req, res) => {
  const { usn, name, department, semester, subjects } = req.body;
  const institutionId = req.user.institutionId;
  
  try {
    let totalCredits = 0;
    let totalGradePoints = 0;
    
    subjects.forEach(subject => {
      totalCredits += subject.credits;
      totalGradePoints += subject.credits * subject.gradePoint;
    });
    
    const sgpa = totalCredits > 0 ? totalGradePoints / totalCredits : 0;
    
    await query('START TRANSACTION');
    
    // Check if student exists
    const existingStudent = await query('SELECT usn FROM students WHERE usn = ?', [usn]);
    
    if (existingStudent.length === 0) {
      await query(
        'INSERT INTO students (usn, name, department, institution_id) VALUES (?, ?, ?, ?)',
        [usn, name, department, institutionId]
      );
    }
    
    // Check if semester exists
    const existingSemester = await query(
      'SELECT id FROM semesters WHERE student_usn = ? AND semester_number = ?',
      [usn, semester]
    );
    
    let semesterId;
    if (existingSemester.length > 0) {
      semesterId = existingSemester[0].id;
      await query('UPDATE semesters SET sgpa = ? WHERE id = ?', [sgpa, semesterId]);
      await query('DELETE FROM subjects WHERE semester_id = ?', [semesterId]);
    } else {
      const result = await query(
        'INSERT INTO semesters (student_usn, semester_number, sgpa) VALUES (?, ?, ?)',
        [usn, semester, sgpa]
      );
      semesterId = result.insertId;
    }
    
    // Insert subjects
    for (const subject of subjects) {
      await query(
        'INSERT INTO subjects (semester_id, subject_name, marks, credits, grade_point, grade) VALUES (?, ?, ?, ?, ?, ?)',
        [semesterId, subject.name, subject.marks, subject.credits, subject.gradePoint, subject.grade]
      );
    }
    
    // Update CGPA
    const allSgpas = await query('SELECT sgpa FROM semesters WHERE student_usn = ?', [usn]);
    const cgpa = allSgpas.reduce((sum, s) => sum + s.sgpa, 0) / allSgpas.length;
    await query('UPDATE students SET cgpa = ? WHERE usn = ?', [cgpa, usn]);
    
    await query('COMMIT');
    
    // Emit socket notification
    const io = req.app.get('io');
    io.to(`student_${usn}`).emit('new_result', { semester, sgpa: sgpa.toFixed(2) });
    
    res.json({ success: true, sgpa: sgpa.toFixed(2), cgpa: cgpa.toFixed(2) });
  } catch (error) {
    await query('ROLLBACK');
    console.error('Add performance error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all students for institution
router.get('/institution/students', authenticateToken, authorizeRoles('institution'), async (req, res) => {
  try {
    const institutionId = req.user.institutionId;
    
    const students = await query(
      `SELECT s.usn, s.name, s.department, s.cgpa, 
              COUNT(DISTINCT sem.id) as semester_count
       FROM students s
       LEFT JOIN semesters sem ON s.usn = sem.student_usn
       WHERE s.institution_id = ?
       GROUP BY s.usn
       ORDER BY s.cgpa DESC`,
      [institutionId]
    );
    
    res.json({ success: true, students });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;