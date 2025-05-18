const { Pool } = require('pg');

const pool = new Pool({
    user: 'masud',
    host: 'localhost',
    database: 'postgres',
    password: 'new_password',
    port: 5432,
});

async function checkAndUpdateUser(userId) {
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
            await pool.query(
                'UPDATE users SET tries = $1, timestamp = NOW() WHERE user_id = $2',
                [tries - 1, userId]
            );
            return true;
        }

        return false;

    } catch (error) {
        console.error('Database error:', error);
        throw error;
    }
}

module.exports = { checkAndUpdateUser };
