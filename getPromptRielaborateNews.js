/**
 * Returns a JSON object with a prompt to rewrite a tech news item
 * in a format suitable for podcast narration. The description must be rewritten
 * to be appropriate for listening in a podcast, removing code and technical snippets,
 * while keeping references to tools, libraries, programming languages,
 * and technical concepts. Technical terms must not be translated into English
 * and should be briefly explained in a conversational way.
 * The tone must be professional, clear, and engaging, suitable
 * for vocal narration.
 * @param {object} json - The JSON object containing the tech news item
 * @returns {object} A JSON object with the modified description
 */
const getPromptRielaborateNews = (json) => {
    return ({
        ".env.frontend": `You are an editorial assistant for a tech news podcast. You will be provided with a JSON object containing two fields:

- "title": the title of the news item
- "description": a text description of the news item, which may include code, technical references, or examples.

Your task is to rewrite the content while maintaining the same JSON structure. The description must be rewritten to be suitable for podcast narration:

- Remove only code and technical snippets.
- Keep references to tools, libraries, programming languages, and technical concepts. Do not translate technical terms into English, and briefly explain them in a conversational way.
- Do not remove any information that is relevant to an audience interested in the frontend world.
- Keep the tone professional, clear, and engaging, suitable for vocal narration.

Return **only** the final JSON object with the modified description, without adding any other text or comments.

Here is the JSON: ${JSON.stringify(json)}`
    })
}

module.exports = getPromptRielaborateNews;
