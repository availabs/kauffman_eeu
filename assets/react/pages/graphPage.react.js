var React = require("react"),
	ShareNewEmploymentByTimeGraph = require("../components/graphs/ShareNewEmploymentByTimeGraph.react"),
	NewFirmPer1000Graph = require("../components/graphs/NewFirmPer1000Graph.react"),
	RankingsGraph = require("../components/graphs/RankingsGraph.react"),
	Loading = require("../components/layout/Loading.react"),
	LineGraph = require("../components/graphs/LineGraph.react"),
	DataStore = require("../components/utils/DataStore.react");


var GraphPage = React.createClass({
	getInitialState:function(){
		return({
			graph:"immigrant",
			data:[],
			loading:true,
			});
	},
    componentDidMount:function(){
        var scope = this;


        scope.setState({data:scope.processData(scope.state.graph),loading:false});
    },
    componentWillUpdate:function(nextProps,nextState){
    	var scope = this;

    	nextState.data = scope.processData(nextState.graph);
    	nextState.loading = false;
    },
    processData:function(graph){
    	var scope = this;

        var filters = "none"

        var data;


        if(graph == 'densComposite'){

        	data = scope.refs.store.densCompGraph(filters);
        }
        if(graph == 'share'){

        	data = scope.refs.store.shareGraph(filters);
        }
        if(graph == 'new'){

        	data = scope.refs.store.newGraph(filters);
        }
        if(graph == 'immigrant'){

        	data = scope.refs.store.immGraph(filters);
        }
        if(graph == 'migration'){

        	data = scope.refs.store.migrationGraph(filters);
        }



        if(!data){
            console.log('reloading')
            setTimeout(function(){ scope.processData(graph) }, 1500);
        
        }
        else{
			return(data)      	
        }


    			
    },
	toggleGraph:function(e){
		var scope = this;

		var headerItems = d3.selectAll('li');

		headerItems.forEach(function(items){
			items.forEach(function(item){
				item.className = "";
			})
			
		})

		if(e.target.id == "new"){
			scope.setState({graph:"new",loading:true});

			d3.select('#newList')
				.attr('class',"active");

		}
		else if(e.target.id == "share"){
			scope.setState({graph:"share",loading:true});
			d3.select('#shareList')
				.attr('class',"active");
		}
		else if(e.target.id == "immigrant"){
			scope.setState({graph:"immigrant",loading:true});
			d3.select('#immigrant')
				.attr('class',"active");
		}	
		else if(e.target.id == "migration"){
			scope.setState({graph:"migration",loading:true});
			d3.select('#migration')
				.attr('class',"active");
		}				
		else{
			scope.setState({graph:"densComposite",loading:true});
			d3.select('#densComposite')
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
	    		<li className="dropdown">
	    			<a className="dropdown-toggle" data-toggle="dropdown">Density Metrics<span className="caret"></span></a>
	    			<ul className="dropdown-menu">
			    		<li id="shareList"  onClick={scope.toggleGraph}><a id="share" >Share of Employment in New Firms</a></li>
			    		<li id="newList"  onClick={scope.toggleGraph} ><a id="new" >New firms per 1000 people</a></li>
	    				<li id="densComposite"  onClick={scope.toggleGraph}><a id="densComposite" >densComposite Rank</a></li>
	    			</ul>
	    		</li>
	    		<li className="dropdown">
	    			<a className="dropdown-toggle" data-toggle="dropdown">Diversity Metrics<span className="caret"></span></a>
	    			<ul className="dropdown-menu">
			    		<li id="immigrant" className="active" onClick={scope.toggleGraph} ><a id="immigrant" >Share of Immigrant Population</a></li>	
			    		<li id="migration"  onClick={scope.toggleGraph}><a id="migration" >Net Migration</a></li>	
	    				<li id="divComposite"  onClick={scope.toggleGraph}><a id="densComposite" >densComposite Rank</a></li>
	    			</ul>
	    		</li>
	    	</ul>
	    	);
        var buttonStyle = {
            marginTop:'30px',
            marginLeft:'10px'
        }


	    var store = (<DataStore ref='store' />);
	    var graph = (<LineGraph data={scope.state.data} graph={scope.state.graph} />)
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
