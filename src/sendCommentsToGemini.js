async function sendCommentsToGemini(comments) {
  const apiKey = process.env.GEMINI_API_KEY;
  const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'; 

  const prompt = comments
    .filter(c => c.text && typeof c.text === 'string')
    .slice(0, 10000)
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

    const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from Gemini';
    return responseText; // <-- Return the analysis
  } catch (err) {
    console.error('❌ Error calling Gemini API:', err);
    return '❌ Error calling Gemini API.';
  }
}

module.exports = { sendCommentsToGemini };
