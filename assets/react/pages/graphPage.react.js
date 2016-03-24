var React = require("react"),
	ShareNewEmploymentByTimeGraph = require("../components/graphs/ShareNewEmploymentByTimeGraph.react"),
	NewFirmPer1000Graph = require("../components/graphs/NewFirmPer1000Graph.react"),
	RankingsGraph = require("../components/graphs/RankingsGraph.react"),
	Loading = require("../components/layout/Loading.react"),
	LineGraph = require("../components/graphs/LineGraph.react"),
	BarGraph = require("../components/graphs/BarGraph.react"),	
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

		var metricName;

		headerItems.forEach(function(items){
			items.forEach(function(item){
				if(item.className.substr(0,15) == "dropdown header"){
					item.className = "dropdown header"
					if(item.children[1].children[e.target.id]){
						metricName = item.id;
						item.className = "dropdown header active";
					}
				}
				else{
					item.className = "";

					if(item.id == e.target.id){
						//console.log(item.id);
						item.className += ' active';			
					}					
				}
			})	
		})

		scope.setState({graph:e.target.id,metric:metricName,loading:true});
	},
	render:function() {
		var scope = this;

	    var graph,
	    	divs;

	    var densityGraphs = [
	    	{id:'share','title':'Share of Employment in New Firms'},
	    	{id:'newValues','title':'New Firms per 1000 People'},
	    	{id:'densityComposite',title:'Density Composite Rank'}],
	    	diversityGraphs = [
	    	{id:'imm','title':'Percentage of Population that is Foriegn Born'},
	    	{id:'opportunity','title':'Income Gain/Loss from Childhood Residence'}],
	    	fluidityGraphs = [
	    	{id:'inc',title:'High Growth Firms'},
	    	{id:'irsNet',title:'Net Migration (IRS)'},
	    	{id:'netMigration',title:'Net Migration (ACS)'},
	    	{id:'totalMigrationFlow',title:'Total Migration (Outflow/Inflow Sum) (IRS)'},
	    	{id:'inflowMigration',title:'Inflow Migration'},
	    	{id:'outflowMigration',title:'Outflow Migration'}];

	    var metrics = {
	    	'Density':densityGraphs,
	    	'Diversity':diversityGraphs,
	    	'Fluidity':fluidityGraphs
	    }

	    var graphHeader = Object.keys(metrics).map(function(metricName){
	    	var metricItems = metrics[metricName].map(function(graph){
	    		return (<li id={graph.id}  onClick={scope.toggleGraph}><a id={graph.id} >{graph.title}</a></li>)
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
