require('dotenv').config();
const { waitForMessageFromUser } = require('./src/bot');

async function main() {
    console.log('🤖 Bot is listening for YouTube URLs in DMs...');

    while (true) {
        try {
            const { url } = await waitForMessageFromUser();
            // You can add custom logic here if you want to do something with the processed message.
        } catch (err) {
            console.error('❌ Error while handling message:', err);
        }
    }
}

main();

