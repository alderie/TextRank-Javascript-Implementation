# TextRank Javascript Implementation

Base on the autotldr bot's implementation of the textrank summary system
[Link to github](https://github.com/JRC1995/auto-tldr-TextRank/blob/master/README.md)

This version is built in javascript and depends on the natural node library to work

Here is an example of how to use it. Have not turned it into a node module yet but that is in the works

```javascript
const Summarize = require('./textrank.js'),
	  fs = require('fs');

let summarizer = new Summarize({
	stopWords: 'resources/long_stopwords.txt'
})


let summary = summarizer.summarize({
	sourceFile: "text.txt",
	reducePerc: 10
});

fs.writeFileSync('output.txt', summary);

```