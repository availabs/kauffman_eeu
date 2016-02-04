var React = require("react"),
	ShareNewEmploymentByTimeGraph = require("../components/graphs/ShareNewEmploymentByTimeGraph.react"),
	NewFirmPer1000Graph = require("../components/graphs/NewFirmPer1000Graph.react"),
	RankingsGraph = require("../components/graphs/RankingsGraph.react"),
	Loading = require("../components/layout/Loading.react");	


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

        scope.getData(function(data){
            scope.setState({data:data,loading:false});
        })
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
    getData:function(cb){
    	//Get data should get the raw data from every MSA
    	//Should make a new route and function
        var scope = this;

        d3.json("/allMsa",function(err,data){
            return cb(data);  
        })

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


	    if(scope.state.graph == "share"){
	    	graph=(
	    		<div>
	    			<ShareNewEmploymentByTimeGraph data={scope.state.data} color={scope.state.color} group={scope.state.group}/>
	    		</div>
	    		);

	    	divs=(
	    		<div>
	    			<h5 style={{fontWeight:'bold'}}>Share of Employment in new firms <br/>Colored by {scope.state.color}, grouped by {scope.state.group}</h5>
	                <div id="ShareNewEmploymentByTimeGraph"></div>
	    		</div>
	    		);
	    }
	    else if(scope.state.graph == "new"){
	    	graph=(
	    		<div>
	    			<NewFirmPer1000Graph data={scope.state.data} color={scope.state.color} group={scope.state.group}/>
	    		</div>);


	    	divs=(
	    		<div>
	    		    <h5 style={{fontWeight:"bold"}}>New Firms per 1000 people <br/>Colored by {scope.state.color}, grouped by {scope.state.group}</h5>
	                <div id="NewFirmPer1000Graph"></div>
	    		</div>
	    		);
	    }
	    else{
	    	graph=(
	    		<div>
	    			<RankingsGraph data={scope.state.data} color={scope.state.color} group={scope.state.group}/>
	    		</div>
	    		)
	    	divs=(
	    		<div>
	    		    <h5 style={{fontWeight:"bold"}}>Density Metric Rankings <br/>Colored by {scope.state.color}, grouped by {scope.state.group}</h5>
	                <div id="RankingsGraph"></div>
	    		</div>
	    		);

	    }
		
		if(scope.state.loading == true){
	        return (
	        	<div>
	        		{graphHeader}
		        	<div>
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
