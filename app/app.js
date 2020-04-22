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
svg
 .call(d3.zoom().on("zoom", function () {
    svg.attr("transform", d3.event.transform)
    .exit();
 }))
function update(links, nodes) {
	link = svg
		.selectAll(".link")
		.data(links)
		.enter()
		.append("line")
		.attrs({
			"stroke-width": d => lineWeight(d.weight),
			"weight": d => ("weight" in d ? d.weight : "default"),
			"class": "link",
			"marker-end": (d, i) => {
				if (d.direction === "both" || d.direction === "forward")
					return "url(#arrowEnd)";
			},
			"marker-start": (d, i) => {
				if (d.direction === "both" || d.direction === "reverse")
					return "url(#arrowStart)";
			},
			"stroke": (_, i) => colors(i)
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
				.on("end", dragended)
		);

	node
		.append("circle")
		.attr("r", 10)
		.style("fill", function(d, i) {
			return colors(i);
		})
		.exit();

	node.append("title").text(d => d.id);

	node
		.append("text")
		.attr("dy", -15)
		.text(d => d.title);
	const nodesDescription = nodes.filter(i => "description" in i);
	popup = d3
		.select("#popup")
		.selectAll("div")
		.data(nodesDescription)
		.enter()
		.append("div")
		.join(node);

	popup.append("p").text((d) => d.description);

	simulation.nodes(nodes).on("tick", ticked);
	simulation.force("link").links(links);
}
function ticked() {
	link
		.attr("x1", d => d.source.x.toFixed(0))
		.attr("y1", d => d.source.y.toFixed(0))
		.attr("x2", d => d.target.x.toFixed(0))
		.attr("y2", d => d.target.y.toFixed(0))
	node.attr("transform", d => "translate(" + d.x.toFixed(0) + ", " + d.y.toFixed(0) + ")");

	popup.style("top", d => `${d.y + 20}px`);
	popup.style("left", d => `${d.x + 20}px`);
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
function dragended(d) {
	// node.exit();
}

function clicked(d) {
	popup.filter((p) => p.id !== d.id).attr("class", null);
	const thisPopup = popup.filter((p) => p.id === d.id);
	if(!thisPopup.attr('class')) {
		thisPopup.attr("class", "active");
	} else {
		thisPopup.attr("class", null);
	}
}

