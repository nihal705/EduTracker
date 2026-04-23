// routes/analytics.js - Complete Analytics Routes
const express = require('express');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { query } = require('../config/database');

const router = express.Router();

// Get dashboard statistics
router.get('/dashboard', authenticateToken, async (req, res) => {
    try {
        const institutionId = req.user.role === 'institution' ? req.user.institutionId : null;
        
        let totalStudents = 0;
        let totalSemesters = 0;
        let avgCgpa = 0;
        let topStudent = null;
        let deptStats = [];
        
        if (institutionId) {
            // Total students
            const studentCount = await query('SELECT COUNT(*) as count FROM students WHERE institution_id = ?', [institutionId]);
            totalStudents = studentCount[0]?.count || 0;
            
            // Total semesters
            const semesterCount = await query(
                `SELECT COUNT(DISTINCT sem.id) as count 
                 FROM semesters sem 
                 JOIN students s ON sem.student_usn = s.usn 
                 WHERE s.institution_id = ?`,
                [institutionId]
            );
            totalSemesters = semesterCount[0]?.count || 0;
            
            // Average CGPA
            const cgpaData = await query('SELECT AVG(cgpa) as avg FROM students WHERE institution_id = ? AND cgpa > 0', [institutionId]);
            avgCgpa = cgpaData[0]?.avg || 0;
            
            // Top student
            const top = await query(
                'SELECT usn, name, cgpa FROM students WHERE institution_id = ? ORDER BY cgpa DESC LIMIT 1',
                [institutionId]
            );
            topStudent = top[0] || null;
            
            // Department statistics
            deptStats = await query(
                'SELECT department, COUNT(*) as count, AVG(cgpa) as avg_cgpa FROM students WHERE institution_id = ? GROUP BY department',
                [institutionId]
            );
        }
        
        res.json({
            success: true,
            data: {
                totalStudents,
                totalSemesters,
                avgCgpa: parseFloat(avgCgpa).toFixed(2),
                topStudent,
                deptStats
            }
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get performance trends for a student
router.get('/trends/:usn', authenticateToken, async (req, res) => {
    try {
        const { usn } = req.params;
        
        const trends = await query(
            'SELECT semester_number, sgpa FROM semesters WHERE student_usn = ? ORDER BY semester_number',
            [usn]
        );
        
        // Calculate improvement trend
        let improvement = 0;
        if (trends.length >= 2) {
            const first = trends[0].sgpa;
            const last = trends[trends.length - 1].sgpa;
            improvement = last - first;
        }
        
        res.json({
            success: true,
            data: trends,
            improvement: improvement.toFixed(2),
            average: (trends.reduce((sum, t) => sum + t.sgpa, 0) / (trends.length || 1)).toFixed(2)
        });
    } catch (error) {
        console.error('Trends error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get top performing students
router.get('/top-students', authenticateToken, async (req, res) => {
    try {
        const institutionId = req.user.role === 'institution' ? req.user.institutionId : null;
        const limit = parseInt(req.query.limit) || 10;
        
        if (!institutionId) {
            return res.json({ success: true, data: [] });
        }
        
        const topStudents = await query(
            'SELECT usn, name, cgpa, department FROM students WHERE institution_id = ? AND cgpa > 0 ORDER BY cgpa DESC LIMIT ?',
            [institutionId, limit]
        );
        
        // Add rank
        const rankedStudents = topStudents.map((student, index) => ({
            ...student,
            rank: index + 1,
            cgpa: parseFloat(student.cgpa).toFixed(2)
        }));
        
        res.json({ success: true, data: rankedStudents });
    } catch (error) {
        console.error('Top students error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get department-wise statistics
router.get('/department-stats', authenticateToken, async (req, res) => {
    try {
        const institutionId = req.user.role === 'institution' ? req.user.institutionId : null;
        
        if (!institutionId) {
            return res.json({ success: true, data: [] });
        }
        
        const stats = await query(
            `SELECT 
                department, 
                COUNT(*) as student_count,
                ROUND(AVG(cgpa), 2) as avg_cgpa,
                MAX(cgpa) as highest_cgpa,
                MIN(cgpa) as lowest_cgpa
             FROM students 
             WHERE institution_id = ? AND cgpa > 0
             GROUP BY department`,
            [institutionId]
        );
        
        res.json({ success: true, data: stats });
    } catch (error) {
        console.error('Department stats error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get semester-wise performance for institution
router.get('/semester-performance', authenticateToken, authorizeRoles('institution'), async (req, res) => {
    try {
        const institutionId = req.user.institutionId;
        
        const performance = await query(
            `SELECT 
                s.semester_number,
                ROUND(AVG(s.sgpa), 2) as avg_sgpa,
                COUNT(DISTINCT s.student_usn) as student_count
             FROM semesters s
             JOIN students st ON s.student_usn = st.usn
             WHERE st.institution_id = ?
             GROUP BY s.semester_number
             ORDER BY s.semester_number`,
            [institutionId]
        );
        
        res.json({ success: true, data: performance });
    } catch (error) {
        console.error('Semester performance error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get student performance comparison
router.get('/compare', authenticateToken, authorizeRoles('institution'), async (req, res) => {
    try {
        const { usns } = req.query;
        const usnList = usns ? usns.split(',') : [];
        
        if (usnList.length === 0) {
            return res.json({ success: true, data: [] });
        }
        
        const placeholders = usnList.map(() => '?').join(',');
        const students = await query(
            `SELECT usn, name, cgpa FROM students WHERE usn IN (${placeholders})`,
            usnList
        );
        
        for (const student of students) {
            const trends = await query(
                'SELECT semester_number, sgpa FROM semesters WHERE student_usn = ? ORDER BY semester_number',
                [student.usn]
            );
            student.trends = trends;
        }
        
        res.json({ success: true, data: students });
    } catch (error) {
        console.error('Compare error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get batch-wise performance
router.get('/batch-performance', authenticateToken, authorizeRoles('institution'), async (req, res) => {
    try {
        const institutionId = req.user.institutionId;
        
        const batchStats = await query(
            `SELECT 
                batch_year,
                COUNT(*) as student_count,
                ROUND(AVG(cgpa), 2) as avg_cgpa
             FROM students
             WHERE institution_id = ? AND batch_year IS NOT NULL
             GROUP BY batch_year
             ORDER BY batch_year DESC`,
            [institutionId]
        );
        
        res.json({ success: true, data: batchStats });
    } catch (error) {
        console.error('Batch performance error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Export analytics report
router.get('/export', authenticateToken, authorizeRoles('institution'), async (req, res) => {
    try {
        const institutionId = req.user.institutionId;
        const { format = 'json' } = req.query;
        
        const students = await query(
            `SELECT s.usn, s.name, s.department, s.cgpa, s.batch_year,
                    COUNT(DISTINCT sem.id) as semesters_completed
             FROM students s
             LEFT JOIN semesters sem ON s.usn = sem.student_usn
             WHERE s.institution_id = ?
             GROUP BY s.usn`,
            [institutionId]
        );
        
        if (format === 'json') {
            return res.json({ success: true, data: students });
        }
        
        // For CSV format
        let csv = 'USN,Name,Department,CGPA,Semesters Completed,Batch Year\n';
        students.forEach(s => {
            csv += `${s.usn},${s.name},${s.department},${s.cgpa},${s.semesters_completed},${s.batch_year || ''}\n`;
        });
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=students_report.csv');
        res.send(csv);
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;