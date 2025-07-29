/**
 * Returns an object with a single key ".env.frontend" containing
 * a prompt for news analysis. The prompt asks to select the most
 * relevant news for a frontend developer and group them based on the
 * tags they contain.
 * @param {number} max_news - The maximum number of news items to select.
 * @param {array} listFeeds - An array of objects containing information
 *   about the news such as title, content, priority, and RSS.
 * @returns {object} An object with a single key ".env.frontend" containing
 *   the prompt for news analysis.
 */
const getPromptChooseNews = (max_news, listFeeds) => {
    return ({
        ".env.frontend": `I will provide you with a list of news headlines. Your task is to analyze them and select the ${max_news} most relevant ones for a frontend developer.

   ✅ Give priority to headlines about:
  - UI frameworks and libraries: React, Next.js, Vue.js, Svelte, Angular, Ember.js, SolidJS, Qwik, Preact, Astro, Next.js, Nuxt, Remix, Lit, Alpine.js, etc.
  - Design/usability tools used in development: Figma, Framer, Storybook, etc.
  - Accessibility, responsive design, client-side performance, UX/UI
  - Frontend development patterns, SPA architectures, interface-related APIs
  - **Frontend-related events and conferences** (e.g. Figma Config, React Conf, Google I/O, Jamstack Conf)
  - Platforms and services for frontend deployment and development: Vercel, Netlify, AWS Amplify, Cloudflare Pages
  - Tools for managing frontend projects and monorepos: Turborepo, Nx, pnpm, Yarn, npm
  - AI **only if directly applied to frontend** (e.g. UI generation, code, prototypes)
  
  ❌ Deprioritize or ignore headlines about:
  - AI in a generic, ethical, or societal context
  - Basic frontend technologies like HTML, CSS, JavaScript
  - Privacy, media, society, tech marketing
  - Backend, DevOps, databases, infrastructure, or big data
  - Abstract opinions, viral news, scams, online drama, general newsletters

    Return only the top ${max_news} most relevant headlines, in order of relevance, **without numbering, comments, or explanations**, separated by \n

    Here are the headlines:
    ${listFeeds?.map(i => i.title).join("\n")}`
    })
}
module.exports = getPromptChooseNews;