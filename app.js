require('dotenv').config();
const { fetchComments } = require('./src/fetchComments');

// Example YouTube URL
const userProvidedUrl = 'https://www.youtube.com/watch?v=jvqVzH__p0A';
fetchComments(userProvidedUrl);
