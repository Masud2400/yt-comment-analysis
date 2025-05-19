const fs = require('fs');
const { sendCommentsToGemini } = require('./sendCommentsToGemini');
const { cleanupTempFile } = require('./fileManagement');

async function readAndSendCommentsToGemini(filepath) {
  try {
    const data = fs.readFileSync(filepath, 'utf8');
    const comments = JSON.parse(data);
    if (!Array.isArray(comments) || comments.length === 0) {
      cleanupTempFile(filepath);
      return { noComments: true };
    }
    const analysis = await sendCommentsToGemini(comments);
    cleanupTempFile(filepath);
    return { analysis };
  } catch (err) {
    cleanupTempFile(filepath);
    return { error: true };
  }
}

module.exports = { readAndSendCommentsToGemini };
