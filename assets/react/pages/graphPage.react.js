var React = require("react"),
	ShareNewEmploymentByTimeGraph = require("../components/graphs/ShareNewEmploymentByTimeGraph.react");
	


var GraphPage = React.createClass({

	render:function() {
		var scope = this;
		return (
			<div>
				<ShareNewEmploymentByTimeGraph />
			</div>
		);
	}
});

module.exports = GraphPage;
