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
			data:[],
			loading:true,
			});
	},
    componentDidMount:function(){
        var scope = this;

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

		headerItems.forEach(function(items){
			items.forEach(function(item){
				item.className = "";
			
				if(item.id == e.target.id){
					console.log(item.id);
					item.className += ' active';			
				}
			})	
		})
		//console.log(e.target.id);

		scope.setState({graph:e.target.id,loading:true});

		if(e.target.id == "newValues"){
			d3.select('#density')
				.attr('class',"active");
		}
		else if(e.target.id == "share"){
			d3.select('#density')
				.attr('class',"active");
		}
		else if(e.target.id == "imm"){
			d3.select('#diversity')
				.attr('class',"active");
		}	
		else if(e.target.id == "netMigration"){
			d3.select('#fluidity')
				.attr('class',"active");
		}
		else if(e.target.id == "inflowMigration"){
			d3.select('#fluidity')
				.attr('class',"active");
		}
		else if(e.target.id == "outflowMigration"){
			d3.select('#fluidity')
				.attr('class',"active");
		}	
		else if(e.target.id == "irsNet"){
			d3.select('#fluidity')
				.attr('class',"active");
		}	
		else if(e.target.id == "inc"){
			d3.select('#fluidity')
				.attr('class',"active");
		}
		else if(e.target.id == "totalMigrationFlow"){
			d3.select('#fluidity')
				.attr('class',"active");
		}	
		else if(e.target.id == "opportunity"){
			d3.select('#diversity')
				.attr('class',"active");
		}					
		else{
			d3.select('#density')
				.attr('class',"active");
		}

	},
    toggleColor:function(e){
    	var scope = this;
    	scope.setState({color:e.target.id});
    },
    toggleGroup:function(e){
    	var scope = this;
    	scope.setState({group:e.target.id});
    },
	render:function() {
		var scope = this;

	    var graph,
	    	divs;

	    var graphHeader = (
	    	<ul className="nav nav-tabs">
	    		<li className="dropdown" id="density">
	    			<a className="dropdown-toggle" data-toggle="dropdown">Density Metrics<span className="caret"></span></a>
	    			<ul className="dropdown-menu">
			    		<li id="share"  onClick={scope.toggleGraph}><a id="share" >Share of Employment in new Firms</a></li>
			    		<li id="newValues"  onClick={scope.toggleGraph} ><a id="newValues" >New firms per 1000 people</a></li>
	    				<li id="densityComposite"  onClick={scope.toggleGraph}><a id="densityComposite" >Density Composite Rank</a></li>
	    			</ul>
	    		</li>
	    		<li className="dropdown" id="diversity">
	    			<a className="dropdown-toggle" data-toggle="dropdown">Diversity Metrics<span className="caret"></span></a>
	    			<ul className="dropdown-menu">
			    		<li id="imm" onClick={scope.toggleGraph} ><a id="imm" >Share of Immigrant Population</a></li>		
			    		<li id="opportunity" onClick={scope.toggleGraph} ><a id="opportunity" >Income Gain/Loss from Childhood Residence</a></li>		
	    			</ul>
	    		</li>
	    		<li className="dropdown active" id="fluidity">
	    			<a className="dropdown-toggle" data-toggle="dropdown">Fluidity Metrics<span className="caret"></span></a>
	    			<ul className="dropdown-menu">
	    				<li id="inc"   onClick={scope.toggleGraph}><a id="inc" >High Growth Firms</a></li>	
	    				<li id="irsNet"  onClick={scope.toggleGraph}><a id="irsNet" >Net Migration (IRS)</a></li>
			    		<li id="netMigration" className="active" onClick={scope.toggleGraph}><a id="netMigration" >Net Migration (ACS)</a></li>
			    		<li id="totalMigrationFlow"  onClick={scope.toggleGraph}><a id="totalMigrationFlow" >Total Migration (Outflow/Inflow Sum) (IRS)</a></li>
			    		<li id="inflowMigration"  onClick={scope.toggleGraph}><a id="inflowMigration" >Inflow Migration</a></li>
			    		<li id="outflowMigration"  onClick={scope.toggleGraph}><a id="outflowMigration" >Outflow Migration</a></li>	
	    			</ul>
	    		</li>
	    	</ul>
	    	);
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
		    			{graphHeader}
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
		    			{graphHeader}
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
