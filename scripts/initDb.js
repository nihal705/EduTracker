// scripts/initDb.js - Database Initialization Script
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function initDatabase() {
    console.log('🚀 Starting EduTracker Database Initialization...\n');
    
    // Create connection without database
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || ''
    });
    
    console.log('✅ Connected to MySQL server');
    
    // Create database if not exists
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
    console.log(`✅ Database '${process.env.DB_NAME}' created/verified`);
    
    await connection.query(`USE ${process.env.DB_NAME}`);
    
    // Read and execute schema
    const schemaPath = path.join(__dirname, '..', 'sql', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split schema into individual statements
    const statements = schema.split(';').filter(s => s.trim());
    
    for (const statement of statements) {
        try {
            await connection.query(statement);
        } catch (err) {
            if (!err.message.includes('already exists')) {
                console.warn('⚠️ Statement warning:', err.message);
            }
        }
    }
    console.log('✅ Database schema created');
    
    // Create default institution
    const hashedPassword = bcrypt.hashSync('Admin@123', 10);
    
    await connection.query(
        `INSERT IGNORE INTO institutions (institution_id, name, email, admin_name, password) 
         VALUES (?, ?, ?, ?, ?)`,
        ['INST001', 'Demo Engineering College', 'admin@demo.edu', 'Admin User', hashedPassword]
    );
    console.log('✅ Default institution created (ID: INST001, Password: Admin@123)');
    
    // Create sample student
    const studentPassword = bcrypt.hashSync('student123', 10);
    
    await connection.query(
        `INSERT IGNORE INTO students (usn, name, email, department, institution_id, password) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        ['1SP23CS001', 'John Doe', 'john@student.edu', 'CSE', 'INST001', studentPassword]
    );
    console.log('✅ Sample student created (USN: 1SP23CS001, Password: student123)');
    
    // Create sample semester
    await connection.query(
        `INSERT IGNORE INTO semesters (student_usn, semester_number, sgpa) 
         VALUES (?, ?, ?)`,
        ['1SP23CS001', 1, 8.5]
    );
    
    // Get semester ID
    const [semester] = await connection.query(
        'SELECT id FROM semesters WHERE student_usn = ? AND semester_number = ?',
        ['1SP23CS001', 1]
    );
    
    if (semester.length > 0) {
        const semesterId = semester[0].id;
        
        // Create sample subjects
        const subjects = [
            ['Mathematics', 85, 4, 8, 'A'],
            ['Physics', 80, 4, 8, 'A'],
            ['Programming', 90, 4, 9, 'A+'],
            ['Chemistry', 75, 3, 7, 'B+']
        ];
        
        for (const subject of subjects) {
            await connection.query(
                `INSERT IGNORE INTO subjects (semester_id, subject_name, marks, credits, grade_point, grade) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [semesterId, ...subject]
            );
        }
        console.log('✅ Sample subjects created');
    }
    
    console.log('\n🎉 Database initialization complete!\n');
    console.log('📋 Login Credentials:');
    console.log('   Student: USN = 1SP23CS001, Password = student123');
    console.log('   Institution: ID = INST001, Password = Admin@123');
    console.log('\n💡 Run "npm run dev" to start the server\n');
    
    await connection.end();
}

initDatabase().catch(err => {
    console.error('❌ Database initialization failed:', err);
    process.exit(1);
});