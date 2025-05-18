const { Pool } = require('pg');
const pool = new Pool({
    user: 'masud',
    host: 'localhost',
    database: 'postgres',
    password: 'new_password',
    port: 5432,
});

// Check and update user tries logic
async function checkAndUpdateUser(userId) {
    const client = await pool.connect();
    try {
        // Check if user exists
        const res = await client.query('SELECT tries, timestamp FROM users WHERE user_id = $1', [userId]);
        if (res.rows.length === 0) {
            // User does not exist, insert with 3 tries
            await client.query(
                'INSERT INTO users (user_id, tries, timestamp) VALUES ($1, $2, NOW())',
                [userId, 3]
            );
            return true;
        } else {
            const { tries, timestamp } = res.rows[0];
            const now = new Date();
            const lastTimestamp = new Date(timestamp);
            const hoursPassed = (now - lastTimestamp) / (1000 * 60 * 60);

            if (tries > 0) {
                return true;
            } else {
                if (hoursPassed >= 24) {
                    // Reset tries and update timestamp
                    await client.query(
                        'UPDATE users SET tries = 3, timestamp = NOW() WHERE user_id = $1',
                        [userId]
                    );
                    return true;
                } else {
                    return false;
                }
            }
        }
    } finally {
        client.release();
    }
}

module.exports = { checkAndUpdateUser };