require('dotenv').config();
const { fetchComments } = require('./src/fetchComments');
const { waitForMessageFromUser } = require('./src/bot');

async function main() {
    console.log('🤖 Bot is listening for YouTube URLs in DMs...');

    while (true) {
        try {
            // Now receives { url, userId }
            const { url, userId } = await waitForMessageFromUser();
            console.log(`✅ Received URL from user ${userId}:`, url);

            // Use the url for fetching comments (modify fetchComments if needed)
            fetchComments(url);
        } catch (err) {
            console.error('❌ Error while handling message:', err);
        }
    }
}

main();

