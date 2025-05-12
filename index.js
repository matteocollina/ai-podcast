const axios = require('axios');
const fs = require('fs');
require('dotenv').config();
const OpenAI = require('openai');
const today = new Date().toISOString().split('T')[0]; // formato YYYY-MM-DD

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// 1. Recupera le ultime 3 notizie tech
async function fetchNews() {
  const feedUrls = [
    'https://www.smashingmagazine.com/feed/',
    'https://css-tricks.com/feed/',
    'https://blog.logrocket.com/feed/'
  ];

  const Parser = require('rss-parser');
  const parser = new Parser();

  const newsItems = [];
  for (let url of feedUrls) {
    try {
      const feed = await parser.parseURL(url);
      const latestItem = feed.items[0]; // solo l'ultima notizia (la prima nel feed)
      if (latestItem) {
        newsItems.push(latestItem);
      }
    } catch (err) {
      console.error(`Errore nel feed ${url}:`, err.message);
    }
  }
  return newsItems;
}

// 2. Rielabora e traduci in italiano in formato podcast
async function rewriteAndTranslate(newsItems) {
  const prompts = newsItems.map(item => `Titolo: ${item.title}\nContenuto: ${item.contentSnippet || item.content}\n`);

  const prompt = `Ti fornirò una serie di notizie legate allo sviluppo frontend, ognuna con un titolo e del contenuto. Per ciascuna notizia, voglio che tu:

  1. Mantenga tutti i dettagli tecnici e informativi presenti.
  2. Espanda il contenuto in modo esaustivo, come se stessi leggendo la notizia in un podcast tecnico per sviluppatori.
  3. Non interpreti né aggiunga nulla che non sia chiaramente espresso nella fonte.
  4. Scriva il testo interamente in italiano corretto, con tono professionale, fluido e completo. Mantieni i termini tecnici in inglese (come "design tokens", "RTL layout", "Figma variables", ecc.), senza cercare di tradurli, a meno che non esista una traduzione consolidata nel settore.
  5. Concluda ogni notizia prima di passare alla successiva.
  
  Ecco le notizie:\n\n${prompts.join('\n\n')}`;
  

  const response = await openai.responses.create({
    model: 'gpt-3.5-turbo',
    instructions: 'Sei un podcaster tech italiano, scrivi una notizia tech come se fosse letta in un podcast.',
    input: prompt,
  });
  const podcastText = response.output_text;
  fs.writeFileSync(`podcast-${today}.txt`, podcastText, 'utf-8');

  return podcastText;
}

// 3. Sintetizza con ElevenLabs
async function generateSpeech(text, filename = `podcast-${today}.mp3`) {
  const response = await axios.post(
    `https://api.elevenlabs.io/v1/text-to-speech/${process.env.VOICE_ID}`,
    {
      text,
      model_id: "eleven_multilingual_v2",
    //   voice_settings: {
    //     stability: 0.5,
    //     similarity_boost: 0.75
    //   }
    },
    {
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY,
        "Content-Type": "application/json"
      },
      responseType: 'stream'
    }
  );

  const writer = fs.createWriteStream(filename);
  response.data.pipe(writer);
  return new Promise((resolve) => writer.on('finish', resolve));
}

// Main execution
(async () => {
  try {
    console.log('📡 Recupero notizie...');
    const newsItems = await fetchNews();

    console.log('🧠 Rielaborazione tramite OpenAI...');
    const podcastText = await rewriteAndTranslate(newsItems);

    console.log('🗣️ Generazione voce con ElevenLabs...');
    await generateSpeech(podcastText);

    console.log('✅ Podcast creato con successo: podcast.mp3');
  } catch (error) {
    console.error('Errore:', error.message);
  }
})();
