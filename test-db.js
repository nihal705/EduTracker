const mysql = require('mysql2/promise');

async function test() {
    try {
        const conn = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'Nihal@786313',
            database: 'student_ap_tracker'
        });
        
        console.log('✅ Database connected');
        
        const [tables] = await conn.query('SHOW TABLES');
        console.log('Tables:', tables);
        
        const [students] = await conn.query('SELECT * FROM students LIMIT 5');
        console.log('Students:', students);
        
        await conn.end();
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

test();