const natural = require('natural'),
	fs = require('fs'),
	pos = require('pos'),
	path = require('path');

const Graph = require('./graph.js');

class Summarizer {
	constructor({
		stopWords
	}) {
		if (!stopWords)
			throw new Error("Missing stopwords file!");

		this.stopWordsExternal = fs.readFileSync(stopWords, 'utf-8').split("\r\n");

	}

	summarize({
		text,
		reducePerc,
		sourceFile
	}) {


		//Load text from source file
		const textData = (!text)?fs.readFileSync(sourceFile, 'utf-8'):text;

		//TODO: Filter strange characters
		//Tokenize textData on words
		const wordTokenizer = new natural.WordPunctTokenizer();
		const textDataTokenized = wordTokenizer.tokenize(textData);
		const caseInsensitive = wordTokenizer.tokenize(textData.toLowerCase());

		//Sentence Segmentation
		let sentences = [];
		let tokenizedSentences = [];
		let sentence = " ";
		for (let word of textDataTokenized) {
			if (word != ".") {
				sentence += word + " ";
			} else {
				sentences.push(sentence.trim());
				tokenizedSentences.push(wordTokenizer.tokenize(sentence.toLowerCase().trim()));
				sentence = " ";
			}
		}


		//parts of speech tagger for text
		let POSTagger = (text) => {
			let words = new pos.Lexer().lex(text);
			let tagger = new pos.Tagger();
			return tagger.tag(words);
		}


		//Lemmatization
		let stemWords = (POSText) => {

			let stemmer = natural.PorterStemmer.stem;
			let stemmedWords = [];

			for (let word of POSText) {
				stemmedWords.push(stemmer(word));
			}

			return stemmedWords;
		}

		let stemmedWords = stemWords(caseInsensitive);

		//Tag stemmed words
		let processed = POSTagger(stemmedWords.join(" "));


		//Generate stopwords
		let genStopWords = (POSText) => {
			let stopWords = [];
			let targetPOS = ['NN', 'NNS', 'NNP', 'NNPS', 'JJ', 'JJR', 'JJS', 'FW'];

			for (let word of POSText) {
				if (targetPOS.indexOf(word[1]) == -1) {
					stopWords.push(word[0]);
				}
			}

			stopWords = stopWords.concat(["!", "?", ",", ";", ":", "."]);

			stopWords = stopWords.concat(this.stopWordsExternal);

			return new Set(stopWords);
		}

		let stopWords = genStopWords(processed);

		//Process tokenized sentences
		let processedSentences = [];

		for (let sentence of tokenizedSentences) {
			let processedSentence = [];

			let stemmedSentence = stemWords(sentence);

			for (let word of stemmedSentence) {
				if (!stopWords.has(word)) {
					processedSentence.push(word);
				}
			}

			processedSentences.push(processedSentence);
		}


		//Create graph strucutre
		let graph = new Graph();

		for (let i = 0; i < processedSentences.length; i++) {
			//Add default sentence score
			graph.addVertex(i, 1);
			for (let q = 0; q < processedSentences.length; q++) {
				//edge is free if same point
				if (i == q) {
					graph.addDirectedEdge(i, q, 0);
				} else {
					for (let word of processedSentences[i]) {
						if (processedSentences[q].indexOf(word) > -1) {
							graph.incrementEdgeWeight(i, q, processedSentences[q].find(o => o == word).length)
						}
					}

					if (graph.getEdgeWeight(i, q) != 0) {
						let lenI = processedSentences[i].length;
						let lenQ = processedSentences[q].length;

						let edgeWeight = graph.getEdgeWeight(i, q);

						graph.addDirectedEdge(edgeWeight / (Math.log(lenI) + Math.log(lenQ)));
					}
				}
			}
		}


		let copy = (ar) => {
			let out = [];
			for (let item of ar) {
				out.push(item);
			}
			return out;
		}

		let arrayAbs = (ar) => {
			let out = [];
			for (let item of ar) {
				out.push(Math.abs(item));
			}
			return out;
		}

		//Subtraction is ar - ar2
		let subArrays = (ar, ar2) => {
			if (ar.length != ar2.length)
				throw new Error("Arrays are not the same length!");

			let out = [];
			for (let i = 0; i < ar.length; i++) {
				out[i] = ar[i] - ar2[i];
			}
			return out;
		}

		let arraySum = (ar) => {
			return ar.reduce((a, c) => a + c);
		}

		//Calculate weighted sums
		let sentenceRatings = graph.combineEdgeWeights();

		//Scoring vertices
		const maxIterations = 50;
		const sentenceLength = processedSentences.length;
		let d = 0.85;
		let threshold = 0.0001;
		let score = (new Array(sentenceLength)).fill(0); //Might need to add fill of 1

		for (let loop = 0; loop < maxIterations; loop++) {
			let prevScore = copy(score);


			for (let i = 0; i < sentenceLength; i++) {

				let sum = 0;
				for (let j = 0; j < sentenceLength; j++) {
					if (graph.getEdgeWeight(i, j) != 0) {
						sum += graph.getEdgeWeight(i, j) / sentenceRatings[j] * score[j];
					}
				}

				score[i] = (1 - d) + d * sum;
			}

			let arSum = arraySum(arrayAbs(subArrays(prevScore, score)))

			if (arSum <= threshold) {
				console.log("Converging at iteration " + loop);
				break;
			}
		}

		let scoredSentences = [];
		for (let i = 0; i < sentences.length; i++) {
			scoredSentences.push({
				text: sentences[i],
				score: score[i]
			});
		}


		//Summary generation
		let summarySize = Math.floor(reducePerc / 100 * sentences.length) || 1;

		let sortedSentences = scoredSentences.sort((a, b) => {
			return b.score - a.score;
		});

		let summary = "";
		for (let i = 0; i < summarySize; i++) {
			summary += sortedSentences[i].text;
			summary += ".\n";
		}

		return summary;
	}
}

module.exports = Summarizer;