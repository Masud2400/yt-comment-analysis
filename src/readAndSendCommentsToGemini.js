const fs = require('fs');
const { sendCommentsToGemini } = require('./sendCommentsToGemini');
const { cleanupTempFile } = require('./fileManagement');

async function readAndSendCommentsToGemini(filepath) {
  try {
    const data = fs.readFileSync(filepath, 'utf8');
    const comments = JSON.parse(data);
    const analysis = await sendCommentsToGemini(comments);
    cleanupTempFile(filepath);
    return analysis; // <-- Return the analysis
  } catch (err) {
    cleanupTempFile(filepath);
    return '❌ Failed to read or analyze comments.';
  }
}

module.exports = { readAndSendCommentsToGemini };
