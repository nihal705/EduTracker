// server.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const { testConnection, query } = require('./config/database');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ============ HELPER FUNCTIONS ============
function calculateSGPA(subjects) {
    let totalCredits = 0, totalPoints = 0;
    subjects.forEach(s => { totalCredits += s.credits; totalPoints += s.credits * s.gradePoint; });
    return totalCredits > 0 ? parseFloat((totalPoints / totalCredits).toFixed(2)) : 0;
}

function getGradeFromMarks(marks) {
    if (marks >= 90) return { grade: 'S', point: 10 };
    if (marks >= 80) return { grade: 'A', point: 9 };
    if (marks >= 70) return { grade: 'B', point: 8 };
    if (marks >= 60) return { grade: 'C', point: 7 };
    if (marks >= 50) return { grade: 'D', point: 6 };
    if (marks >= 45) return { grade: 'E', point: 5 };
    return { grade: 'F', point: 0 };
}

// Get institution from token
async function getInstitutionFromToken(req) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return null;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
        if (decoded.role === 'institution') {
            const institutions = await query('SELECT * FROM institutions WHERE institution_id = ?', [decoded.institutionId]);
            return institutions[0] || null;
        }
        return null;
    } catch { return null; }
}

// Get student from token
async function getStudentFromToken(req) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return null;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
        if (decoded.role === 'student') {
            const students = await query('SELECT * FROM students WHERE usn = ?', [decoded.usn]);
            return students[0] || null;
        }
        return null;
    } catch { return null; }
}

// ============ AUTH ROUTES ============

// Student Login
app.post('/api/auth/student/login', async (req, res) => {
    try {
        const { usn, password } = req.body;
        const students = await query('SELECT * FROM students WHERE usn = ?', [usn]);
        
        if (students.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid USN or password' });
        }
        
        let validPassword = false;
        if (students[0].password.startsWith('$2a$')) {
            validPassword = bcrypt.compareSync(password, students[0].password);
        } else {
            validPassword = students[0].password === password;
        }
        
        if (!validPassword) {
            return res.status(401).json({ success: false, message: 'Invalid USN or password' });
        }
        
        const token = jwt.sign(
            { id: students[0].id, usn: students[0].usn, role: 'student', name: students[0].name },
            process.env.JWT_SECRET || 'secretkey',
            { expiresIn: '7d' }
        );
        
        res.json({ success: true, token, user: { usn: students[0].usn, name: students[0].name, role: 'student', email: students[0].email, department: students[0].department } });
    } catch (error) {
        console.error('Student login error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Student Register - with institution prefix validation
app.post('/api/auth/student/register', async (req, res) => {
    try {
        const { usn, name, email, department, password } = req.body;
        
        // Check if USN already exists
        const existing = await query('SELECT usn FROM students WHERE usn = ? OR email = ?', [usn, email]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'USN or Email already exists' });
        }
        
        // Find institution by USN prefix
        const prefix = usn.substring(0, 3);
        const institution = await query('SELECT institution_id FROM institutions WHERE usn_prefix = ?', [prefix]);
        
        if (institution.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid USN prefix. Please check your USN format.' });
        }
        
        const hashedPassword = bcrypt.hashSync(password, 10);
        await query(
            'INSERT INTO students (usn, name, email, department, institution_id, password) VALUES (?, ?, ?, ?, ?, ?)',
            [usn, name, email, department, institution[0].institution_id, hashedPassword]
        );
        
        res.json({ success: true, message: 'Registration successful!' });
    } catch (error) {
        console.error('Student register error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Institution Login
app.post('/api/auth/institution/login', async (req, res) => {
    try {
        const { institutionId, password } = req.body;
        const institutions = await query('SELECT * FROM institutions WHERE institution_id = ?', [institutionId]);
        
        if (institutions.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid Institution ID' });
        }
        
        let validPassword = false;
        if (institutions[0].password.startsWith('$2a$')) {
            validPassword = bcrypt.compareSync(password, institutions[0].password);
        } else {
            validPassword = institutions[0].password === password;
        }
        
        if (!validPassword) {
            return res.status(401).json({ success: false, message: 'Invalid password' });
        }
        
        const token = jwt.sign(
            { id: institutions[0].id, institutionId: institutions[0].institution_id, role: 'institution', name: institutions[0].name },
            process.env.JWT_SECRET || 'secretkey',
            { expiresIn: '7d' }
        );
        
        res.json({ success: true, token, user: { institutionId: institutions[0].institution_id, name: institutions[0].name, role: 'institution' } });
    } catch (error) {
        console.error('Institution login error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Institution Register
app.post('/api/auth/institution/register', async (req, res) => {
    try {
        const { name, email, adminName, password, institutionCode, usnPrefix } = req.body;
        
        if (!name || !email || !adminName || !password || !institutionCode || !usnPrefix) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }
        
        const existing = await query('SELECT email FROM institutions WHERE email = ? OR institution_code = ?', [email, institutionCode]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Email or Institution Code already registered' });
        }
        
        const institutionId = 'INST' + Math.random().toString(36).substring(2, 8).toUpperCase();
        const hashedPassword = bcrypt.hashSync(password, 10);
        await query(
            'INSERT INTO institutions (institution_id, institution_code, usn_prefix, name, email, admin_name, password) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [institutionId, institutionCode, usnPrefix, name, email, adminName, hashedPassword]
        );
        
        res.json({ success: true, message: 'Registration successful!', institutionId, institutionCode, usnPrefix });
    } catch (error) {
        console.error('Institution register error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============ PROFILE & PASSWORD ROUTES ============

// Get student profile
app.get('/api/student/profile', async (req, res) => {
    try {
        const student = await getStudentFromToken(req);
        if (!student) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        
        res.json({ 
            success: true, 
            profile: {
                usn: student.usn,
                name: student.name,
                email: student.email,
                department: student.department,
                phone: student.phone,
                cgpa: student.cgpa,
                created_at: student.created_at
            }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update student profile
app.put('/api/student/profile', async (req, res) => {
    try {
        const student = await getStudentFromToken(req);
        if (!student) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        
        const { name, email, phone } = req.body;
        await query('UPDATE students SET name = ?, email = ?, phone = ? WHERE usn = ?', [name, email, phone, student.usn]);
        
        res.json({ success: true, message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Change password
app.post('/api/auth/change-password', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
        const { currentPassword, newPassword } = req.body;
        
        if (decoded.role === 'student') {
            const students = await query('SELECT * FROM students WHERE usn = ?', [decoded.usn]);
            if (students.length === 0) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            
            let validPassword = false;
            if (students[0].password.startsWith('$2a$')) {
                validPassword = bcrypt.compareSync(currentPassword, students[0].password);
            } else {
                validPassword = students[0].password === currentPassword;
            }
            
            if (!validPassword) {
                return res.status(401).json({ success: false, message: 'Current password is incorrect' });
            }
            
            const hashedPassword = bcrypt.hashSync(newPassword, 10);
            await query('UPDATE students SET password = ? WHERE usn = ?', [hashedPassword, decoded.usn]);
        } else if (decoded.role === 'institution') {
            const institutions = await query('SELECT * FROM institutions WHERE institution_id = ?', [decoded.institutionId]);
            if (institutions.length === 0) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            
            let validPassword = false;
            if (institutions[0].password.startsWith('$2a$')) {
                validPassword = bcrypt.compareSync(currentPassword, institutions[0].password);
            } else {
                validPassword = institutions[0].password === currentPassword;
            }
            
            if (!validPassword) {
                return res.status(401).json({ success: false, message: 'Current password is incorrect' });
            }
            
            const hashedPassword = bcrypt.hashSync(newPassword, 10);
            await query('UPDATE institutions SET password = ? WHERE institution_id = ?', [hashedPassword, decoded.institutionId]);
        }
        
        res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Forgot password - generate reset token
app.post('/api/auth/forgot-password', async (req, res) => {
    try {
        const { email, role } = req.body;
        let user = null;
        
        if (role === 'student') {
            const users = await query('SELECT * FROM students WHERE email = ?', [email]);
            if (users.length > 0) user = users[0];
        } else {
            const users = await query('SELECT * FROM institutions WHERE email = ?', [email]);
            if (users.length > 0) user = users[0];
        }
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'No account found with this email' });
        }
        
        const resetToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 3600000); // 1 hour
        
        await query('DELETE FROM password_resets WHERE email = ?', [email]);
        await query('INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)', [email, resetToken, expiresAt]);
        
        // In production, send email here. For now, return token in response.
        res.json({ success: true, message: 'Password reset token generated', resetToken });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Reset password with token
app.post('/api/auth/reset-password', async (req, res) => {
    try {
        const { email, token, newPassword, role } = req.body;
        
        const resetRecord = await query('SELECT * FROM password_resets WHERE email = ? AND token = ? AND expires_at > NOW()', [email, token]);
        
        if (resetRecord.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
        }
        
        const hashedPassword = bcrypt.hashSync(newPassword, 10);
        
        if (role === 'student') {
            await query('UPDATE students SET password = ? WHERE email = ?', [hashedPassword, email]);
        } else {
            await query('UPDATE institutions SET password = ? WHERE email = ?', [hashedPassword, email]);
        }
        
        await query('DELETE FROM password_resets WHERE email = ?', [email]);
        
        res.json({ success: true, message: 'Password reset successful' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============ STUDENT ROUTES ============

// Get student dashboard data (ONLY logged-in student's data)
app.get('/api/student/dashboard', async (req, res) => {
    try {
        const student = await getStudentFromToken(req);
        if (!student) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        
        const semesters = await query('SELECT id, semester_number, sgpa FROM semesters WHERE student_usn = ? ORDER BY semester_number', [student.usn]);
        
        for (let semester of semesters) {
            const subjects = await query('SELECT subject_name, marks, credits, grade_point, grade FROM subjects WHERE semester_id = ?', [semester.id]);
            semester.subjects = subjects;
        }
        
        const sgpas = semesters.map(s => parseFloat(s.sgpa) || 0);
        const stats = {
            totalSemesters: semesters.length,
            averageSgpa: sgpas.length > 0 ? (sgpas.reduce((a,b) => a+b,0) / sgpas.length).toFixed(2) : 0,
            bestSgpa: sgpas.length > 0 ? Math.max(...sgpas).toFixed(2) : 0,
            cgpa: student.cgpa ? parseFloat(student.cgpa).toFixed(2) : '0.00'
        };
        
        res.json({ success: true, student: { usn: student.usn, name: student.name, email: student.email, department: student.department }, semesters, stats });
    } catch (error) {
        console.error('Student dashboard error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get student rank
app.get('/api/student/rank', async (req, res) => {
    try {
        const student = await getStudentFromToken(req);
        if (!student) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        
        const institution = await query('SELECT * FROM institutions WHERE institution_id = ?', [student.institution_id]);
        const prefix = institution[0]?.usn_prefix || '';
        
        const allStudents = await query('SELECT usn, cgpa FROM students WHERE usn LIKE ? AND cgpa > 0 ORDER BY cgpa DESC', [`${prefix}%`]);
        const rank = allStudents.findIndex(s => s.usn === student.usn) + 1;
        const percentile = allStudents.length > 0 ? ((allStudents.length - rank) / allStudents.length * 100).toFixed(1) : 0;
        
        res.json({ success: true, rank, total: allStudents.length, percentile });
    } catch (error) {
        console.error('Rank error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============ INSTITUTION ROUTES ============

// Get all students (only institution's own students)
app.get('/api/institution/students', async (req, res) => {
    try {
        const institution = await getInstitutionFromToken(req);
        if (!institution) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        
        const students = await query(`
            SELECT s.usn, s.name, s.email, s.department, s.cgpa, 
                   COUNT(DISTINCT sem.id) as semester_count
            FROM students s
            LEFT JOIN semesters sem ON s.usn = sem.student_usn
            WHERE s.usn LIKE ?
            GROUP BY s.usn
            ORDER BY s.cgpa DESC
        `, [`${institution.usn_prefix}%`]);
        
        res.json({ success: true, students });
    } catch (error) {
        console.error('Get students error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get institution stats
app.get('/api/institution/stats', async (req, res) => {
    try {
        const institution = await getInstitutionFromToken(req);
        if (!institution) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        
        const studentCount = await query('SELECT COUNT(*) as total FROM students WHERE usn LIKE ?', [`${institution.usn_prefix}%`]);
        const semesterCount = await query('SELECT COUNT(*) as total FROM semesters s JOIN students st ON s.student_usn = st.usn WHERE st.usn LIKE ?', [`${institution.usn_prefix}%`]);
        
        const cgpaResult = await query('SELECT AVG(cgpa) as avg, MAX(cgpa) as max, MIN(cgpa) as min FROM students WHERE usn LIKE ? AND cgpa > 0', [`${institution.usn_prefix}%`]);
        const avgCgpa = cgpaResult[0]?.avg !== null ? parseFloat(cgpaResult[0].avg).toFixed(2) : '0.00';
        const maxCgpa = cgpaResult[0]?.max !== null ? parseFloat(cgpaResult[0].max).toFixed(2) : '0.00';
        
        const deptStats = await query('SELECT department, COUNT(*) as count FROM students WHERE usn LIKE ? GROUP BY department', [`${institution.usn_prefix}%`]);
        const topStudent = await query('SELECT usn, name, cgpa FROM students WHERE usn LIKE ? AND cgpa > 0 ORDER BY cgpa DESC LIMIT 1', [`${institution.usn_prefix}%`]);
        
        const gradeDist = await query(`
            SELECT 
                SUM(CASE WHEN cgpa >= 8.5 THEN 1 ELSE 0 END) as distinction,
                SUM(CASE WHEN cgpa >= 7 AND cgpa < 8.5 THEN 1 ELSE 0 END) as first_class,
                SUM(CASE WHEN cgpa >= 6 AND cgpa < 7 THEN 1 ELSE 0 END) as second_class,
                SUM(CASE WHEN cgpa < 6 AND cgpa > 0 THEN 1 ELSE 0 END) as pass
            FROM students WHERE usn LIKE ?
        `, [`${institution.usn_prefix}%`]);
        
        res.json({
            success: true,
            data: {
                totalStudents: studentCount[0]?.total || 0,
                totalSemesters: semesterCount[0]?.total || 0,
                avgCgpa: avgCgpa,
                maxCgpa: maxCgpa,
                topStudent: topStudent[0] || null,
                departmentStats: deptStats,
                gradeDistribution: {
                    distinction: gradeDist[0]?.distinction || 0,
                    first_class: gradeDist[0]?.first_class || 0,
                    second_class: gradeDist[0]?.second_class || 0,
                    pass: gradeDist[0]?.pass || 0
                }
            }
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get single student with all data (for edit page) - Only if belongs to institution
app.get('/api/institution/student/:usn', async (req, res) => {
    try {
        const institution = await getInstitutionFromToken(req);
        if (!institution) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        
        const { usn } = req.params;
        
        // Verify student belongs to this institution
        if (!usn.startsWith(institution.usn_prefix)) {
            return res.status(403).json({ success: false, message: 'Access denied - Student does not belong to your institution' });
        }
        
        const students = await query('SELECT * FROM students WHERE usn = ?', [usn]);
        if (students.length === 0) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }
        
        const semesters = await query('SELECT * FROM semesters WHERE student_usn = ? ORDER BY semester_number', [usn]);
        
        for (let semester of semesters) {
            const subjects = await query('SELECT * FROM subjects WHERE semester_id = ?', [semester.id]);
            semester.subjects = subjects;
        }
        
        res.json({ success: true, student: students[0], semesters });
    } catch (error) {
        console.error('Get student error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Add performance record - Validate USN belongs to institution
app.post('/api/institution/add-record', async (req, res) => {
    const { usn, name, department, semester, subjects } = req.body;
    
    try {
        const institution = await getInstitutionFromToken(req);
        if (!institution) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        
        // CRITICAL: Validate USN belongs to this institution
        if (!usn.startsWith(institution.usn_prefix)) {
            return res.status(400).json({ 
                success: false, 
                message: `USN must start with ${institution.usn_prefix} (your institution code)` 
            });
        }
        
        const processedSubjects = subjects.map(sub => {
            if (!sub.gradePoint && sub.marks) {
                const gradeInfo = getGradeFromMarks(sub.marks);
                return { ...sub, gradePoint: gradeInfo.point, grade: gradeInfo.grade };
            }
            return sub;
        });
        
        const sgpa = calculateSGPA(processedSubjects);
        
        const existingStudent = await query('SELECT usn, institution_id FROM students WHERE usn = ?', [usn]);
        if (existingStudent.length === 0) {
            await query('INSERT INTO students (usn, name, department, institution_id) VALUES (?, ?, ?, ?)', [usn, name, department, institution.institution_id]);
        } else if (existingStudent[0].institution_id !== institution.institution_id) {
            return res.status(400).json({ 
                success: false, 
                message: `Student ${usn} already belongs to another institution` 
            });
        }
        
        const existingSemester = await query('SELECT id FROM semesters WHERE student_usn = ? AND semester_number = ?', [usn, semester]);
        
        let semesterId;
        if (existingSemester.length > 0) {
            semesterId = existingSemester[0].id;
            await query('UPDATE semesters SET sgpa = ? WHERE id = ?', [sgpa, semesterId]);
            await query('DELETE FROM subjects WHERE semester_id = ?', [semesterId]);
        } else {
            const result = await query('INSERT INTO semesters (student_usn, semester_number, sgpa) VALUES (?, ?, ?)', [usn, semester, sgpa]);
            semesterId = result.insertId;
        }
        
        for (const subject of processedSubjects) {
            await query(
                'INSERT INTO subjects (semester_id, subject_name, marks, credits, grade_point, grade) VALUES (?, ?, ?, ?, ?, ?)',
                [semesterId, subject.name, subject.marks, subject.credits, subject.gradePoint, subject.grade]
            );
        }
        
        const allSgpas = await query('SELECT sgpa FROM semesters WHERE student_usn = ?', [usn]);
        const cgpa = allSgpas.reduce((sum, s) => sum + parseFloat(s.sgpa), 0) / allSgpas.length;
        await query('UPDATE students SET cgpa = ? WHERE usn = ?', [cgpa, usn]);
        
        io.to(`student_${usn}`).emit('new_result', { semester, sgpa: sgpa.toFixed(2), cgpa: cgpa.toFixed(2) });
        
        res.json({ success: true, sgpa: sgpa.toFixed(2), cgpa: cgpa.toFixed(2) });
    } catch (error) {
        console.error('Add record error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update student basic info
app.put('/api/institution/student/:usn', async (req, res) => {
    try {
        const institution = await getInstitutionFromToken(req);
        if (!institution) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        
        const { usn } = req.params;
        if (!usn.startsWith(institution.usn_prefix)) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }
        
        const { name, email, department, phone } = req.body;
        await query('UPDATE students SET name = ?, email = ?, department = ?, phone = ? WHERE usn = ?', [name, email, department, phone, usn]);
        
        res.json({ success: true, message: 'Student updated successfully' });
    } catch (error) {
        console.error('Update student error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update semester
app.put('/api/institution/semester/:semesterId', async (req, res) => {
    try {
        const institution = await getInstitutionFromToken(req);
        if (!institution) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        
        const { semesterId } = req.params;
        const { semester_number, subjects } = req.body;
        
        let totalCredits = 0, totalPoints = 0;
        subjects.forEach(s => { totalCredits += s.credits; totalPoints += s.credits * s.gradePoint; });
        const sgpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 0;
        
        await query('UPDATE semesters SET semester_number = ?, sgpa = ? WHERE id = ?', [semester_number, sgpa, semesterId]);
        await query('DELETE FROM subjects WHERE semester_id = ?', [semesterId]);
        
        for (const subject of subjects) {
            await query(
                'INSERT INTO subjects (semester_id, subject_name, marks, credits, grade_point, grade) VALUES (?, ?, ?, ?, ?, ?)',
                [semesterId, subject.name, subject.marks, subject.credits, subject.gradePoint, subject.grade]
            );
        }
        
        const studentResult = await query('SELECT student_usn FROM semesters WHERE id = ?', [semesterId]);
        if (studentResult.length > 0) {
            const allSgpas = await query('SELECT sgpa FROM semesters WHERE student_usn = ?', [studentResult[0].student_usn]);
            const cgpa = allSgpas.reduce((sum, s) => sum + parseFloat(s.sgpa), 0) / allSgpas.length;
            await query('UPDATE students SET cgpa = ? WHERE usn = ?', [cgpa, studentResult[0].student_usn]);
        }
        
        res.json({ success: true, message: 'Semester updated successfully', sgpa });
    } catch (error) {
        console.error('Update semester error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete semester
app.delete('/api/institution/semester/:semesterId', async (req, res) => {
    try {
        const institution = await getInstitutionFromToken(req);
        if (!institution) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        
        const { semesterId } = req.params;
        
        const semester = await query('SELECT student_usn FROM semesters WHERE id = ?', [semesterId]);
        await query('DELETE FROM semesters WHERE id = ?', [semesterId]);
        
        if (semester.length > 0) {
            const allSgpas = await query('SELECT sgpa FROM semesters WHERE student_usn = ?', [semester[0].student_usn]);
            const cgpa = allSgpas.length > 0 ? allSgpas.reduce((sum, s) => sum + parseFloat(s.sgpa), 0) / allSgpas.length : 0;
            await query('UPDATE students SET cgpa = ? WHERE usn = ?', [cgpa, semester[0].student_usn]);
        }
        
        res.json({ success: true, message: 'Semester deleted successfully' });
    } catch (error) {
        console.error('Delete semester error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete student
app.delete('/api/institution/student/:usn', async (req, res) => {
    try {
        const institution = await getInstitutionFromToken(req);
        if (!institution) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        
        const { usn } = req.params;
        if (!usn.startsWith(institution.usn_prefix)) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }
        
        await query('DELETE FROM students WHERE usn = ?', [usn]);
        res.json({ success: true, message: 'Student deleted' });
    } catch (error) {
        console.error('Delete student error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});


// ============ INTERNAL MARKS ROUTES (UPDATED) ============

// Add internal marks record - Supports optional IA1/IA2 and custom "out of"
// Add internal marks record - WITH DETAILED ERROR LOGGING
app.post('/api/institution/add-internal-record', async (req, res) => {
    const { usn, name, department, semester, subjects } = req.body;
    
    console.log('=== ADD INTERNAL RECORD REQUEST ===');
    console.log('USN:', usn);
    console.log('Name:', name);
    console.log('Department:', department);
    console.log('Semester:', semester);
    console.log('Subjects:', JSON.stringify(subjects, null, 2));
    console.log('==================================');
    
    // Validation - with specific error messages
    if (!usn) {
        console.log('ERROR: USN is missing');
        return res.status(400).json({ success: false, message: 'USN is required' });
    }
    if (!semester) {
        console.log('ERROR: Semester is missing');
        return res.status(400).json({ success: false, message: 'Semester is required' });
    }
    if (!subjects || subjects.length === 0) {
        console.log('ERROR: No subjects provided');
        return res.status(400).json({ success: false, message: 'At least one subject is required' });
    }
    
    // Validate each subject
    for (let i = 0; i < subjects.length; i++) {
        const sub = subjects[i];
        if (!sub.name) {
            console.log(`ERROR: Subject ${i} has no name`);
            return res.status(400).json({ success: false, message: `Subject ${i+1}: Name is required` });
        }
        // Check if marks are valid numbers
        if (sub.ia1Marks !== null && sub.ia1Marks !== undefined && isNaN(sub.ia1Marks)) {
            console.log(`ERROR: Subject ${sub.name} has invalid IA1 marks: ${sub.ia1Marks}`);
            return res.status(400).json({ success: false, message: `${sub.name}: Invalid IA1 marks` });
        }
        if (sub.ia2Marks !== null && sub.ia2Marks !== undefined && isNaN(sub.ia2Marks)) {
            console.log(`ERROR: Subject ${sub.name} has invalid IA2 marks: ${sub.ia2Marks}`);
            return res.status(400).json({ success: false, message: `${sub.name}: Invalid IA2 marks` });
        }
    }
    
    try {
        const institution = await getInstitutionFromToken(req);
        if (!institution) {
            console.log('ERROR: Institution not authenticated');
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        
        console.log('Institution found:', institution.institution_id, 'Prefix:', institution.usn_prefix);
        
        // Validate USN belongs to this institution
        if (!usn.startsWith(institution.usn_prefix)) {
            console.log(`ERROR: USN ${usn} does not start with prefix ${institution.usn_prefix}`);
            return res.status(400).json({ 
                success: false, 
                message: `USN must start with ${institution.usn_prefix} (your institution code)` 
            });
        }
        
        // Check if student exists
        const existingStudent = await query('SELECT usn, institution_id FROM students WHERE usn = ?', [usn]);
        console.log('Existing student check:', existingStudent.length > 0 ? 'Found' : 'Not found');
        
        if (existingStudent.length === 0) {
            console.log('Creating new student...');
            await query(
                'INSERT INTO students (usn, name, department, institution_id) VALUES (?, ?, ?, ?)', 
                [usn, name || 'Student', department || 'CSE', institution.institution_id]
            );
        } else if (existingStudent[0].institution_id !== institution.institution_id) {
            console.log(`ERROR: Student belongs to different institution: ${existingStudent[0].institution_id}`);
            return res.status(400).json({ 
                success: false, 
                message: `Student ${usn} already belongs to another institution` 
            });
        }
        
        // Process each subject
        let insertedCount = 0;
        for (const subject of subjects) {
            if (!subject.name) {
                console.log('Skipping subject with no name:', subject);
                continue;
            }
            
            // Handle optional values
            let ia1Marks = null;
            let ia1OutOf = 100;
            let ia2Marks = null;
            let ia2OutOf = 100;
            
            if (subject.ia1Marks !== undefined && subject.ia1Marks !== null && subject.ia1Marks !== '') {
                ia1Marks = parseFloat(subject.ia1Marks);
                if (isNaN(ia1Marks)) ia1Marks = null;
            }
            if (subject.ia1OutOf !== undefined && subject.ia1OutOf !== null && subject.ia1OutOf !== '') {
                ia1OutOf = parseFloat(subject.ia1OutOf);
                if (isNaN(ia1OutOf)) ia1OutOf = 100;
            }
            if (subject.ia2Marks !== undefined && subject.ia2Marks !== null && subject.ia2Marks !== '') {
                ia2Marks = parseFloat(subject.ia2Marks);
                if (isNaN(ia2Marks)) ia2Marks = null;
            }
            if (subject.ia2OutOf !== undefined && subject.ia2OutOf !== null && subject.ia2OutOf !== '') {
                ia2OutOf = parseFloat(subject.ia2OutOf);
                if (isNaN(ia2OutOf)) ia2OutOf = 100;
            }
            
            console.log(`Processing: ${subject.name}, IA1: ${ia1Marks}/${ia1OutOf}, IA2: ${ia2Marks}/${ia2OutOf}`);
            
            if (ia1Marks === null && ia2Marks === null) {
                console.log(`Skipping ${subject.name} - no marks provided`);
                continue;
            }
            
            const queryResult = await query(
                `INSERT INTO internal_marks (student_usn, semester_number, subject_name, ia1_marks, ia1_out_of, ia2_marks, ia2_out_of) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE 
                 ia1_marks = VALUES(ia1_marks),
                 ia1_out_of = VALUES(ia1_out_of),
                 ia2_marks = VALUES(ia2_marks),
                 ia2_out_of = VALUES(ia2_out_of)`,
                [usn, semester, subject.name, ia1Marks, ia1OutOf, ia2Marks, ia2OutOf]
            );
            console.log(`Insert result for ${subject.name}:`, queryResult);
            insertedCount++;
        }
        
        if (insertedCount === 0) {
            console.log('ERROR: No valid subjects to insert');
            return res.status(400).json({ success: false, message: 'No valid subjects to insert - please provide at least one subject with marks' });
        }
        
        // Send notification
        io.to(`student_${usn}`).emit('new_internal_result', { 
            semester, 
            message: 'Internal marks updated!' 
        });
        
        console.log(`✅ SUCCESS: Internal marks added for ${usn}, Semester ${semester}, ${insertedCount} subjects`);
        res.json({ success: true, message: 'Internal marks added successfully!' });
        
    } catch (error) {
        console.error('❌ ADD INTERNAL RECORD ERROR:', error);
        console.error('Error stack:', error.stack);
        // Send the actual error message to help debug
        res.status(500).json({ success: false, message: error.message });
    }
});

// Edit internal marks for a specific subject
app.put('/api/institution/edit-internal-marks', async (req, res) => {
    const { usn, semester, subject_name, ia1Marks, ia1OutOf, ia2Marks, ia2OutOf } = req.body;
    
    console.log('=== EDIT INTERNAL MARKS REQUEST ===');
    console.log('USN:', usn);
    console.log('Semester:', semester);
    console.log('Subject:', subject_name);
    console.log('IA1:', ia1Marks, '/', ia1OutOf);
    console.log('IA2:', ia2Marks, '/', ia2OutOf);
    console.log('==================================');
    
    try {
        const institution = await getInstitutionFromToken(req);
        if (!institution) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        
        // Validate USN belongs to this institution
        if (!usn.startsWith(institution.usn_prefix)) {
            return res.status(400).json({ 
                success: false, 
                message: `USN must start with ${institution.usn_prefix}` 
            });
        }
        
        // Update the internal marks
        await query(
            `UPDATE internal_marks 
             SET ia1_marks = ?, ia1_out_of = ?, ia2_marks = ?, ia2_out_of = ?, updated_at = CURRENT_TIMESTAMP
             WHERE student_usn = ? AND semester_number = ? AND subject_name = ?`,
            [ia1Marks || null, ia1OutOf || 100, ia2Marks || null, ia2OutOf || 100, usn, semester, subject_name]
        );
        
        console.log(`✅ Internal marks updated for ${usn}, Semester ${semester}, Subject: ${subject_name}`);
        res.json({ success: true, message: 'Internal marks updated successfully!' });
        
    } catch (error) {
        console.error('Edit internal marks error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get internal marks for student (STUDENT ONLY)
app.get('/api/student/internal-marks', async (req, res) => {
    try {
        const student = await getStudentFromToken(req);
        if (!student) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        
        const internalMarks = await query(
            'SELECT semester_number, subject_name, ia1_marks, ia1_out_of, ia2_marks, ia2_out_of FROM internal_marks WHERE student_usn = ? ORDER BY semester_number, subject_name',
            [student.usn]
        );
        
        const groupedBySemester = {};
        internalMarks.forEach(mark => {
            if (!groupedBySemester[mark.semester_number]) {
                groupedBySemester[mark.semester_number] = [];
            }
            groupedBySemester[mark.semester_number].push({
                subject_name: mark.subject_name,
                ia1_marks: mark.ia1_marks,
                ia1_out_of: mark.ia1_out_of,
                ia2_marks: mark.ia2_marks,
                ia2_out_of: mark.ia2_out_of
            });
        });
        
        res.json({ success: true, data: groupedBySemester });
    } catch (error) {
        console.error('Get student internal marks error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get internal marks for institution view
app.get('/api/institution/student-internal/:usn', async (req, res) => {
    try {
        const institution = await getInstitutionFromToken(req);
        if (!institution) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        
        const { usn } = req.params;
        if (!usn.startsWith(institution.usn_prefix)) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }
        
        const internalMarks = await query(
            'SELECT semester_number, subject_name, ia1_marks, ia1_out_of, ia2_marks, ia2_out_of FROM internal_marks WHERE student_usn = ? ORDER BY semester_number, subject_name',
            [usn]
        );
        
        const groupedBySemester = {};
        internalMarks.forEach(mark => {
            if (!groupedBySemester[mark.semester_number]) {
                groupedBySemester[mark.semester_number] = [];
            }
            groupedBySemester[mark.semester_number].push({
                subject_name: mark.subject_name,
                ia1_marks: mark.ia1_marks,
                ia1_out_of: mark.ia1_out_of,
                ia2_marks: mark.ia2_marks,
                ia2_out_of: mark.ia2_out_of
            });
        });
        
        res.json({ success: true, data: groupedBySemester });
    } catch (error) {
        console.error('Get institution internal marks error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete internal marks for a semester
app.delete('/api/institution/internal-semester/:usn/:semester', async (req, res) => {
    try {
        const institution = await getInstitutionFromToken(req);
        if (!institution) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        
        const { usn, semester } = req.params;
        if (!usn.startsWith(institution.usn_prefix)) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }
        
        await query('DELETE FROM internal_marks WHERE student_usn = ? AND semester_number = ?', [usn, semester]);
        
        res.json({ success: true, message: 'Internal marks deleted successfully' });
    } catch (error) {
        console.error('Delete internal semester error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get all students with internal marks (for institution list)
app.get('/api/institution/internal-students', async (req, res) => {
    try {
        const institution = await getInstitutionFromToken(req);
        if (!institution) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        
        const students = await query(`
            SELECT DISTINCT s.usn, s.name, s.email, s.department
            FROM students s
            WHERE s.usn LIKE ?
            ORDER BY s.name
        `, [`${institution.usn_prefix}%`]);
        
        // Get internal marks count for each student
        for (let student of students) {
            const marksCount = await query(
                'SELECT COUNT(DISTINCT semester_number) as semester_count FROM internal_marks WHERE student_usn = ?',
                [student.usn]
            );
            student.semester_count = marksCount[0]?.semester_count || 0;
        }
        
        res.json({ success: true, students });
    } catch (error) {
        console.error('Get internal students error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get semester-wise performance
app.get('/api/institution/semester-performance', async (req, res) => {
    try {
        const institution = await getInstitutionFromToken(req);
        if (!institution) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        
        const performance = await query(`
            SELECT semester_number, AVG(sgpa) as avg_sgpa, COUNT(*) as student_count
            FROM semesters s
            JOIN students st ON s.student_usn = st.usn
            WHERE st.usn LIKE ?
            GROUP BY semester_number
            ORDER BY semester_number
        `, [`${institution.usn_prefix}%`]);
        
        const formatted = performance.map(p => ({
            semester_number: p.semester_number,
            avg_sgpa: p.avg_sgpa ? parseFloat(p.avg_sgpa).toFixed(2) : '0.00',
            student_count: p.student_count
        }));
        
        res.json({ success: true, data: formatted });
    } catch (error) {
        console.error('Semester performance error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get department comparison
app.get('/api/institution/department-comparison', async (req, res) => {
    try {
        const institution = await getInstitutionFromToken(req);
        if (!institution) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        
        const deptData = await query(`
            SELECT department, AVG(cgpa) as avg_cgpa, COUNT(*) as student_count
            FROM students
            WHERE usn LIKE ? AND cgpa > 0
            GROUP BY department
            ORDER BY avg_cgpa DESC
        `, [`${institution.usn_prefix}%`]);
        
        const formatted = deptData.map(d => ({
            department: d.department,
            avg_cgpa: d.avg_cgpa ? parseFloat(d.avg_cgpa).toFixed(2) : '0.00',
            student_count: d.student_count
        }));
        
        res.json({ success: true, data: formatted });
    } catch (error) {
        console.error('Department comparison error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Check if USN exists
app.get('/api/institution/check-usn/:usn', async (req, res) => {
    try {
        const { usn } = req.params;
        const existing = await query('SELECT usn FROM students WHERE usn = ?', [usn]);
        res.json({ success: true, exists: existing.length > 0 });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============ DEPARTMENT & SUBJECT MANAGEMENT ROUTES ============

// Get all departments for institution
app.get('/api/institution/departments', async (req, res) => {
    try {
        const institution = await getInstitutionFromToken(req);
        if (!institution) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        
        const departments = await query(
            'SELECT * FROM institution_departments WHERE institution_id = ? ORDER BY department_name',
            [institution.institution_id]
        );
        
        res.json({ success: true, data: departments });
    } catch (error) {
        console.error('Get departments error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Add new department
app.post('/api/institution/departments', async (req, res) => {
    try {
        const institution = await getInstitutionFromToken(req);
        if (!institution) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        
        const { department_code, department_name } = req.body;
        
        if (!department_code || !department_name) {
            return res.status(400).json({ success: false, message: 'Department code and name are required' });
        }
        
        await query(
            'INSERT INTO institution_departments (institution_id, department_code, department_name) VALUES (?, ?, ?)',
            [institution.institution_id, department_code.toUpperCase(), department_name]
        );
        
        res.json({ success: true, message: 'Department added successfully' });
    } catch (error) {
        console.error('Add department error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete department
app.delete('/api/institution/departments/:department_code', async (req, res) => {
    try {
        const institution = await getInstitutionFromToken(req);
        if (!institution) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        
        const { department_code } = req.params;
        
        await query(
            'DELETE FROM institution_departments WHERE institution_id = ? AND department_code = ?',
            [institution.institution_id, department_code.toUpperCase()]
        );
        
        res.json({ success: true, message: 'Department deleted successfully' });
    } catch (error) {
        console.error('Delete department error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get external subjects for a department and semester
app.get('/api/institution/external-subjects', async (req, res) => {
    try {
        const institution = await getInstitutionFromToken(req);
        if (!institution) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        
        const { department_code, semester_number } = req.query;
        
        let sql = 'SELECT * FROM external_subjects WHERE institution_id = ?';
        const params = [institution.institution_id];
        
        if (department_code) {
            sql += ' AND department_code = ?';
            params.push(department_code);
        }
        if (semester_number) {
            sql += ' AND semester_number = ?';
            params.push(semester_number);
        }
        
        sql += ' ORDER BY semester_number, subject_name';
        
        const subjects = await query(sql, params);
        res.json({ success: true, data: subjects });
    } catch (error) {
        console.error('Get external subjects error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Add/Update external subject
app.post('/api/institution/external-subjects', async (req, res) => {
    try {
        const institution = await getInstitutionFromToken(req);
        if (!institution) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        
        const { department_code, semester_number, subject_code, subject_name, credits, max_marks } = req.body;
        
        if (!department_code || !semester_number || !subject_code || !subject_name || !credits) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }
        
        await query(
            `INSERT INTO external_subjects (institution_id, department_code, semester_number, subject_code, subject_name, credits, max_marks) 
             VALUES (?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE subject_name = ?, credits = ?, max_marks = ?`,
            [institution.institution_id, department_code, semester_number, subject_code.toUpperCase(), subject_name, credits, max_marks || 100, subject_name, credits, max_marks || 100]
        );
        
        res.json({ success: true, message: 'External subject saved successfully' });
    } catch (error) {
        console.error('Save external subject error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete external subject
app.delete('/api/institution/external-subjects/:id', async (req, res) => {
    try {
        const institution = await getInstitutionFromToken(req);
        if (!institution) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        
        const { id } = req.params;
        
        await query('DELETE FROM external_subjects WHERE id = ? AND institution_id = ?', [id, institution.institution_id]);
        
        res.json({ success: true, message: 'External subject deleted successfully' });
    } catch (error) {
        console.error('Delete external subject error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get internal subjects for a department and semester
app.get('/api/institution/internal-subjects', async (req, res) => {
    try {
        const institution = await getInstitutionFromToken(req);
        if (!institution) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        
        const { department_code, semester_number } = req.query;
        
        let sql = 'SELECT * FROM internal_subjects WHERE institution_id = ?';
        const params = [institution.institution_id];
        
        if (department_code) {
            sql += ' AND department_code = ?';
            params.push(department_code);
        }
        if (semester_number) {
            sql += ' AND semester_number = ?';
            params.push(semester_number);
        }
        
        sql += ' ORDER BY semester_number, subject_name';
        
        const subjects = await query(sql, params);
        res.json({ success: true, data: subjects });
    } catch (error) {
        console.error('Get internal subjects error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Add/Update internal subject
app.post('/api/institution/internal-subjects', async (req, res) => {
    try {
        const institution = await getInstitutionFromToken(req);
        if (!institution) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        
        const { department_code, semester_number, subject_code, subject_name, ia1_max_marks, ia2_max_marks } = req.body;
        
        if (!department_code || !semester_number || !subject_code || !subject_name) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }
        
        await query(
            `INSERT INTO internal_subjects (institution_id, department_code, semester_number, subject_code, subject_name, ia1_max_marks, ia2_max_marks) 
             VALUES (?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE subject_name = ?, ia1_max_marks = ?, ia2_max_marks = ?`,
            [institution.institution_id, department_code, semester_number, subject_code.toUpperCase(), subject_name, ia1_max_marks || 50, ia2_max_marks || 50, subject_name, ia1_max_marks || 50, ia2_max_marks || 50]
        );
        
        res.json({ success: true, message: 'Internal subject saved successfully' });
    } catch (error) {
        console.error('Save internal subject error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete individual internal subject
app.delete('/api/institution/internal-subject/:id', async (req, res) => {
    try {
        const institution = await getInstitutionFromToken(req);
        if (!institution) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        
        const { id } = req.params;
        
        await query('DELETE FROM internal_marks WHERE id = ?', [id]);
        
        res.json({ success: true, message: 'Internal subject deleted successfully' });
    } catch (error) {
        console.error('Delete internal subject error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete internal subject
app.delete('/api/institution/internal-subjects/:id', async (req, res) => {
    try {
        const institution = await getInstitutionFromToken(req);
        if (!institution) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        
        const { id } = req.params;
        
        await query('DELETE FROM internal_subjects WHERE id = ? AND institution_id = ?', [id, institution.institution_id]);
        
        res.json({ success: true, message: 'Internal subject deleted successfully' });
    } catch (error) {
        console.error('Delete internal subject error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get available semesters for a department (from configured subjects)
app.get('/api/institution/available-semesters', async (req, res) => {
    try {
        const institution = await getInstitutionFromToken(req);
        if (!institution) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        
        const { department_code, type } = req.query; // type: 'external' or 'internal'
        
        let table = type === 'internal' ? 'internal_subjects' : 'external_subjects';
        
        const semesters = await query(
            `SELECT DISTINCT semester_number FROM ${table} 
             WHERE institution_id = ? AND department_code = ? 
             ORDER BY semester_number`,
            [institution.institution_id, department_code]
        );
        
        res.json({ success: true, data: semesters.map(s => s.semester_number) });
    } catch (error) {
        console.error('Get available semesters error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get subjects for a specific department and semester (for form auto-fill)
app.get('/api/institution/subjects-for-form', async (req, res) => {
    try {
        const institution = await getInstitutionFromToken(req);
        if (!institution) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        
        const { department_code, semester_number, type } = req.query; // type: 'external' or 'internal'
        
        if (!department_code || !semester_number || !type) {
            return res.status(400).json({ success: false, message: 'Missing required parameters' });
        }
        
        let table = type === 'internal' ? 'internal_subjects' : 'external_subjects';
        
        // Different SELECT queries for external vs internal
        let queryText = '';
        if (type === 'external') {
            queryText = `
                SELECT subject_code, subject_name, credits, max_marks 
                FROM ${table} 
                WHERE institution_id = ? AND department_code = ? AND semester_number = ?
                ORDER BY subject_name
            `;
        } else {
            queryText = `
                SELECT subject_code, subject_name, ia1_max_marks, ia2_max_marks 
                FROM ${table} 
                WHERE institution_id = ? AND department_code = ? AND semester_number = ?
                ORDER BY subject_name
            `;
        }
        
        let subjects = await query(queryText, [institution.institution_id, department_code, semester_number]);
        
        // Format subjects based on type
        let formattedSubjects = subjects.map(sub => {
            if (type === 'external') {
                return {
                    name: sub.subject_name,
                    code: sub.subject_code,
                    credits: sub.credits,
                    maxMarks: sub.max_marks,
                    marks: null,
                    gradePoint: null,
                    grade: null
                };
            } else {
                return {
                    name: sub.subject_name,
                    code: sub.subject_code,
                    ia1MaxMarks: sub.ia1_max_marks,
                    ia2MaxMarks: sub.ia2_max_marks,
                    ia1Marks: null,
                    ia2Marks: null
                };
            }
        });
        
        res.json({ success: true, data: formattedSubjects });
    } catch (error) {
        console.error('Get subjects for form error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============ NOTIFICATION ROUTES ============

// Get notifications for student
app.get('/api/notifications', async (req, res) => {
    try {
        const student = await getStudentFromToken(req);
        if (!student) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        
        const notifications = await query('SELECT * FROM notifications WHERE student_usn = ? ORDER BY created_at DESC LIMIT 20', [student.usn]);
        const unreadCount = notifications.filter(n => !n.is_read).length;
        res.json({ success: true, data: notifications, unreadCount });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Mark notification as read
app.put('/api/notifications/:id/read', async (req, res) => {
    try {
        await query('UPDATE notifications SET is_read = TRUE WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        console.error('Mark read error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============ SOCKET.IO ============
io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);
    socket.on('join_notifications', (usn) => socket.join(`student_${usn}`));
    socket.on('disconnect', () => console.log('🔌 Client disconnected:', socket.id));
});
app.set('io', io);

// ============ SERVE FRONTEND ============
app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'public', 'index.html')); });

// ============ START SERVER ============
async function startServer() {
    const dbConnected = await testConnection();
    if (!dbConnected) {
        console.error('❌ Cannot start server without database');
        process.exit(1);
    }
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
}

startServer();