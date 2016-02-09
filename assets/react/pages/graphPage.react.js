var React = require("react"),
	ShareNewEmploymentByTimeGraph = require("../components/graphs/ShareNewEmploymentByTimeGraph.react"),
	NewFirmPer1000Graph = require("../components/graphs/NewFirmPer1000Graph.react"),
	RankingsGraph = require("../components/graphs/RankingsGraph.react"),
	Loading = require("../components/layout/Loading.react"),
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

        var filters = "none";

scope.refs.store.compGraph(filters);
// 		var Child = React.createClass({DataStore});
// 		var myChild = React.renderComponent(Child);



// var Inputs = React.createClass({DataStore});
// var myInputs = React.renderComponent(Inputs);
// myInputs.shareGraph(filters);
        
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



	    var colorHeader = (                
	    		<div className="dropdown">
                  <button className="btn btn-primary dropdown-toggle" type="button" data-toggle="dropdown">Color
                  <span className="caret"></span></button>
                  <ul className="dropdown-menu">
                    <li><a id="population" onClick={scope.toggleColor}>Population</a></li>
                    <li><a id="state" onClick={scope.toggleColor}>State</a></li>
                  </ul>
                </div>
                );

	    var groupHeader = (                
	    		<div className="dropdown">
                  <button className="btn btn-primary dropdown-toggle" type="button" data-toggle="dropdown">Grouping
                  <span className="caret"></span></button>
                  <ul className="dropdown-menu">
                    <li><a id="msa" onClick={scope.toggleGroup}>Metro Area</a></li>
                    <li><a id="state" onClick={scope.toggleGroup}>State</a></li>
                  </ul>
                </div>
                );

	    var graphHeader = (
	    	<ul className="nav nav-tabs">
	    		<li id="shareList"  onClick={scope.toggleGraph}><a id="share" >Share of Employment in New Firms</a></li>
	    		<li id="newList" onClick={scope.toggleGraph} ><a id="new" >New firms per 1000 people</a></li>
	    		<li id="rankings" className="active" onClick={scope.toggleGraph}><a id="rank" >Rankings</a></li>
	    		<li id="color">{colorHeader}</li>
	    		<li id="group">{groupHeader}</li>
	    	</ul>
	    	);



		
		if(scope.state.loading == true){
	        return (
	        	<div>
	        		{graphHeader}
		        	<div>
		        		<DataStore ref='store'/>
		        		<Loading />
						{divs}
		        	</div>
	        	</div>
	        )
		}
		else{
			return (
				<div>

					{graphHeader}
					{divs}
					{graph}
				</div>
			);			
		}

	}
});

module.exports = GraphPage;
