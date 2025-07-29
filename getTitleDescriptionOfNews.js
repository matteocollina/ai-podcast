/**
 * Generates a JSON object with a title and a short description
 * for a podcast episode, by analyzing the provided transcript text.
 * @param {string} podcastText - The transcript text of the episode
 * @returns {object} A JSON object with the keys "title" and "description"
 */
const getTitleDescriptionOfNews = (podcastText) => {
  return ({
      ".env.frontend": `You have the transcript of a podcast episode. Analyze the text and return a JSON object with:

  "title": a concise and engaging title (maximum 15 words) that summarizes the main topic of the episode.

  "description": a short description (maximum 4000 characters) that highlights the topics discussed, keeping an informal tone.

  Return only one JSON object as output, in the following format:
  {
    "title": "Generated title here",
    "description": "Generated description here"
  }
    
  Here is the transcript: ${podcastText}`,

      ".env.calcio-ita": `You have the transcript of a podcast episode. Analyze the text and return a JSON object with:

  "title": a concise and engaging title (maximum 15 words) that summarizes the main topic of the episode, in a sporty and punchy style.

  "description": a short description (maximum 4000 characters) that highlights the topics discussed, such as matches, transfer news, injuries, controversies, tactics, or statements. The tone should be informal, direct, and engaging, suitable for an audience of Serie A fans.

  Return only one JSON object as output, in the following format:
  {
    "title": "Generated title here",
    "description": "Generated description here"
  }

  Here is the transcript: ${podcastText}
  `
  })
}

module.exports = getTitleDescriptionOfNews;
