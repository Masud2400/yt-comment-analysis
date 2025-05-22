const { Client, GatewayIntentBits, Partials, ChannelType } = require('discord.js');
const { fetchComments } = require('./fetchComments');
const { checkAndUpdateUser } = require('./database'); // Add this import

const client = new Client({
    intents: [
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Channel],
});

const youtubeUrlRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;

const userQueues = new Map(); // Map<userId, Array of messages>
const userProcessing = new Set(); // Set of userIds currently being processed

let botStarted = false;

// Start the bot and attach listeners only once
function startBot() {
    if (botStarted) return;
    botStarted = true;

    client.once('ready', () => {
        console.log('✅ Discord bot is online!');
    });

    client.on('messageCreate', async (message) => {
        if (message.author.bot || message.channel.type !== ChannelType.DM) return;

        if (!youtubeUrlRegex.test(message.content)) {
            await message.reply('❌ Please send a valid YouTube URL.');
            return;
        }

        const userId = message.author.id;

        // Add message to this user's queue
        if (!userQueues.has(userId)) {
            userQueues.set(userId, []);
        }
        userQueues.get(userId).push(message);

        await message.reply('🎬 URL received! Added to your queue.');

        // If not already processing this user's queue, start now
        if (!userProcessing.has(userId)) {
            processUserQueue(userId);
        }
    });

    client.login(process.env.DISCORDJS_API_KEY).catch((err) => {
        console.error('❌ Bot login failed:', err);
    });
}

// Process one user’s queue sequentially
async function processUserQueue(userId) {
    userProcessing.add(userId);

    const queue = userQueues.get(userId);
    if (!queue) {
        userProcessing.delete(userId);
        return;
    }

    while (queue.length > 0) {
        const message = queue.shift();
        const url = message.content;

        try {
            await message.channel.send(`🔄 Processing your URL: ${url}`);

            // 1. Check if user has tries left (but do NOT decrement yet)
            const allowed = await checkAndUpdateUser(userId, { checkOnly: true });
            if (!allowed) {
                await message.channel.send('❌ You have used all your tries. Please wait 24 hours for a reset.');
                continue;
            }

            // 2. Fetch comments and send to Gemini
            const result = await fetchComments(url);

            if (result.noComments) {
                await message.channel.send('❌ No comments were found.');
                continue;
            }
            if (result.error) {
                await message.channel.send(result.error);
                continue;
            }

            // 3. Send the analysis to the user
            const analysis = result.analysis;
            if (analysis.length > 2000) {
                for (let i = 0; i < analysis.length; i += 2000) {
                    await message.channel.send(analysis.slice(i, i + 2000));
                }
            } else {
                await message.channel.send(analysis);
            }

            await message.channel.send(`✅ Done processing your URL: ${url}`);

            // 4. Now decrement tries (call checkAndUpdateUser without checkOnly)
            await checkAndUpdateUser(userId);

            if (typeof onProcessedMessage === 'function') {
                onProcessedMessage(url, userId);
            }

        } catch (error) {
            console.error(`❌ Error processing URL for user ${userId}:`, error);
            await message.channel.send(`❌ Failed to process your URL: ${url}`);
        }
    }

    userProcessing.delete(userId);
    userQueues.delete(userId);
}

// ---
// Now for your interface: waitForMessageFromUser will resolve the *next processed message from any user*
// We'll keep a simple FIFO queue of processed URLs that your app.js can consume

const processedMessages = [];
let resolveNextProcessed = null;

// Called inside processUserQueue after each message processed
function onProcessedMessage(url, userId) {
    processedMessages.push({ url, userId });
    if (resolveNextProcessed) {
        resolveNextProcessed(processedMessages.shift());
        resolveNextProcessed = null;
    }
}

// Exported function your app.js calls
function waitForMessageFromUser() {
    startBot();
    return new Promise((resolve) => {
        if (processedMessages.length > 0) {
            // If messages are ready, resolve immediately
            resolve(processedMessages.shift());
        } else {
            resolveNextProcessed = resolve;
        }
    });
}

module.exports = {
    waitForMessageFromUser,
};
