// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

const router = express.Router();

// Student Login
router.post('/student/login', async (req, res) => {
  try {
    const { usn, password } = req.body;
    
    const students = await query('SELECT * FROM students WHERE usn = ?', [usn]);
    
    if (students.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid USN or password' });
    }
    
    const student = students[0];
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
      user: { usn: student.usn, name: student.name, role: 'student' }
    });
  } catch (error) {
    console.error('Student login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Student Register
router.post('/student/register', async (req, res) => {
  try {
    const { usn, name, email, password, department } = req.body;
    
    const existing = await query('SELECT usn FROM students WHERE usn = ? OR email = ?', [usn, email]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'USN or Email already exists' });
    }
    
    const hashedPassword = bcrypt.hashSync(password, 10);
    const institutionId = 'INST001';
    
    await query(
      'INSERT INTO students (usn, name, email, password, department, institution_id) VALUES (?, ?, ?, ?, ?, ?)',
      [usn, name, email, hashedPassword, department, institutionId]
    );
    
    res.json({ success: true, message: 'Registration successful! Please login.' });
  } catch (error) {
    console.error('Student registration error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Institution Login
router.post('/institution/login', async (req, res) => {
  try {
    const { institutionId, password } = req.body;
    
    const institutions = await query('SELECT * FROM institutions WHERE institution_id = ?', [institutionId]);
    
    if (institutions.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid Institution ID or password' });
    }
    
    const institution = institutions[0];
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
});

// Institution Register
router.post('/institution/register', async (req, res) => {
  try {
    const { name, email, adminName, password } = req.body;
    
    const existing = await query('SELECT email FROM institutions WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }
    
    const institutionId = 'INST' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const hashedPassword = bcrypt.hashSync(password, 10);
    
    await query(
      'INSERT INTO institutions (institution_id, name, email, admin_name, password) VALUES (?, ?, ?, ?, ?)',
      [institutionId, name, email, adminName, hashedPassword]
    );
    
    res.json({ success: true, message: 'Registration successful!', institutionId });
  } catch (error) {
    console.error('Institution registration error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;