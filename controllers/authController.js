// controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const Institution = require('../models/Institution');

class AuthController {
    // Student Login
    static async studentLogin(req, res) {
        try {
            const { usn, password } = req.body;
            
            const student = await Student.findByUsn(usn);
            if (!student) {
                return res.status(401).json({ success: false, message: 'Invalid USN or password' });
            }
            
            const validPassword = bcrypt.compareSync(password, student.password);
            if (!validPassword) {
                return res.status(401).json({ success: false, message: 'Invalid USN or password' });
            }
            
            const token = jwt.sign(
                { id: student.id, usn: student.usn, role: 'student', name: student.name },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN }
            );
            
            res.json({
                success: true,
                token,
                user: { usn: student.usn, name: student.name, role: 'student', email: student.email }
            });
        } catch (error) {
            console.error('Student login error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    // Student Register
    static async studentRegister(req, res) {
        try {
            const { usn, name, email, department, password } = req.body;
            
            const existing = await Student.findByUsn(usn);
            if (existing) {
                return res.status(400).json({ success: false, message: 'USN already exists' });
            }
            
            const hashedPassword = bcrypt.hashSync(password, 10);
            
            await Student.create({
                usn, name, email, department,
                institution_id: 'INST001',
                password: hashedPassword
            });
            
            res.json({ success: true, message: 'Registration successful!' });
        } catch (error) {
            console.error('Student registration error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    // Institution Login
    static async institutionLogin(req, res) {
        try {
            const { institutionId, password } = req.body;
            
            const institution = await Institution.findById(institutionId);
            if (!institution) {
                return res.status(401).json({ success: false, message: 'Invalid Institution ID or password' });
            }
            
            const validPassword = bcrypt.compareSync(password, institution.password);
            if (!validPassword) {
                return res.status(401).json({ success: false, message: 'Invalid Institution ID or password' });
            }
            
            const token = jwt.sign(
                { id: institution.id, institutionId: institution.institution_id, role: 'institution', name: institution.name },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN }
            );
            
            res.json({
                success: true,
                token,
                user: { institutionId: institution.institution_id, name: institution.name, role: 'institution' }
            });
        } catch (error) {
            console.error('Institution login error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    // Institution Register
    static async institutionRegister(req, res) {
        try {
            const { name, email, adminName, password } = req.body;
            
            const hashedPassword = bcrypt.hashSync(password, 10);
            const institution = await Institution.create({
                name, email, admin_name: adminName, password: hashedPassword
            });
            
            res.json({
                success: true,
                message: 'Registration successful!',
                institutionId: institution.institution_id
            });
        } catch (error) {
            console.error('Institution registration error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    // Verify Token
    static async verifyToken(req, res) {
        try {
            const token = req.headers.authorization?.split(' ')[1];
            if (!token) {
                return res.json({ success: false, valid: false });
            }
            
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            res.json({ success: true, valid: true, user: decoded });
        } catch (error) {
            res.json({ success: false, valid: false });
        }
    }
}

module.exports = AuthController;