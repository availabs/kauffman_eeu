var React = require("react"),
	ShareNewEmploymentByTimeGraph = require("../components/graphs/ShareNewEmploymentByTimeGraph.react"),
	NewFirmPer1000Graph = require("../components/graphs/NewFirmPer1000Graph.react"),
	Loading = require("../components/layout/Loading.react");	
	


	//Display row for current selection on both graphs
	//Finish newfirmper1000 group by state color issue
	//Add voronoi to newfirmper1000


	//on new firm graph, toggle to filter out outlier
	//rank metro area/state per metric per year separately
	//also create aggregate ranking (have to determine how to weigh each metric against each other)
		//Using rank within the metric as well as the value of the metric itself


	//Explore using 3? year averages to calculate metrics rather than single year to smooth out data


	//read fluidity and diversity FROM KAUFFMAN PAPER

var GraphPage = React.createClass({
	getInitialState:function(){
		return({
			graph:"share",
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
		console.log("toggle",e.target.id);
		if(e.target.id == "new"){
			scope.setState({graph:"new"});
			d3.select('#newList')
				.attr('class',"active");
			d3.select('#shareList')
				.attr('class',"");

		}
		else{
			scope.setState({graph:"share"});
			d3.select('#newList')
				.attr('class',"");
			d3.select('#shareList')
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
	    		<li id="shareList" className="active" onClick={scope.toggleGraph}><a id="share" >Share of Employment in New Firms</a></li>
	    		<li id="newList" onClick={scope.toggleGraph} ><a id="new" >New firms per 1000 people</a></li>
	    		<li id="color">{colorHeader}</li>
	    		<li id="group">{groupHeader}</li>
	    	</ul>
	    	);



        var tableStyle = {
            overflow:scroll,
            height:'500px',
            width:'100%'
        }


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
	    else{
	    	graph=(
	    		<div>
	    			<NewFirmPer1000Graph data={scope.state.data} color={scope.state.color} group={scope.state.group}/>
	    		</div>);


	    	divs=(
	    		<div>
	    		    <h5 style={{fontWeight:bold}}>New Firms per 1000 people <br/>Colored by {scope.state.color}, grouped by {scope.state.group}</h5>
	                <div id="NewFirmPer1000Graph"></div>
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
