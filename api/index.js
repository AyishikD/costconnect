require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Request Logging Middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// DB Connection Middleware
let isConnected = false;
async function connectDB() {
    if (isConnected) {
        console.log('Using existing MongoDB connection');
        return;
    }

    if (!process.env.MONGODB_URI) {
        console.error('CRITICAL: MONGODB_URI is not defined in environment variables');
        return;
    }

    try {
        const maskedUri = process.env.MONGODB_URI.replace(/\/\/.*@/, '//****:****@');
        console.log(`Attempting to connect to MongoDB: ${maskedUri}`);

        await mongoose.connect(process.env.MONGODB_URI);
        isConnected = true;
        console.log('SUCCESS: Connected to MongoDB Atlas');
    } catch (err) {
        console.error('ERROR connecting to MongoDB:', err.message);
        console.error('Full connection error:', err);
    }
}

app.use(async (req, res, next) => {
    await connectDB();
    next();
});

// Routes
const expenseRoutes = require('./routes/expenses');
app.use('/api/expenses', expenseRoutes);

app.get('/api/health', (req, res) => {
    res.json({ ok: true });
});

module.exports = app;

if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 5001;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}
