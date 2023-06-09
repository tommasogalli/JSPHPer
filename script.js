const chatForm = document.getElementById('chat-form');
const chatbox = document.getElementById('chatbox');
const userInput = document.getElementById('user-input');

const textFileUrls = [
    'context/example.txt',
];

let conversationHistory = [];

chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const message = userInput.value.trim();

  if (message === '') return;

  addMessageToChat('user', message);
  userInput.value = '';
  userInput.disabled = true;

  const additionalContexts = await fetchTextFileContents(textFileUrls);
  const relevantContent = await searchTextFiles(message, additionalContexts);

  const maxWords = 2800;
  const userQueryWords = countWords(message);
  const availableWords = maxWords - userQueryWords;

  let totalWords = 0;
  const additional_context = relevantContent;

  console.log("Prompt:", message);
  console.log("History:", conversationHistory);
  console.log("Additional Context:", additional_context);

  const gptResponse = await fetchGPTResponse(message, additional_context, conversationHistory);

  if (gptResponse.error) {
    alert('Error occurred: ' + gptResponse.error);
  } else {
    addMessageToChat('gpt', gptResponse.response);
    conversationHistory.push('User: ' + message, 'JSPHPer: ' + gptResponse.response);
    console.log(conversationHistory);
  }

  userInput.disabled = false;
});

function addMessageToChat(sender, message) {
  const messageDiv = document.createElement('div');
  messageDiv.classList.add('chat-message');
  messageDiv.innerHTML = `<span class="${sender === 'user' ? 'user-message' : 'gpt-message'}">${sender === 'user' ? 'You: ' : 'JSPHPer: '}</span>${message}`;
  chatbox.appendChild(messageDiv);
  chatbox.scrollTop = chatbox.scrollHeight;
}

function countWords(text) {
  return text.trim().split(/\s+/).length;
}

async function fetchTextFileContents(urls) {
  const fileContents = await Promise.all(
    urls.map(async (url) => {
      const response = await fetch(url);
      const content = await response.text();
      //console.log(`Fetched content from ${url}:`, countWords(content));
      return { fileName: url, content };
    })
  );
  return fileContents;
}

async function fetchGPTResponse(prompt, additional_context, conversationHistory) {

  const conversationWeight = 0.15;
  const additionalContextWeight = 0.15;

  const searchPrompt =
  `This is the User Query:${prompt}\n
  This is the Past Conversation History:${conversationHistory}\n
  This is the Additional Context:${additional_context}\n
  Please answer the user Query using, only if relevant with the query, the past conversation history and the additional context
  Try to stick to ${conversationWeight * 100}% Past Conversation History, ${additionalContextWeight * 100}% Additional Context, and ${100 - (conversationWeight + additionalContextWeight) * 100}% model knowledge.
  The Addional context might be constructed with different pieces of information, make sure you use only the ones who match the user query, if something is not related don't use that.
  When you answer the query User Query don't refer to the additional context, just answer.
  If the query is not related to the context then just answer the query and ignore both Additional Context and Past Conversation.
  `

  console.log("FinalPrompt:", searchPrompt);

  const response = await fetch('gpt_api.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: searchPrompt,
      conversation_history: conversationHistory,
      additional_context: additional_context,
      conversationWeight: conversationWeight,
      additionalContextWeight: additionalContextWeight,
    }),
  });

  const responseText = await response.text();

  try {
    return JSON.parse(responseText);
  } catch (error) {
    console.error('Error parsing JSON:', error);
    alert('An unexpected error occurred. Server response: ' + responseText);
    return { error: 'An unexpected error occurred.' };
  }
}

async function fetchEmbedding(texts) {
  const response = await fetch("embedding_api.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ texts }),
  });

  if (!response.ok) {
    console.error(
      "Error fetching embeddings:",
      response.status,
      response.statusText,
      await response.text()
    );
    return { embeddings: [] }; // Return an empty array if there's an error in the response
  }

  const data = await response.json();
  return data;
}

function cosineSimilarity(a, b) {
  if (!a || !b) return 0;

  const dotProduct = a.reduce((sum, value, index) => sum + value * b[index], 0);
  const aMagnitude = Math.sqrt(a.reduce((sum, value) => sum + value * value, 0));
  const bMagnitude = Math.sqrt(b.reduce((sum, value) => sum + value * value, 0));

  return dotProduct / (aMagnitude * bMagnitude);
}

function getNgrams(text, n) {
  const words = text.split(/\s+/);
  const ngrams = [];
  for (let i = 0; i < words.length - n + 1; i++) {
    ngrams.push(words.slice(i, i + n).join(' '));
  }
  return ngrams;
}

function filterStopwords(terms) {
  const stopwords = [
    'a', 'an', 'the',
    'and', 'or', 'but', 'if', 'then', 'else', 'when','hi','hello',
    'at', 'by', 'from', 'for', 'with', 'about', 'against', 'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'of', 'over', 'under', 'again', 'further', 'in', 'on', 'off', 'out', 'as',
    'i', 'me', 'my', 'myself', 'we', 'us', 'our', 'ours', 'ourselves', 'you', "you're", "you've", "you'll", "you'd", 'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', "she's", 'her', 'hers', 'herself', 'it', "it's", 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'this', 'that', "that'll", 'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'will', 'would', 'should', 'can', 'could', 'ought', "i'm", "you're", "he's", "she's", "it's", "we're", "they're", "i've", "you've", "we've", "they've", "i'd", "you'd", "he'd", "she'd", "we'd", "they'd", "i'll", "you'll", "he'll", "she'll", "we'll", "they'll", "isn't", "aren't", "wasn't", "weren't", "haven't", "hasn't", "hadn't", "doesn't", "don't", "didn't", "won't", "wouldn't", "shan't", "shouldn't", "can't", "cannot", "couldn't", 'mustn', "let's", 'ought', "that's", "who's", "what's", "here's", "there's", "when's", "where's", "why's", "how's", 'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each',
    'few', 'more', 'most', 'several', 'some', 'such', 'only', 'own', 'other', 'than', 'too', 'very', 's', 't', 'just', 'don', "don't", 'now', 'd', 'll', 'm', 'o', 're', 've', 'y', 'ain', 'aren', "aren't", 'couldn', "couldn't", 'didn', "didn't", 'doesn', "doesn't", 'hadn', "hadn't", 'hasn', "hasn't", 'haven', "haven't", 'isn', "isn't", 'ma', 'mightn', "mightn't", 'mustn', "mustn't", 'needn', "needn't", 'shan', "shan't", 'shouldn', "shouldn't", 'wasn', "wasn't", 'weren', "weren't", 'won', "won't", 'wouldn', "wouldn't",
  ];

  const strippedTerms = terms.map(term => term.replace(/[^\w\s?]/g, '').toLowerCase());
  console.log(terms.filter(term => !stopwords.includes(term.toLowerCase())));
  return terms.filter(term => !stopwords.includes(term.toLowerCase()));
}

function getChunks(text, n) {
  const words = text.split(/\s+/);
  const chunks = [];
  for (let i = 0; i < words.length; i += n) {
    chunks.push(words.slice(i, i + n).join(' '));
  }
  return chunks;
}

const embeddingCache = {};

async function searchTextFiles(query, documents) {
  const queryEmbedding = await fetchEmbedding([query]);

  // If you want to search single terms separatley Include unigrams, bigrams, and trigrams
  //const queryNgrams = [
  //  ...query.split(/\s+/),
    //  ...getNgrams(query, 2),
    //  ...getNgrams(query, 3),
  //].filter((term) => term.trim() !== "");

  const queryNgrams = [query];

  // Filter out stopwords from the n-grams
  const filteredNgrams = filterStopwords(queryNgrams);

  if (filteredNgrams.length === 0) {
    return queryNgrams;
  }

  const queryEmbeddings = await fetchEmbedding(filteredNgrams); // Use filteredNgrams here
  const chunkSize = 100;

  const scores = [];

  for (const doc of documents) {
    let maxScore = 0;
    let bestChunk = '';

    const docNgrams = getChunks(doc.content, chunkSize);
    let docEmbeddings;

    if (!embeddingCache[doc.fileName]) {
      docEmbeddings = await fetchEmbedding(docNgrams);
      embeddingCache[doc.fileName] = {
        embeddings: docEmbeddings,
        cacheUsage: 0,
      };
      console.log('Fetched content from', doc.fileName);
      console.log('Created cached embeddings for', doc.fileName);
    } else {
      embeddingCache[doc.fileName].cacheUsage++;
      console.log(
        'Using cached embeddings for',
        doc.fileName,
        'Cache usage:',
        embeddingCache[doc.fileName].cacheUsage,
      );
    }

    docEmbeddings = embeddingCache[doc.fileName].embeddings;

    const chunkScores = new Map();

    for (let i = 0; i < queryNgrams.length; i++) {
      for (let j = 0; j < docNgrams.length; j++) {
        const score = cosineSimilarity(
          queryEmbeddings.embeddings[i],
          docEmbeddings.embeddings[j]
        );

        // Sum up the scores for each chunk
        chunkScores.set(docNgrams[j], (chunkScores.get(docNgrams[j]) || 0) + score);

        if (score > maxScore) {
          maxScore = score;
          bestChunk = docNgrams[j];
        }
      }
    }
    let k=1;
    // Log the total score of each chunk
    chunkScores.forEach((totalScore, chunk) => {
      let scorenew = totalScore/filteredNgrams.length;
      console.log(`Chunk ${k}, Total Score: ${scorenew}`);
      k++;
    });

    scores.push({ ...doc, score: maxScore, snippet: bestChunk });
  }

  console.log("Scores:", scores); // Log the scores before filtering
  const similarityThreshold = 0.75;

  const filteredScores = scores.filter((item) => item.score > similarityThreshold);
  console.log(`FS`, filteredScores);

  const rankedDocuments = filteredScores
  .sort((a, b) => b.score - a.score)
  .slice(0, 3);

  console.log("Ranked Documents:", rankedDocuments);
  return rankedDocuments.map((item) => item.snippet);
}
