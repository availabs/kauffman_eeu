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
			graph:"rankings",
			data:[],
			loading:true,
			color:"population",
			group:"msa"
			});
	},
    componentDidMount:function(){
        var scope = this;




        scope.processData();
    },
    processData:function(){
    	var scope = this;

        var filters = "none"

        var data = scope.refs.store.compGraph(filters);

        if(!data){
            console.log('reloading')
            setTimeout(function(){ scope.processData() }, 1500);
        
        }
        else{
			scope.setState({data:data,loading:false});        	
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
			scope.setState({graph:"new"});
			d3.select('#newList')
				.attr('class',"active");

		}
		else if(e.target.id == "share"){
			scope.setState({graph:"share"});
			d3.select('#shareList')
				.attr('class',"active");
		}
		else{
			scope.setState({graph:"rankings"});
			d3.select('#rankings')
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
	    		<li id="shareList"  onClick={scope.toggleGraph}><a id="share" >Share of Employment in New Firms</a></li>
	    		<li id="newList" onClick={scope.toggleGraph} ><a id="new" >New firms per 1000 people</a></li>
	    		<li id="rankings" className="active" onClick={scope.toggleGraph}><a id="rank" >Rankings</a></li>
	    	</ul>
	    	);


	    var store = (<DataStore ref='store' />);
	    var graph = (<LineGraph data={scope.state.data} />)
	    var filters = "none"
	    console.log("page render",scope.state);
	    if(!scope.state.loading){
		    return (
		    	<div>
		    		<div>
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
