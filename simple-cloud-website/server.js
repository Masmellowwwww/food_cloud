require('dotenv').config();
const express = require('express');
const mysql = require('mysql2'); // ใช้ mysql2 แทน sqlite3
const path = require('path');

const app = express();
const PORT = 3000;

// เชื่อมต่อกับฐานข้อมูล MySQL
const db = mysql.createConnection({
    host: 'foodwisedb2.cnw4e2a0gook.us-east-1.rds.amazonaws.com', // แทนที่ด้วย Endpoint ของ RDS
    user: 'admin',
    password: 'VS486prKl!fw~%{.86|kUVrCxM_y',
    database: 'foodwisedb'
});

db.connect((err) => {
    if (err) {
        console.error('Database connection error:', err);
    } else {
        console.log('Connected to MySQL database');
    }
});

// ตั้งค่า body parser และโฟลเดอร์สำหรับแสดง HTML
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'views')));

// หน้าเว็บหลัก
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Route เพิ่มอาหารใหม่
app.post('/addfood', (req, res) => {
    const { name, expiry_date, quantity } = req.body;
    const query = `INSERT INTO foods (name, expiry_date, quantity) VALUES (?, ?, ?)`;
    db.query(query, [name, expiry_date, quantity], function (err, result) { // เปลี่ยน db.run เป็น db.query
        if (err) {
            return console.error(err.message);
        }
        res.send('Food added successfully');
    });
});

// Route แสดงรายการอาหารทั้งหมด
app.get('/foods', (req, res) => {
    const query = `SELECT * FROM foods ORDER BY expiry_date`;
    db.query(query, (err, rows) => { // เปลี่ยน db.all เป็น db.query
        if (err) {
            throw err;
        }
        res.json(rows);
    });
});

// Route แสดงอาหารใกล้หมดอายุ (ภายใน 3 วัน) พร้อมแสดงจำนวนวันที่เหลือ
app.get('/foods/expiring-soon', (req, res) => {
    const query = `
        SELECT id, name, expiry_date, quantity,
        DATEDIFF(expiry_date, CURDATE()) AS days_remaining
        FROM foods
        WHERE DATEDIFF(expiry_date, CURDATE()) <= 3
        ORDER BY expiry_date
    `;
    db.query(query, (err, rows) => { // เปลี่ยน db.all เป็น db.query
        if (err) {
            throw err;
        }
        res.json(rows);
    });
});

// เริ่มเซิร์ฟเวอร์
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
