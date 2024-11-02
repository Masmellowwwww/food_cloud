// server.js

require('dotenv').config();
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3000;

// เชื่อมต่อกับฐานข้อมูล SQLite
const db = new sqlite3.Database('./food_db.sqlite', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the SQLite database.');
});

// // สร้างตาราง foods ถ้ายังไม่มีในฐานข้อมูล
// db.run(`CREATE TABLE IF NOT EXISTS foods (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     name TEXT NOT NULL,
//     expiry_date TEXT NOT NULL,
//     quantity INTEGER DEFAULT 1
// )`);

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
    db.run(query, [name, expiry_date, quantity], function (err) {
        if (err) {
            return console.error(err.message);
        }
        res.send('Food added successfully');
    });
});


// Route แสดงรายการอาหารทั้งหมดพร้อมกับวันที่เหลือ
app.get('/foods', (req, res) => {
    const query = `
        SELECT id, name, expiry_date, quantity, 
        ROUND(julianday(expiry_date) - julianday('now')) AS days_remaining
        FROM foods
        ORDER BY expiry_date
    `;
    db.all(query, [], (err, rows) => {
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
        ROUND(julianday(expiry_date) - julianday('now')) AS days_remaining
        FROM foods
        WHERE julianday(expiry_date) - julianday('now') <= 3
        ORDER BY expiry_date
    `;
    db.all(query, [], (err, rows) => {
        if (err) {
            throw err;
        }
        res.json(rows);
    });
});


// Route ลบรายการอาหาร
app.post('/deletefood', (req, res) => {
    const { id } = req.body;
    const query = `DELETE FROM foods WHERE id = ?`;
    db.run(query, [id], function (err) {
        if (err) {
            return console.error(err.message);
        }
        res.send('Food deleted successfully');
    });
});

// เริ่มเซิร์ฟเวอร์
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
