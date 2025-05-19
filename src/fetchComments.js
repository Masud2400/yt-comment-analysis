const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const { readAndSendCommentsToGemini } = require('./readAndSendCommentsToGemini');
const { cleanupTempFile } = require('./fileManagement');

function fetchComments(url) {
  return new Promise((resolve) => {
    if (!/^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/.test(url)) {
      console.error('Invalid YouTube URL');
      resolve({ error: '❌ Invalid YouTube URL.' });
      return;
    }

    const id = randomUUID();
    const filename = `comments_${id}.json`;
    const filepath = path.join(__dirname, filename);
    const output = fs.createWriteStream(filepath);

    const ytDlp = spawn('yt-dlp', [
      '--get-comments',
      '--no-download',
      '--print', '%(comments)j',
      url,
    ]);

    ytDlp.stdout.pipe(output);

    ytDlp.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });

    ytDlp.on('close', async (code) => {
      if (code === 0) {
        console.log(`✅ Comments saved temporarily to ${filename}`);
        const result = await readAndSendCommentsToGemini(filepath);
        resolve(result); // <-- Return object
      } else {
        console.error(`❌ yt-dlp exited with code ${code}`);
        cleanupTempFile(filepath);
        resolve({ error: '❌ Failed to fetch comments.' });
      }
    });
  });
}

module.exports = { fetchComments };
