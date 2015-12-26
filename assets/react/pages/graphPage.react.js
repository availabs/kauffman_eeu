var React = require("react"),
	ShareNewEmploymentByTimeGraph = require("../components/graphs/ShareNewEmploymentByTimeGraph.react"),
	NewFirmPer1000Graph = require("../components/graphs/NewFirmPer1000Graph.react");	
	


var GraphPage = React.createClass({
	getInitialState:function(){
		return({graph:"new"});
	},
	toggleGraph:function(){
		var scope = this;
		console.log("toggle");
		if(scope.state.graph == "share"){
			scope.setState({graph:"new"});
		}
		else{
			scope.setState({graph:"share"});
		}
	},
	render:function() {
		var scope = this;

	    var divStyle = {
	    	position:'relative'
	    };

	    var graph;

	    if(scope.state.graph == "share"){
	    	graph=(<ShareNewEmploymentByTimeGraph />);
	    }
	    else{
	    	graph=(<div>
	    		<h3>New Firms per 1000 people</h3>
	    		<NewFirmPer1000Graph />
	    		</div>);
	    }
		
		return (
			<div style={divStyle}>
				<button onClick={scope.toggleGraph}>Toggle</button>
				{graph}
			</div>
		);
	}
});

module.exports = GraphPage;
