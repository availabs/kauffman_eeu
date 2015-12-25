var React = require("react"),
	ShareNewEmploymentByTimeGraph = require("../components/graphs/ShareNewEmploymentByTimeGraph.react");
	


var GraphPage = React.createClass({


	render:function() {
		var scope = this;

	    var divStyle = {
	    	position:'relative'
	    };
		
		return (
			<div style={divStyle}>
				<ShareNewEmploymentByTimeGraph />
			</div>
		);
	}
});

module.exports = GraphPage;
