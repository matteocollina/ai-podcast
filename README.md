# 🎙️ AI Podcast

**AI Podcast** is a Node.js-based automation tool that lets you create and publish a podcast powered by AI — from sourcing the news to rewriting the content, generating voice narration, and uploading to a podcast hosting platform.

You choose the news sources. The system handles the rest.

![AI-PODCAST](https://github.com/matteocollina/ai-podcast/blob/main/documentation.png?raw=true)


---

## 🚀 Features

- **Fetch news from your favorite websites**  
  Supports RSS feeds or custom integrations.

- **Rewrite text using OpenAI**  
  Converts raw headlines and content into smooth, engaging spoken-language text — ideal for audio narration.

- **Generate audio with ElevenLabs**  
  Uses ElevenLabs TTS to create realistic voice output for each episode.

- **Publish to Buzzsprout**  
  Uploads the audio file and metadata automatically to your Buzzsprout account.

---

## 📦 Example `package.json` Scripts

- `do:frontend` – Generates episode text using OpenAI  
- `gen-audio:frontend` – Generates audio using ElevenLabs  
- `upload:frontend` – Uploads the episode to Buzzsprout  

> You can configure different podcast contexts using `.env` files (e.g., `.env.frontend`, `.env.calcio-ita`, etc.).

---

## 🧠 Powered By

- **OpenAI** – for rewriting news content into natural, podcast-ready scripts  
- **ElevenLabs** – for realistic voice generation  
- **Buzzsprout** – for publishing the final audio episode

---

## 🛠️ Setup

1. Clone the repository.
2. Create one or more `.env` files (e.g., `.env.frontend`) with your settings and API keys.
3. Install the dependencies with:

npm install

4. Run the scripts depending on what you want to do:

- `npm run do:frontend` – Generate the podcast text  
- `npm run gen-audio:frontend` – Generate the audio using ElevenLabs  
- `npm run upload:frontend` – Upload the audio to Buzzsprout

---

## 📄 License

ISC License

---

## 👤 Author

*Matteo Collina* – collinamatteo@gmail.com

---

## 💡 Notes

This tool is ideal for:

- Creating news podcasts  
- Automating solo podcast production  
- Building AI-powered content pipelines
