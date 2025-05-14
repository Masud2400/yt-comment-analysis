const { Client, GatewayIntentBits } = require('discord.js');

// Initialize the bot client
const client = new Client({ 
    intents: [
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent,
    ],
});

// Variable to store the user's message
let resolveMessage;

// When the bot is ready
client.once('ready', () => {
    console.log('Bot is online!');
});

// When the bot receives a message
client.on('messageCreate', (message) => {
    // Make sure the bot doesn't reply to itself
    if (message.author.bot) return;

    // Resolve the message
    if (resolveMessage) {
        resolveMessage(message.content);
    }

    message.reply('I received your Youtube url!');
});

// Log the bot in using the token
client.login(process.env.DISCORDJS_API_KEY);

// Function to wait for a message
function waitForMessage() {
    return new Promise((resolve) => {
        resolveMessage = resolve;
    });
}

module.exports = { waitForMessage };


