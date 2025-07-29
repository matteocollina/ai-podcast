const axios = require('axios');
const fs = require('fs');
require('dotenv').config({ path: process.env.ENV_NAME });
const moment = require('moment');
const OpenAI = require('openai');
const FormData = require('form-data');
const qs = require('qs');
const path = require('path');
const mime = require('mime-types');
const { exit } = require('process');
const getPromptChooseNews = require('./getPromptChooseNews');
const getTitleDescriptionOfNews = require('./getTitleDescriptionOfNews');
const getPromptOfPodcast = require('./getPromptOfPodcast');
const getPromptRielaborateNews = require('./getPromptRielaborateNews');

const canUploadFile = process.env.CAN_UPLOAD=="true";

const today = new Date().toISOString().split('T')[0]; // formato YYYY-MM-DD
const todayStr = moment().format('YYYY-MM-DD');

const PODCASTER_NAME = process.env.PODCASTER_NAME;
const PODCAST_NAME = process.env.PODCAST_NAME;
const MAX_NEWS_COUNT = process.env.MAX_NEWS_COUNT || 3;

console.log("=== Configurazione ambiente ===");
console.log(`✔️  Upload abilitato: ${canUploadFile}`);
console.log(`🎙️  Podcaster: ${PODCASTER_NAME}`);
console.log(`🎧 Nome podcast: ${PODCAST_NAME}`);
console.log(`📰 Numero massimo di notizie: ${MAX_NEWS_COUNT}`);
console.log(`♾️​ Recupero news di ${process.env.DAYS_AGO_TO_FETCH_NEWS} giorno/i fa`);
console.log("================================");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, '');
}

function isXDaysAgo(dateString) {
  const itemDate = moment(dateString);
  return itemDate.isSame(moment().subtract(Number(process.env.DAYS_AGO_TO_FETCH_NEWS ?? 0), 'days'), 'day');
}

function tryFixTruncatedJSON(input) {
  // console.log("tryFixTruncatedJSON: ", input)
  const openBrackets = (input.match(/\[/g) || []).length;
  const closeBrackets = (input.match(/\]/g) || []).length;

  const bracketDiff = openBrackets - closeBrackets;

  let fixed = input.trim();

  // Prova a chiudere array e oggetti
  if (bracketDiff > 0) {
    fixed += ']'.repeat(bracketDiff);
  }

  // Rimuove eventuali trailing virgole
  fixed = fixed.replace(/,\s*([\]}])/g, '$1');

  try {
    return JSON.parse(fixed);
  } catch (e) {
    console.error("Errore nel parsing JSON:", e);
    return null;
  }
}


// 1. Recupera le ultime 3 notizie tech
async function fetchNews() {
  const feedUrls = process.env.PODCAST_RSS.split(",");

  const Parser = require('rss-parser');
  const parser = new Parser();

  const newsItems = [];
  const feedTodayItems = {}; // Salviamo qui le notizie di ieri per ogni feed

  for (const [indexUrl, url] of feedUrls.entries()) {
    try {
      const feed = await parser.parseURL(url);

      const todaysItems = feed.items
        .filter(item => item.pubDate && isXDaysAgo(item.pubDate))
        .map(item => {
          return ({ ...item, priority: indexUrl, url: url });
        });

      feedTodayItems[url] = todaysItems; // salviamo tutte le notizie di x giorni fa per ogni feed
    } catch (err) {
      console.error(`Errore nel feed ${url}:`, err.message);
    }
  }

  const listFeeds = Object.values(feedTodayItems).flat();
  if (!listFeeds.length) {
    console.log(`Nessun feed trovato, non si procede con la generazione del podcast...`)
    exit(0)
  }
  console.log(`\nLista news trovate:\n${listFeeds?.map(f => f?.link).join('\n')}`);


  const prompt = getPromptChooseNews(MAX_NEWS_COUNT, listFeeds)[process.env.ENV_NAME]
  console.log("\n👨‍🔬 Scelta titoli news tramite OpenAI...");
  const response = await openai.responses.create({
    model: 'gpt-4',
    instructions: process.env.PODCASTER_INSTRUCTION_CHOOSE_NEWS,
    input: prompt,
  });
  const chooseNewsText = response.output_text?.split("\n").filter(n => !!n);
  console.log(`Titoli scelti:\n-${chooseNewsText?.join("\n-")}`)

  for (const item of Object.values(feedTodayItems).flat()) {
    const itemTitle = item.title.toLowerCase();

    if (chooseNewsText.some(t => {
      const chosenTitle = t.toLowerCase();
      return !!itemTitle && !!chooseNewsText && (itemTitle.includes(chosenTitle) || chosenTitle.includes(itemTitle));
    })) {
      newsItems.push(item);
    }
  }

  // Rielaboro la descrizione di ciascuna news
  let cleanNewsItems = [];
  for (const item of newsItems) {
    const description = getDescriptionFromPodcastItemRss(item);
    cleanNewsItems.push({ title: item.title, description });
  }
  if(!cleanNewsItems || !cleanNewsItems?.length){
    throw new Error("Nessuno dei titoli forniti è rilevante per uno sviluppatore frontend.")
  }

  /**
   * Ne gestisco una alla volta per evitare problemi di windows size exceeded
   */
  let elaboratedCleanedNewsItems = [];
  for (const cleanNewsItem of cleanNewsItems) {
    const promptRielaborate = getPromptRielaborateNews([cleanNewsItem])[process.env.ENV_NAME]
    console.log(`\n✍️ Rielaborazione new ${cleanNewsItem.title} tramite OpenAI ...`);
    const responseElaborateEachNews = await openai.responses.create({
      model: 'gpt-4',
      instructions: process.env.PODCASTER_INSTRUCTION_ELABORATE_NEWS,
      input: promptRielaborate,
    });
    elaboratedCleanedNewsItems = elaboratedCleanedNewsItems.concat(tryFixTruncatedJSON(responseElaborateEachNews.output_text));
  }
  cleanNewsItems = elaboratedCleanedNewsItems;

  // Tutte le Notizie Disponibili
  fs.writeFileSync(`output/all-titles-${todayStr}.txt`, JSON.stringify(listFeeds?.map(l => l.link), null, 2), 'utf-8');
  // Tutte le Notizie Selezionate per oggi rialaborate
  if(!cleanNewsItems){
    throw new Error("Non è stato possibile rielaborare le notizie: potrebbe non esserci nessuna notizia interessante")
  }
  fs.writeFileSync(`output/news-${todayStr}.json`, JSON.stringify(cleanNewsItems), 'utf-8');
  return cleanNewsItems.slice(0, MAX_NEWS_COUNT);
}

function getDescriptionFromPodcastItemRss(item) {
  const description = item?.["content:encodedSnippet"] || item.contentSnippet || item.content || stripHtml(item?.["content:encoded"]);
  return description?.replace(/\n/g, '').replace(/<[^>]*>/g, '').replace( // Remove SVG background
    /(background(?:-image)?\s*:\s*)url\((["'])data:image\/svg\+xml[^)]*\2\);?/gi,
    ''
  ).
    replace( // Remove FormKit styles
      /\.formkit-[^{,]*[^{}]*\{[^{}]*\}/gmi,
      ''
    )
    .replace(/\s+/g, ' ')
    // Rimuove tutte le righe che contengono imageUrl o listingImageUrl
    .replace(/imageUrl:\s*'[^']*',?\s*/g, '');
}

// 2.1 Restituisci titolo e descrizione del podcast
async function getTitleAndDescription(podcastText) {
  const prompt = getTitleDescriptionOfNews(podcastText)[process.env.ENV_NAME];
  const response = await openai.responses.create({
    model: 'gpt-3.5-turbo',
    instructions: process.env.PODCASTER_INSTRUCTION_ELABORATE_PODCAST_META,
    input: prompt,
  });
  const podcastMeta = response.output_text;
  fs.writeFileSync(`output/podcast-meta-${today}.json`, podcastMeta, 'utf-8');

  return podcastMeta;
}


// 2. Rielabora e traduci in italiano in formato podcast
async function rewriteAndTranslate(newsItems) {
  const prompts = newsItems.map(item => `Titolo: ${item.title}\nContenuto: ${item.description}\n`);
  const prompt = getPromptOfPodcast(PODCAST_NAME, PODCASTER_NAME, prompts)[process.env.ENV_NAME];

  const response = await openai.responses.create({
    model: 'gpt-4',
    instructions: process.env.PODCASTER_INSTRUCTION_ELABORATE_PODCAST_TTS,
    temperature: 0.8,
    input: prompt,
  });
  const podcastText = response.output_text;
  fs.writeFileSync(`output/podcast-${today}.txt`, podcastText, 'utf-8');
  fs.writeFileSync(`output/prompt-podcast-${today}.txt`, prompt, 'utf-8');

  return podcastText;
}

/**
 * 3. Sintetizza con ElevenLabs
 * https://elevenlabs.io/docs/api-reference/text-to-speech/convert
 */
async function generateSpeech(text, filename = `podcast-${today}.mp3`) {
  const response = await axios.post(
    `https://api.elevenlabs.io/v1/text-to-speech/${process.env.VOICE_ID}`,
    {
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        use_speaker_boost: true,
        stability: 0.78,
        similarity_boost: 0.95
      }
    },
    {
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY,
        "Content-Type": "application/json"
      },
      responseType: 'stream'
    }
  );

  const writer = fs.createWriteStream(`output/${filename}`);
  response.data.pipe(writer);
  return new Promise((resolve) => writer.on('finish', resolve));
}


async function getAccessTokenPodbean() {
  const response = await axios.post('https://api.podbean.com/v1/oauth/token', qs.stringify({
    grant_type: 'client_credentials',
  }), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${process.env.PODBEAN_CLIENT_ID}:${process.env.PODBEAN_CLIENT_SECRET}`).toString('base64')}`,
    },
  });

  return response.data.access_token;
}
// Step 2: Upload file
async function uploadFileBuzzSprout(filePath, meta) {
  const form = new FormData();
  form.append('audio_file', fs.createReadStream(filePath));
  form.append('title', meta.title);
  form.append('description', meta.description);

  try {
    const response = await axios.post(
      `https://www.buzzsprout.com/api/${process.env.BUZZSPROUT_PODCAST_ID}/episodes.json`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: `Token token=${process.env.BUZZSPROUT_API_KEY}`
        }
      }
    );
    console.log('Episodio caricato:', response.data);
  } catch (err) {
    console.error('Errore durante l’upload:', err.response?.data || err.message);
  }
}

async function getPodcastTextOfToday() {
  try {
    return fs.readFileSync(`output/podcast-${today}.txt`, 'utf8')
  } catch (error) {
    return null;
  }
}

async function getPodcasMetaOfToday() {
  try {
    const meta = fs.readFileSync(`output/podcast-meta-${today}.json`, 'utf8')
    return JSON.parse(meta?.replace(/^```json\s*|\s*```$/g, ''));
  } catch (error) {
    return null;
  }
}

async function getPodcastMp3OfToday() {
  try {
    return fs.readFileSync(`output/podcast-${today}.mp3`)
  } catch (error) {
    return null;
  }
}

// Main execution
(async () => {
  try {
    let podcastText = await getPodcastTextOfToday();
    let podcastMeta = await getPodcasMetaOfToday();
    if (!podcastText) {
      console.log('📡 Recupero notizie...');
      const newsItems = await fetchNews();

      console.log('🧠 Rielaborazione tramite OpenAI...');
      podcastText = await rewriteAndTranslate(newsItems);
    }
    if(!podcastMeta){
      console.log('📽️ Ottenendo titolo e descrizione...');
      podcastMeta = await getTitleAndDescription(podcastText);
    }
    if(!await getPodcastMp3OfToday() && !!process.env.CAN_GEN_AUDIO){
      console.log('🗣️ Generazione voce con ElevenLabs...');
      await generateSpeech(podcastText);
      console.log('✅ Podcast creato con successo: podcast.mp3');
    }

    if(canUploadFile){
      const mp3Path = path.join(__dirname, `output/podcast-${today}.mp3`);
      const result = await uploadFileBuzzSprout(mp3Path, podcastMeta);
      console.log('Upload success:', result);
    }


  } catch (error) {
    console.log(error?.message)
    console.error('Errore:', error.message);
  }
})();
