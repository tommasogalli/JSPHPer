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
    const filteredContent = [];
    for (const content of relevantContent) {
        const words = countWords(content);
        if (totalWords + words <= availableWords) {
            totalWords += words;
            filteredContent.push(content);
        } else {
            break;
        }
    }

    const gptPrompt = 'User: ' + message + '\n' + filteredContent.join('\n');
    console.log("GPT Prompt:", gptPrompt);

    const gptResponse = await fetchGPTResponse(gptPrompt, conversationHistory);


    if (gptResponse.error) {
        alert('Error occurred: ' + gptResponse.error);
    } else {
        addMessageToChat('gpt', gptResponse.response);
        conversationHistory.push('User: ' + message, 'GPT: ' + gptResponse.response);
        console.log(conversationHistory);
    }

    userInput.disabled = false;
});

function addMessageToChat(sender, message) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('chat-message');
    messageDiv.innerHTML = `<span class="${sender === 'user' ? 'user-message' : 'gpt-message'}">${sender === 'user' ? 'You: ' : 'GPT: '}</span>${message}`;
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
      console.log(`Fetched content from ${url}:`, countWords(content));
      return { fileName: url, content };
    })
  );
  return fileContents;
}

async function fetchGPTResponse(prompt, additionalContexts) {
  const conversationHistoryWithAdditionalContext = [...conversationHistory];

  const conversationWeight = 0.15;
  const additionalContextWeight = 0.15;

  // Prepare the weighted chat history and additional context strings
  const weightedChatHistory = conversationHistoryWithAdditionalContext.map(message => `User: ${message}`).join('\n');
  const weightedAdditionalContext = additionalContexts.map((content, index) => `MarsciDB ${index + 1}: ${content}`).join('\n');

  const searchPrompt = `${weightedChatHistory}\n\n${weightedAdditionalContext}\n\nUser: ${prompt}\n\nPlease find relevant information MarsciDB and answer the user query without mentioning MarsciDB. Always mix what you know with what is in the files. Use ${conversationWeight * 100}% past chat context, ${additionalContextWeight * 100}% additional context, and ${100 - (conversationWeight + additionalContextWeight) * 100}% model knowledge.\n`;

  const response = await fetch('gpt_api.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: searchPrompt,
      conversation_history: conversationHistoryWithAdditionalContext,
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
    const response = await fetch('embedding_api.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ texts })
    });

    if (!response.ok) {
    console.error('Error fetching embeddings:', response.status, response.statusText);
    return { embeddings: [] }; // Return an empty array if there's an error in the response
  }

  const data = await response.json();
  return data;
}

function cosineSimilarity(a, b) {
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

function filterPrepositions(terms) {
  const prepositions = ['in', 'at', 'on', 'of', 'for', 'with', 'about', 'as', 'by', 'to', 'from', 'up', 'down', 'over', 'under', 'between', 'among', 'through', 'during', 'before', 'after', 'above', 'below', 'across', 'along', 'beside', 'inside', 'outside', 'near', 'far', 'beyond', 'within', 'without', 'against', 'toward', 'towards', 'into', 'onto', 'off', 'except', 'since', 'upon'];
  return terms.filter(term => !prepositions.includes(term.toLowerCase()));
}

function getSnippet(content, position, snippetSize) {
  const words = content.split(/\s+/);
  const start = Math.max(0, position - snippetSize);
  const end = Math.min(words.length, position + snippetSize);
  return words.slice(start, end).join(' ');
}

async function searchTextFiles(query, documents) {
  const queryNgrams = filterPrepositions([...getNgrams(query, 2), ...getNgrams(query, 3)]);

  if (queryNgrams.length === 0) {
    return [];
  }

  const queryEmbeddings = await fetchEmbedding(queryNgrams);
  const snippetSize = 100;

  const scores = [];
  for (const doc of documents) {
    let totalScore = 0;
    const docNgrams = [doc.content];
    const docEmbeddings = await fetchEmbedding(docNgrams);

    for (let i = 0; i < queryNgrams.length; i++) {
      for (let j = 0; j < docNgrams.length; j++) {
        const score = cosineSimilarity(queryEmbeddings.embeddings[i], docEmbeddings.embeddings[j]);
        totalScore += score;
      }
    }

    const snippet = getSnippet(doc.content, doc.content.indexOf(query), snippetSize);
    scores.push({ ...doc, score: totalScore, snippet });
  }

  const similarityThreshold = 9.5;
  const filteredScores = scores.filter((item) => item.score > similarityThreshold);

  const rankedDocuments = filteredScores
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  rankedDocuments.forEach((item) => {
    console.log(`File name: ${item.fileName}, Text match: ${item.snippet}, Score: ${item.score}`);
  });

  return rankedDocuments.map((item) => item.snippet);
}
