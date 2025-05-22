require('dotenv').config();
const { fetchComments } = require('./src/fetchComments');
const { waitForMessageFromUser } = require('./src/bot');

async function main() {
    console.log('🤖 Bot is listening for YouTube URLs in DMs...');

    while (true) {
        try {
            const { url } = await waitForMessageFromUser();
            
            fetchComments(url);
            
        } catch (err) {
            console.error('❌ Error while handling message:', err);
        }
    }
}

main();

