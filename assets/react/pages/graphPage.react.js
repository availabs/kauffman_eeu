var React = require("react"),
	ShareNewEmploymentByTimeGraph = require("../components/graphs/ShareNewEmploymentByTimeGraph.react"),
	NewFirmPer1000Graph = require("../components/graphs/NewFirmPer1000Graph.react"),
	RankingsGraph = require("../components/graphs/RankingsGraph.react"),
	Loading = require("../components/layout/Loading.react"),
	LineGraph = require("../components/graphs/LineGraph.react"),
	BarGraph = require("../components/graphs/BarGraph.react"),	
	graphInfo = require("../components/utils/graphInfo.json"),
	DataStore = require("../components/utils/DataStore.react");


var GraphPage = React.createClass({
	getInitialState:function(){
		return({
			graph:"netMigration",
			metric:"Fluidity",
			data:[],
			loading:true,
			});
	},
    componentDidMount:function(){
        var scope = this;

		d3.select('#' + scope.state.graph)[0][0].className = "active";
		d3.select('#' + scope.state.metric)[0][0].className = "dropdown header active";

        scope.processData(scope.state.graph,function(data){
        	scope.setState({data:data,loading:false});        	
        })
    },
    componentWillUpdate:function(nextProps,nextState){
    	var scope = this;

    	scope.processData(nextState.graph,function(data){
			nextState.data = data;
			nextState.loading = false;
    	});
    },
    processData:function(graph,cb){
    	var scope = this;
        var filters = "none"

        cb(scope.refs.store.getGraphData(graph,filters));	
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

		scope.setState({graph:e.target.id,metric:metricName,loading:true});
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

	    if(scope.state.graph != "opportunity"){
	    	var graph = (<LineGraph data={scope.state.data} graph={scope.state.graph} />)
	    }
	    else{
	    	var graph = (<BarGraph data={scope.state.data} graph={scope.state.graph} />)
	    }
	    var filters = "none"
	    console.log("graphapge render state",scope.state);

	    if(!scope.state.loading){
		    return (
		    	<div>
		    		<div>
		    		<a id="downloadAnchorElem"></a>
		    			{graphTabs}
		    		</div>
		    			{store}
		    		<div>
		    			{graph}
		    		</div>

		    	</div>
		    )
	    }
	    else{
		    return (
		    	<div>
		    		<div>
		    		<a id="downloadAnchorElem"></a>
		    			{graphTabs}
		    		</div>
		    			{store}
		    		<div>
		    			<Loading />
		    		</div>

		    	</div>
		    )
	    }
	}
});

module.exports = GraphPage;
