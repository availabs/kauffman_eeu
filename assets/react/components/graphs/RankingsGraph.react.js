var React = require("react"),
	d3 = require("d3");

var RankingsGraph = React.createClass({
	render:function() {
		console.log("RANKINGS GRAPH")
		d3.selectAll("svg").remove();
		return (
			<div>
				<h3>Rankings</h3>
			</div>
			
		);
	}
});

module.exports = RankingsGraph;