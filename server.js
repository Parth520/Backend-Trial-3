require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/database');
const apiRoutes = require('./routes/api');
const scheduler = require('./services/scheduler');
const logger = require('./utils/logger');

// Create Express app
const app = express();

// Security
app.use(cors());
app.use(express.json());
app.use(helmet());

// Rate Limiting
const limiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 200,
});
app.use(limiter);

// Connect DB
connectDB();

// Routes
app.use('/api', apiRoutes);

// ✅ Health route for Railway
app.get('/', (req, res) => {
    res.send('✅ Job Alert Backend is running');
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    logger.info(`✅ Server running on port ${PORT}`);
    console.log(`🚀 Live at: http://localhost:${PORT}`);

    /**
     * ✅ IMPORTANT FIX:
     * Delay starting scraper + cron AFTER server is fully started.
     * This prevents Railway timeout and keeps full functionality.
     */
    setTimeout(() => {
        try {
            scheduler.startJobScraping();
            console.log("✅ Scraper & Email scheduler started after server boot");
        } catch (err) {
            console.error("⚠️ Scheduler failed:", err.message);
        }
    }, 8000);
});

// ✅ Prevent Railway crash on unhandled promise
process.on('unhandledRejection', (err) => {
    logger.error(`Unhandled Rejection: ${err.message}`);
});
