class Graph {
	constructor() {
		this.adjacencyMap = {};
		this.dataMap = {};
	}

	addDirectedEdge(startVertex, endVertex, cost) {
		if(!this.adjacencyMap[startVertex])
			this.addVertex(startVertex, 1);
		if(!this.adjacencyMap[endVertex])
			this.addVertex(endVertex, 1);
		this.adjacencyMap[startVertex][endVertex] = cost;
	}

	addVertex(vertexName, data) {
		if(this.dataMap[vertexName])
			return;
		this.adjacencyMap[vertexName] = {};
		this.dataMap[vertexName] = data;
	}

	getAdjacentVertices(vertexName) {
		return this.adjacencyMap[vertexName];
	}

	getData(vertexName) {
		return this.dataMap[vertexName];
	}

	incrementEdgeWeight(startVertex, endVertex, cost) {

		if(!this.adjacencyMap[startVertex])
			throw new Error("Node not in graph!");

		if(!this.adjacencyMap[endVertex])
			this.addVertex(endVertex, 1);

		if(this.adjacencyMap[startVertex][endVertex])
			this.adjacencyMap[startVertex][endVertex] += cost;
		else
			this.addDirectedEdge(startVertex, endVertex, cost);
	}

	getEdgeWeight(startVertex, endVertex) {
		if(!this.adjacencyMap[startVertex])
			return 0;
		return this.adjacencyMap[startVertex][endVertex] || 0;
	}

	combineEdgeWeights() {
		let out = [];
		for(let key in this.adjacencyMap) {
			let sum = 0;
			for(let connection in this.adjacencyMap[key]) {
				sum += this.adjacencyMap[key][connection];
				
			}
			out.push(sum);
		}
		return out;
	}

	print() {
		let output = "Vertices: [";
		let edges = "\nEdges:\n";

		for(let key in this.adjacencyMap) {
			output+= `${key},`;
			edges+= `Vertex(${key}) ---> ${JSON.stringify(this.adjacencyMap[key])}\n`;
		}

		console.log(output.substring(0, output.length - 1) + "]" + edges);
	}
}

module.exports = Graph;