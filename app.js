const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

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
      console.log(`Comments saved to ${filename}`);
      readAndSaveCommentsToTextFile(filepath);  // Updated function call
    } else {
      console.error(`yt-dlp exited with code ${code}`);
      cleanupTempFile(filepath);
    }
  });
}

function saveCommentsToTextFile(filepath, comments) {
  const textFileName = path.basename(filepath, '.json') + '.txt';
  const textFilePath = path.join(__dirname, textFileName);

  // Format the comments as plain text with numbered lines
  const commentTexts = comments.map((comment, index) => `${index + 1}: ${comment.text}`);

  fs.writeFile(textFilePath, commentTexts.join('\n'), (err) => {
    if (err) {
      console.error('Error saving comments to text file:', err);
    } else {
      console.log(`Comments saved to ${textFilePath}`);
    }
  });
}

function readAndSaveCommentsToTextFile(filepath) {
  fs.readFile(filepath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading file:', err);
      return cleanupTempFile(filepath);
    }

    let comments;
    try {
      comments = JSON.parse(data);
    } catch (parseErr) {
      console.error('Failed to parse JSON:', parseErr);
      console.error('Raw file content:', data); 
      return cleanupTempFile(filepath);
    }

    if (!Array.isArray(comments) || comments.length === 0) {
      console.log('No comments found — comments might be disabled on this video.');
      return cleanupTempFile(filepath);
    }

    saveCommentsToTextFile(filepath, comments);  // Save comments to text file instead of printing

    cleanupTempFile(filepath);
  });
}

function cleanupTempFile(filepath) {
  fs.unlink(filepath, (err) => {
    if (err) {
      console.error('Error deleting temp file:', err);
    }
  });
}

const userProvidedUrl = 'https://www.youtube.com/watch?v=xz2WfAcurGg&t=1s';
fetchComments(userProvidedUrl);

