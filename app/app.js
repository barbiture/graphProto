import * as d3 from "d3";
import * as d3Force from "d3-force";
import * as d3SelectionMulti from "d3-selection-multi";
import * as d3Dispatch from "d3-dispatch";
import * as data from '../fixtures/graph.json';

var colors = d3.scaleOrdinal(d3.schemeCategory10);

var svg = d3.select("svg"),
	width = +window.innerWidth,
	height = +window.innerHeight,
	node,
	link,
	defs = svg.append("svg:defs"),
	popup,
	edgepaths,
	edgelabels;

var simulation = d3
	.forceSimulation()
	.force(
		"link",
		d3
			.forceLink()
			.id((d) => d.id)
			.distance((d) => d.distance)
			.strength(1)
	)
	.force("charge", d3.forceManyBody())
	.force("center", d3.forceCenter(width / 2, height / 2));

fetch("http://localhost:3030/graph", { method: "GET" })
	.then((res) => res.json())
	.then((res) => {
		update(res.links, res.nodes);
	}).catch(() => {
		console.log('server not response')
		const {graph} = data;
		update(graph.links, graph.nodes);
	});

const lineWeight = (weight) => {
	switch (weight) {
		case "heavy":
			return 5;
		case "normal":
			return 4;
		default:
			return 3;
	}
};
const markerSize = (weight) => {
	switch (weight) {
		case "heavy":
			return 2;
		case "normal":
			return 12;
		default:
			return 14;
	}
};

defs
	.append("marker")
	.attrs({
		id: "arrowStart",
		viewBox: "-10 -5 10 10",
		refX: -14,
		refY: 0,
		orient: "auto",
		markerWidth: 4,
		markerHeight: 4,
		xoverflow: "visible",
	})
	.append("svg:path")
	.attrs({
		transform: "rotate(180)",
		d: "M 0,-5 L 10 ,0 L 0,5",
		fill: "#999",
		stroke: "none",
	});
defs
	.append("marker")
	.attrs({
		id: "arrowEnd",
		viewBox: "-0 -5 10 10",
		refX: 14,
		refY: 0,
		orient: "auto",
		markerWidth: 4,
		markerHeight: 4,
		xoverflow: "visible",
	})
	.append("svg:path")
	.attrs({
		d: "M 0,-5 L 10 ,0 L 0,5",
		fill: "#999",
		stroke: "none",
	});
function update(links, nodes) {
	link = svg
		.selectAll(".link")
		.data(links)
		.enter()
		.append("line")
		.attrs({
			"stroke-width": (d, i) => lineWeight(d.weight),
			weight: (d) => ("weight" in d ? d.weight : "default"),
			class: "link",
			"marker-end": (d, i) => {
				if (d.direction === "both" || d.direction === "forward")
					return "url(#arrowEnd)";
			},
			"marker-start": (d, i) => {
				if (d.direction === "both" || d.direction === "reverse")
					return "url(#arrowStart)";
			},
		});
	// link.append("title").text(function(d) {
	// 	return d.type;
	// });

	edgepaths = svg
		.selectAll(".edgepath")
		.data(links)
		.enter()
		.append("path")
		.attrs({
			class: "edgepath",
			"fill-opacity": 0,
			"stroke-opacity": 0,
			id: function(d, i) {
				return "edgepath" + i;
			},
		})
		.style("pointer-events", "none");

	edgelabels = svg
		.selectAll(".edgelabel")
		.data(links)
		.enter()
		.append("text")
		.style("pointer-events", "none")
		.attrs({
			class: "edgelabel",
			id: function(d, i) {
				return "edgelabel" + i;
			},
			"font-size": 10,
			fill: "#aaa",
		});

	edgelabels
		.append("textPath")
		.attr("xlink:href", function(d, i) {
			return "#edgepath" + i;
		})
		.style("text-anchor", "middle")
		.style("pointer-events", "none")
		.attr("startOffset", "50%")
		.text(function(d) {
			return d.type;
		});

	node = svg
		.selectAll(".node")
		.data(nodes)
		.enter()
		.append("g")
		.attr("class", "node")
		.on("click", clicked)
		.call(
			d3
				.drag()
				.on("start", dragstarted)
				.on("drag", dragged)
			//.on("end", dragended)
		);

	node
		.append("circle")
		.attr("r", 10)
		.style("fill", function(d, i) {
			return colors(i);
		});

	node.append("title").text(function(d) {
		return d.id;
	});

	node
		.append("text")
		.attr("dy", -15)
		.text(function(d) {
			return d.title;
		});
	const nodesDescription = nodes.filter((i) => "description" in i);
	popup = d3
		.select("#popup")
		.selectAll("div")
		.data(nodesDescription)
		.enter()
		.append("div")
		.join(node);

	popup.append("p").text(function(d) {
		return "description" in d ? d.description : "";
	});

	simulation.nodes(nodes).on("tick", ticked);
	simulation.force("link").links(links);
}

function ticked() {
	link
		.attr("x1", function(d) {
			return d.source.x;
		})
		.attr("y1", function(d) {
			return d.source.y;
		})
		.attr("x2", function(d) {
			return d.target.x;
		})
		.attr("y2", function(d) {
			return d.target.y;
		});
	node.attr("transform", function(d) {
		return "translate(" + d.x + ", " + d.y + ")";
	});

	edgepaths.attr("d", function(d) {
		return (
			"M " +
			d.source.x +
			" " +
			d.source.y +
			" L " +
			d.target.x +
			" " +
			d.target.y
		);
	});

	edgelabels.attr("transform", function(d) {
		if (d.target.x < d.source.x) {
			var bbox = this.getBBox();

			const rx = bbox.x + bbox.width / 2;
			const ry = bbox.y + bbox.height / 2;
			return "rotate(180 " + rx + " " + ry + ")";
		} else {
			return "rotate(0)";
		}
	});

	popup.style("top", (d) => `${d.y + 20}px`);
	popup.style("left", (d) => `${d.x + 20}px`);
}

function dragstarted(d) {
	if (!d3.event.active) simulation.alphaTarget(0.3).restart();
	d.fx = d.x;
	d.fy = d.y;
}

function dragged(d) {
	d.fx = d3.event.x;
	d.fy = d3.event.y;
}

function clicked(d) {
	popup.filter((p) => p.id !== d.id).attr("class", null);
	const thisPopup = popup.filter((p) => p.id === d.id);
	thisPopup.attr("class", "active");
}
