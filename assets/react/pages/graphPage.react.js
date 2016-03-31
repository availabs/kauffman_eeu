var React = require("react"),
	ShareNewEmploymentByTimeGraph = require("../components/graphs/ShareNewEmploymentByTimeGraph.react"),
	NewFirmPer1000Graph = require("../components/graphs/NewFirmPer1000Graph.react"),
	RankingsGraph = require("../components/graphs/RankingsGraph.react"),
	LineGraph = require("../components/graphs/LineGraph.react"),
	BarGraph = require("../components/graphs/BarGraph.react"),	
	graphInfo = require("../components/utils/graphInfo.json"),
	Loading = require("../components/layout/Loading.react"),
	DataStore = require("../components/utils/DataStore.react");


var GraphPage = React.createClass({
	getInitialState:function(){
		return({
			graph:"netMigration",
			metric:"Fluidity",
			data:undefined
			});
	},
    componentDidMount:function(){
        var scope = this;

		d3.select('#' + scope.state.graph)[0][0].className = "active";
		d3.select('#' + scope.state.metric)[0][0].className = "dropdown header active";

        scope.processData(scope.state.graph)
    },
    processData:function(graph){
    	var scope = this;
        var filters = "none"

        scope.refs.store.getGraphData(graph,filters,function(data){
        	scope.setState({data:data})
        });	
    },
	toggleGraph:function(e){
		var scope = this;

		var headerItems = d3.selectAll('li');

		var metricName = graphInfo[e.target.id].metric;

		headerItems.forEach(function(items){
			items.forEach(function(item){
				item.className = "";

				if(item.id == e.target.id){
					//console.log(item.id);
					item.className += ' active';
					d3.select('#' + metricName)[0][0].className = "dropdown header active";
				}						
			})	
		})

		scope.setState({data:undefined,graph:e.target.id,metric:metricName})
		scope.processData(e.target.id);
		
	},
	render:function() {
		var scope = this;

	    var graph,
	    	divs;

	    var metrics = ['Density','Diversity','Fluidity']
	    
	    var graphHeader = metrics.map(function(metricName){

	    	var metricItems = Object.keys(graphInfo).filter(function(graphId){
	    		return graphInfo[graphId].metric == metricName    		
	    	}).map(function(filteredId){
				return (<li id={filteredId}  onClick={scope.toggleGraph}><a id={filteredId} >{graphInfo[filteredId].title}</a></li>)		    		
	    	})

	    	return (
	    		<li className="dropdown header" id={metricName}>
	    			<a className="dropdown-toggle" data-toggle="dropdown">{metricName} Metrics<span className="caret"></span></a>	    			
	    			<ul className="dropdown-menu">
	    				{metricItems}
	    			</ul>
				</li>
			)
	    })

	    var graphTabs = (
	    	<ul className="nav nav-tabs">
				{graphHeader}
	    	</ul>
	    	)

        var buttonStyle = {
            marginTop:'30px',
            marginLeft:'10px'
        }

	    var store = (<DataStore ref='store' />);


	    console.log("graphapge render state",scope.state);

	    if(scope.state.data){
		    if(scope.state.graph != "opportunity"){
		    	var graph = (<LineGraph data={scope.state.data} graph={scope.state.graph} />)
		    }
		    else{
		    	var graph = (<BarGraph data={scope.state.data} graph={scope.state.graph} />)
		    }
		    var filters = "none"
		    return (
		    	<div>
		    		<div>
		    			{graphTabs}
		    		</div>
		    			{store}
		    		<div>
		    			{graph}
		    		</div>
		    		<div>
		    		</div>

		    	</div>
		    )
	    }
	    else{
		    return (
		    	<div>
		    		<div>
		    			{graphTabs}
		    		</div>
		    			{store}
		    		<Loading />
		    	</div>
		    )
	    }
	}
});

module.exports = GraphPage;
