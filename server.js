// server.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const session = require('express-session');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'secret-key-risk-app-please-change',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 1 วัน
}));

// ให้ไฟล์ static จาก public
app.use(express.static(path.join(__dirname, 'public')));

// Middleware ตรวจสอบการล็อกอิน
function checkAuth(req, res, next) {
    if (req.session && req.session.loggedIn) {
        return next();
    } else {
        res.status(401).send('<h2>คุณต้องล็อกอินก่อน <a href="/admin.html">กลับไปล็อกอิน</a></h2>');
    }
}

// ถ้าผู้ใช้เรียก /admin.html -> ถ้าล็อกอินแล้วให้ส่ง admin.html (root) มิฉะนั้นส่งหน้า login ใน public
app.get('/admin.html', (req, res) => {
    if (req.session && req.session.loggedIn) {
        res.sendFile(path.join(__dirname, 'admin.html'));
    } else {
        res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
    }
});

// API ล็อกอิน (form POST)
app.post('/admin/login', (req, res) => {
    const { username, password } = req.body;
    // ค่าที่คุณกำหนด
    const ADMIN_USER = 'admin99';
    const ADMIN_PASS = 'Aa0123456789';

    if (username === ADMIN_USER && password === ADMIN_PASS) {
        req.session.loggedIn = true;
        req.session.username = username;
        res.redirect('/admin.html');
    } else {
        res.status(401).send('<h2>ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง <a href="/admin.html">ลองอีกครั้ง</a></h2>');
    }
});

// API ออกจากระบบ
app.get('/admin/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/admin.html');
    });
});

// API บันทึกผลแบบประเมิน (ลูกค้า)
app.post('/admin/save_result', (req, res) => {
    const { name, score, level, description, date } = req.body;

    if (!name || typeof score === 'undefined' || !level) {
        return res.status(400).json({ error: 'ข้อมูลไม่ครบ' });
    }

    let data = [];
    if (fs.existsSync(DATA_FILE)) {
        try {
            const raw = fs.readFileSync(DATA_FILE, 'utf8');
            data = raw ? JSON.parse(raw) : [];
        } catch (e) {
            data = [];
        }
    }

    data.push({ name, score, level, description, date });
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        res.json({ message: 'บันทึกสำเร็จ' });
    } catch (err) {
        console.error('เขียนไฟล์ล้มเหลว', err);
        res.status(500).json({ error: 'บันทึกล้มเหลว' });
    }
});

// API ดึงข้อมูลผลประเมิน (ต้องล็อกอิน)
app.get('/admin/get_results', checkAuth, (req, res) => {
    if (!fs.existsSync(DATA_FILE)) {
        return res.json([]);
    }
    try {
        const raw = fs.readFileSync(DATA_FILE, 'utf8');
        const data = raw ? JSON.parse(raw) : [];
        res.json(data);
    } catch (err) {
        console.error('อ่านไฟล์ล้มเหลว', err);
        res.status(500).json({ error: 'อ่านข้อมูลล้มเหลว' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
