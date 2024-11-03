require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// เชื่อมต่อกับฐานข้อมูล MySQL โดยใช้ตัวแปรจาก .env
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

db.connect((err) => {
    if (err) {
        console.error('Database connection error:', err.message);
    } else {
        console.log('Connected to the MySQL database.');
    }
});

// สร้างตาราง foods ถ้ายังไม่มีในฐานข้อมูล
db.query(`CREATE TABLE IF NOT EXISTS foods (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    expiry_date DATE NOT NULL,
    quantity INT DEFAULT 1
)`, (err) => {
    if (err) {
        console.error('Table creation error:', err.message);
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
    db.query(query, [name, expiry_date, quantity], (err, result) => {
        if (err) {
            console.error('Insert error:', err.message);
            res.status(500).send('Database error');
        } else {
            res.send('Food added successfully');
        }
    });
});

// Route แสดงรายการอาหารทั้งหมดพร้อมกับวันที่เหลือ
app.get('/foods', (req, res) => {
    const query = `
        SELECT id, name, expiry_date, quantity, 
        ROUND(DATEDIFF(expiry_date, CURDATE())) AS days_remaining
        FROM foods
        ORDER BY expiry_date
    `;
    db.query(query, (err, rows) => {
        if (err) {
            console.error('Query error:', err.message);
            res.status(500).send('Database error');
        } else {
            res.json(rows);
        }
    });
});

// Route แสดงอาหารใกล้หมดอายุ (ภายใน 3 วัน)
app.get('/foods/expiring-soon', (req, res) => {
    const query = `
        SELECT id, name, expiry_date, quantity,
        ROUND(DATEDIFF(expiry_date, CURDATE())) AS days_remaining
        FROM foods
        WHERE DATEDIFF(expiry_date, CURDATE()) <= 3
        ORDER BY expiry_date
    `;
    db.query(query, (err, rows) => {
        if (err) {
            console.error('Query error:', err.message);
            res.status(500).send('Database error');
        } else {
            res.json(rows);
        }
    });
});

// Route ลบรายการอาหาร
app.post('/deletefood', (req, res) => {
    const { id } = req.body;
    const query = `DELETE FROM foods WHERE id = ?`;
    db.query(query, [id], (err, result) => {
        if (err) {
            console.error('Delete error:', err.message);
            res.status(500).send('Database error');
        } else {
            res.send('Food deleted successfully');
        }
    });
});

// เริ่มเซิร์ฟเวอร์
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
