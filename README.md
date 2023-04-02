# JSPHPer /ˈjæspər/.
JSPHPer is a quite simple, but very easy to use and understand, client for OpenAI ChatGPT with Embedding API enabled to add context from text files. 

This means that every time a user performs a query, JSPHPer will first look into the files for some match, then return what was found to the OpenAI Chat component as context.

JSPHPer also remembers previous conversations (of the same chat) so you can chat with it as in a conversation.

The way it is setup gives 15% weight to previous conversation 15% weight to context files and the rest from the model. You can customize that in the script.js.

The way the tool works with Embedding and custom query is such that it is meant to be used in english. You can use it in other languages but you should customize the prompt.

For the same reason while JSPHPer (or better OpenAI GPT3.5Turbo) will answer to any question, this should be used and make sense to chat on the domain of the context files since it will always try to use the context.

**Fun Fact & Disclaimer**

I haven't code for a while so, while I designed the blot flow, all the code here is actually being written by GPT4 itself. 
I just asked how I wanted this to work and guided GPT into writing the code and debugging.

This is not meant to be something serious, just something you can play with to understand a bit how Embedding works.

**Install JSPHPer**
It only uses JS &amp; PHP plus some text files, so it is quite easy to try almost everywhere even with no DB.

Just put that in any web server, set your api key in config.php (get one at https://platform.openai.com/overview) and you're good to go.

You can test it by asking the bot what JSPHPer is.

You have 6 files and 1 folder where to put context files.

- index.html with the main page
- style.css 
- config.php where to put your API key
- gpt_api.php to speak with OpenAI GPT3.5 Turbo
- embedding_api.php to perform the search within your text files
- script.js to make things work in general
- context/example.txt

You can add as many files as you want, JSPHPer will cache the file at the first query so later on it will be faster.

**What would be cool to do next and future evolution?**

It would be nice to make the search smarter, maybe saving info of all users' query and cosine match somewhere categorizing basically all the knowledge in advance.  In this way it will slowly add knowledge on a specific domain if the question gravitates around that and would be able to accept more precise context.

It should be easy enough also make JSPHPer access some online information.
