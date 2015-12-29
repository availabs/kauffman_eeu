var React = require("react"),
	ShareNewEmploymentByTimeGraph = require("../components/graphs/ShareNewEmploymentByTimeGraph.react"),
	NewFirmPer1000Graph = require("../components/graphs/NewFirmPer1000Graph.react"),
	Loading = require("../components/layout/Loading.react");	
	


var GraphPage = React.createClass({
	getInitialState:function(){
		return({
			graph:"share",
			data:[],
			loading:true
			});
	},
    componentDidMount:function(){
        var scope = this;

        scope.getData(function(data){
            scope.setState({data:data,loading:false});
        })
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
    getData:function(cb){
    	//Get data should get the raw data from every MSA
    	//Should make a new route and function
        var scope = this;

        d3.json("/allMsa",function(err,data){
            return cb(data);  
        })

    },
	render:function() {
		var scope = this;

		var legendStyle = {
			height:'500px',
			width:'100%',
		}

	    var graph,
	    	divs;

	    if(scope.state.graph == "share"){
	    	graph=(
	    		<div>
	    			<ShareNewEmploymentByTimeGraph data={scope.state.data}/>
	    		</div>
	    		);

	    	divs=(
	    		<div>
	    			<h3>Share of Employment in new firms</h3>
	                <div id="ShareNewEmploymentByTimeGraph"></div>
	                <div style = {legendStyle} id="ShareNewEmploymentByTimeLegend"></div>
	    		</div>
	    		);
	    }
	    else{
	    	graph=(
	    		<div>
	    			<NewFirmPer1000Graph data={scope.state.data}/>
	    		</div>);


	    	divs=(
	    		<div>
	    		    <h3>New Firms per 1000 people</h3>
	                <div id="NewFirmPer1000Graph"></div>
	                <div id="NewFirmPer1000Legend"></div>
	    		</div>
	    		);
	    }
		
		if(scope.state.loading == true){
	        return (
	        	<div>
	        		<Loading />
					{divs}
	        	</div>

	        )
		}
		else{
			return (
				<div>
					<button onClick={scope.toggleGraph}>Toggle</button>
					{divs}
					{graph}
				</div>
			);			
		}

	}
});

module.exports = GraphPage;
