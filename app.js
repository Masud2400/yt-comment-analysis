require('dotenv').config();

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

// --- Fetch comments from YouTube ---
function fetchComments(url) {
  if (!/^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/.test(url)) {
    console.error('Invalid YouTube URL');
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

  ytDlp.on('close', (code) => {
    if (code === 0) {
      console.log(`✅ Comments saved temporarily to ${filename}`);
      readAndSendCommentsToGemini(filepath);
    } else {
      console.error(`❌ yt-dlp exited with code ${code}`);
      cleanupTempFile(filepath);
    }
  });
}

// --- Send parsed comments to Gemini API ---
async function sendCommentsToGemini(comments) {
  const apiKey = process.env.GEMINI_API_KEY;
  const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'; // Updated endpoint

  const prompt = comments
    .filter(c => c.text && typeof c.text === 'string') // skip empty or invalid
    .slice(0, 1000) // Limit to first 1000 comments to avoid token overload
    .map((c, i) => `${i + 1}. ${c.text}`)
    .join('\n');

  const payload = {
    contents: [
      {
        parts: [
          {
            text: `Analyze the sentiment and themes in the following YouTube comments. Provide the following insights: The percentage of positive, neutral, and negative comments. Rate the video from 1 to 10 based on the overall sentiment of the comments. Provide the top 5 positive comments and the top 5 negative comments based on sentiment. Categorize the comments into themes (e.g., content quality, presentation, pacing, etc.) and display one example comment from each category. Based on the analysis, provide insights into what aspects of the video to focus on or improve for future videos (e.g., improve pacing, clarify certain topics, etc.). Provide one summary conclusion or recommendation for improving the video:\n\n${prompt}`
          }
        ]
      }
    ]
  };

  try {
    const res = await fetch(`${endpoint}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await res.json();

    // Try to extract response content
    const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from Gemini';
    console.log('\n🔍 Gemini Analysis:\n');
    console.log(responseText);
  } catch (err) {
    console.error('❌ Error calling Gemini API:', err);
  }
}

// --- Read saved comments and send to Gemini ---
function readAndSendCommentsToGemini(filepath) {
  fs.readFile(filepath, 'utf8', async (err, data) => {
    if (err) {
      console.error('Error reading file:', err);
      return cleanupTempFile(filepath);
    }

    let comments;
    try {
      comments = JSON.parse(data);
    } catch (parseErr) {
      console.error('Failed to parse JSON:', parseErr);
      return cleanupTempFile(filepath);
    }

    if (!Array.isArray(comments) || comments.length === 0) {
      console.log('No comments found — they may be disabled.');
      return cleanupTempFile(filepath);
    }

    await sendCommentsToGemini(comments);
    cleanupTempFile(filepath);
  });
}

// --- Delete temp file after use ---
function cleanupTempFile(filepath) {
  fs.unlink(filepath, (err) => {
    if (err) {
      console.error('Error deleting temp file:', err);
    }
  });
}

// --- Run the process ---
const userProvidedUrl = 'https://www.youtube.com/watch?v=jvqVzH__p0A';
fetchComments(userProvidedUrl);





