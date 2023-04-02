# JSPHPer /ˈjæspər/.
JSPHPer is a quite simple, but very easy to use and understand, client for OpenAI ChatGPT with Embedding API enabled to add context from text files. 

This means that every time a user perfom a query, JSPHPer will first look into the files for some match, than return what found to OpenAI Chat component as context.

JSPHPer also remember previous conversations so you can chat with it. 
The way is setup give 20% weight to previous conversation 30% weight to context files and the rest from the model. You can customize that in the script.js.

It only uses JS &amp; PHP plus some text files, so is quite easy to try almost everywhere even with no DB.

Just put that in any webserver, set you api key in config.php (get one at https://platform.openai.com/overview) and you're good to go.

You can test it asking the bot what JSPHPer is.

You have 6 files and 1 folder where to put context files.

- index.html with the main page
- style.css 
- config.php where to put your API key
- gpt_api.php to speak with OpenAI GPT3.5 Turbo
- embedding_api.php to perform the search within your text files
- script.js to make things work in general
- context/example.txt

You can add as many file as you want but the more file you will add the slower every query will be.

I haven't code for a while so the whole thing is actually being written by GPT4 itself, I just ask politely and guide a lot GPT into the debugging phase.

This is not meant to be something serious, just something you can play with to understand a bit how it works.

**What would be cool to do next and future evolution?**

Add something that avoids JSPHPer to search into the files after every query. Once a file is scanned and cosine similarity are matched for some query it would be nice to save info somewhere. In this way it will slowly add knowledge on a specific domain if the question gravitates around that and would be able to accept more things as context maybe scanning the file less often.

Another idea is to store the info in a structured DB, instead that on text files, to make the search way smarter.
