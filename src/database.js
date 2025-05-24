const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_KEY,
    port: process.env.DB_PORT || 5432,
});

async function checkAndUpdateUser(userId, options = {}) {
    const checkOnly = options.checkOnly || false;
    try {
        const { rows } = await pool.query(
            'SELECT tries, timestamp FROM users WHERE user_id = $1',
            [userId]
        );

        const now = new Date();

        if (rows.length === 0) {
            await pool.query(
                'INSERT INTO users (user_id, tries, timestamp) VALUES ($1, 2, NOW())',
                [userId]
            );
            return true;
        }

        const { tries, timestamp } = rows[0];
        const hoursPassed = (now - new Date(timestamp)) / 3600000;

        if (hoursPassed >= 24) {
            await pool.query(
                'UPDATE users SET tries = 2, timestamp = NOW() WHERE user_id = $1',
                [userId]
            );
            return true;
        }

        if (tries > 0) {
            if (!checkOnly) {
                await pool.query(
                    'UPDATE users SET tries = $1 WHERE user_id = $2',
                    [tries - 1, userId]
                );
            }
            return true;
        }

        return false;

    } catch (error) {
        console.error('Database error:', error);
        throw error;
    }
}

module.exports = { checkAndUpdateUser };
