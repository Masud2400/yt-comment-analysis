const fs = require('fs');
const { sendCommentsToGemini } = require('./sendCommentsToGemini');
const { cleanupTempFile } = require('./fileManagement');

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

module.exports = { readAndSendCommentsToGemini };
