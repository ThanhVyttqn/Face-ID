const express = require('express');
const cors = require('cors');
const app = express();

const authRoutes = require('./routes/Auth_Router');
const giangVienRoutes = require('./routes/GiangVien_Router');
const adminRoutes = require('./routes/Admin_Router');
const assistantRoutes = require('./routes/Assistant_Router');

app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/giang-vien', giangVienRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/assistant', assistantRoutes);

app.get('/', (req, res) => {
    return res.json({
        success: true,
        message: 'Student Attendance API is running',
    });
});

module.exports = app;
