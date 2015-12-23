var React = require("react"),
	ShareNewEmploymentByTimeGraph = require("../components/graphs/ShareNewEmploymentByTimeGraph.react");
	


var GraphPage = React.createClass({

	//Temporary to get single line working
    getInitialState:function(){
        return {"msa":"10580"};
    },

	render:function() {
		var scope = this;
		return (
			<div>
				<ShareNewEmploymentByTimeGraph msa={scope.state.msa}/>
			</div>
		);
	}
});

module.exports = GraphPage;
