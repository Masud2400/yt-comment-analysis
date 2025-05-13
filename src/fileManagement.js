const fs = require('fs');

function cleanupTempFile(filepath) {
  fs.unlink(filepath, (err) => {
    if (err) {
      console.error('Error deleting temp file:', err);
    }
  });
}

module.exports = { cleanupTempFile };
