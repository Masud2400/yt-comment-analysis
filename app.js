require('dotenv').config();
const { fetchComments } = require('./src/fetchComments');
const { waitForMessage } = require('./src/bot.js');

// Main function to run the bot and fetch comments
async function main() {
    // Wait for the bot to receive a message
    const userMessage = await waitForMessage();

    // YouTube URL from the user's message
    const userProvidedUrl = userMessage;

    // Fetch comments based on the URL
    fetchComments(userProvidedUrl);
}

// Start the bot and run the main function
main();

