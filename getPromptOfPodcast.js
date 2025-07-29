/**
 * Returns an object with a single key ".env.frontend" containing
 * a prompt for generating a podcast episode with OpenAI.
 * @param {string} podcastName - The name of the podcast.
 * @param {string} podcasterName - The name of the podcaster.
 * @param {array} prompts - An array of strings with the text of the news
 *   to be included in the podcast, one for each news item.
 * @returns {object} An object with a single key ".env.frontend" containing
 *   the prompt for generating the podcast episode.
 */
const getPromptOfPodcast = (podcastName, podcasterName, prompts) => {
  return ({
    ".env.frontend": `You are writing the **full** script of an episode of the podcast called ${podcastName}. It's a conversational podcast about the latest news in the world of frontend development, aimed at experienced developers, as if you were one of them.

Write a script to be read by ${podcasterName}, from Cesena. The tone must be natural, direct, and conversational: no announcer style, no radio formulas, no unnecessary introductions. Speak as if you're chatting with colleagues during a coffee break. Simply begin with “Hi, I'm ${podcasterName}” or a natural Italian variation. Do not mention the episode number.

Each news item must be clearly explained, including all technical details. If there is code, describe and explain it in spoken language. If there are complex concepts, clarify them naturally but without oversimplifying.

Always use the present tense, except when referring to scheduled future events (like conferences, roadmaps, releases).

Do not introduce news items with phrases like “now let's talk about”, “in this news item we’ll see”, “we’ll discover that...”. Go straight to the content.

At the end of each news item, wrap it up with a natural sentence, then move to the next with a smooth transition or a direct topic change—no cold lists or recurring formulas.

At the end of the last item, close the episode with a short thank-you and goodbye. Briefly encourage listeners to catch the next episodes. No formal calls to action, no requests to subscribe, leave reviews, etc.

Essential rules:
- The text will be read by a synthetic voice: DO NOT use symbols, markdown, titles, parentheses, asterisks, or descriptions of sounds.
- DO NOT include music, pauses, sound effects, or any non-spoken elements.

Here are the news items to cover:

${prompts.join('\n\n')}`
  })
}

module.exports = getPromptOfPodcast;