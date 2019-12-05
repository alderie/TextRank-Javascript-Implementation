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