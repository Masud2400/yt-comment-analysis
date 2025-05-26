const { spawn } = require('child_process');
const { sendCommentsToGemini } = require('./sendCommentsToGemini');
const { youtubeUrlRegex } = require('./utils'); // <-- Import the shared regex

function fetchComments(url) {
  return new Promise((resolve) => {
    if (!youtubeUrlRegex.test(url)) { // <-- Use the shared regex
      console.error('Invalid YouTube URL');
      resolve({ error: '❌ Invalid YouTube URL.' });
      return;
    }

    let outputData = '';

    const ytDlp = spawn('yt-dlp', [
      '--get-comments',
      '--no-download',
      '--print', '%(comments)j',
      url,
    ]);

    ytDlp.stdout.on('data', (data) => {
      outputData += data.toString();
    });

    ytDlp.stderr.on('data', (data) => {
      // console.error(`stderr: ${data}`);
    });

    ytDlp.on('close', async (code) => {
      if (code === 0) {
        try {
          // Split output by lines and parse each as JSON
          const lines = outputData.split('\n').filter(Boolean);
          let comments = [];
          for (const line of lines) {
            try {
              const parsed = JSON.parse(line);
              if (Array.isArray(parsed)) {
                comments = comments.concat(parsed);
              }
            } catch (e) {
              // Ignore lines that are not valid JSON
            }
          }
          if (comments.length === 0) {
            resolve({ noComments: true });
            return;
          }
          const analysis = await sendCommentsToGemini(comments);
          resolve({ analysis });
        } catch (err) {
          resolve({ error: true });
        }
      } else {
        console.error(`❌ yt-dlp exited with code ${code}`);
        resolve({ error: '❌ Failed to fetch comments.' });
      }
    });
  });
}

module.exports = { fetchComments };
