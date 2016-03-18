var React = require("react"),
    d3 = require("d3");

var BarGraph = React.createClass({
    getInitialState:function(){
        return {
            extent:[363,0],
            series:"composite"
        }
    },
    getDefaultProps:function(){
        return({
            data:[],
            graph:"composite"
        })
    },

    renderGraph:function(){
        var percFormat = d3.format(".3%");
        var scope = this;

        var compColor = d3.scale.ordinal()
            .domain(["lowIncome","highIncome"])
            .range(['red','green']);

        if(scope.props.data.length == 0){
            console.log('reloading')
            setTimeout(function(){ scope.renderGraph() }, 2000);
        }
        else{
        	d3.selectAll("svg").remove();

        	var data = scope.props.data;

            if(scope.state.series != "composite"){
                data.sort(function(a,b){
                    var aVal,
                        bVal;

                    a.values.forEach(function(val){
                        if(val.x == scope.state.series){
                            aVal = val.y;
                        }
                    })
                    b.values.forEach(function(val){
                        if(val.x == scope.state.series){
                            bVal = val.y;
                        }
                    })

                    if(aVal<bVal){
                        return 1;
                    }
                    else if(aVal>bVal){
                        return -1;
                    }
                    else{
                        return 0;
                    }

                })                
            }


            var filteredData = data.map(function(metroArea){

                var values = [];

                var filteredMetro = {
                    "key":metroArea.key,
                    "name":metroArea.name,
                    "values":null
                };

                filteredMetro.values = metroArea.values.filter(function(value){
                    if(scope.state.series == "composite"){
                        return value;
                    }
                    else{
                        if(value.x == scope.state.series){
                            return value;
                        }
                    }
                })

                return filteredMetro;
            })



            var margin = {top: 100, right: 40, bottom: 50, left: 55},
                width = window.innerWidth*.98 - margin.left - margin.right,
                height = window.innerHeight*.95 - margin.top - margin.bottom;

			var x0 = d3.scale.ordinal()
			    .rangeBands([0, width], .5,1);

            var x1 = d3.scale.ordinal();

			var y = d3.scale.linear()
			    .range([height, 0]);

			var xAxis = d3.svg.axis()
			    .scale(x0)
			    .orient("bottom")
                .tickValues([]);

			var yAxis = d3.svg.axis()
			    .scale(y)
			    .orient("left")
			    .ticks(20, "%");

            var voronoi = d3.geom.voronoi()
                .x(function(d) { return x0(d.city.key); })
                .y(function(d) { return y(d.y); })
                .clipExtent([[-margin.left, -margin.top], [width + margin.right, height + margin.bottom]])

			var svg = d3.select("#rankGraph").append("svg")
			    .attr("width", width + margin.left + margin.right)
			    .attr("height", height + margin.top + margin.bottom)
			  .append("g")
			    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

			x0.domain(filteredData.map(function(d) { return +d.key; }));
            x1.domain(['lowIncome','highIncome']).rangeRoundBands([0,x0.rangeBand()]);
			y.domain([d3.min(filteredData, function(d) { return d['values'][0]['y']; }), d3.max(filteredData, function(d) { return d['values'][0]['y']; })]);

			svg.append("g")
			    .attr("class", "x axis")
			    .attr("transform", "translate(0," + height + ")")
			    .call(xAxis)
                    .selectAll("text")  
                    .style("display", "none");

			svg.append("g")
			    .attr("class", "y axis")
			    .call(yAxis)
			      .append("text")
			      .attr("transform", "rotate(-90)")
			      .attr("y", 6)
			      .attr("dy", "-3.5em")
			      .style("text-anchor", "end")
			      .text("Percent Income Gain/loss");


            var metroArea = svg.selectAll(".metroArea")
                  .data(filteredData)
                .enter().append("g")
                  .attr("class","metroArea")
                  .attr("transform",function(d){ return "translate(" + x0(d.key) + ",0)";});


            if(scope.state.series == "composite"){
                metroArea.selectAll("rect")
                      .data(function(d){ return d.values;})
                    .enter().append("rect")
                      .attr("id",function(d){return "metroArea"+ d.city.key + d.x;})
                      .attr("width",x1.rangeBand())
                      .attr("x",function(d){ return x1(d.x);})
                      .attr("y",function(d){ return y(d.y);})
                      .attr("height",function(d){return height- y(d.y);})
                      .style("fill",function(d){return compColor(d.x);})    
            }
            else{
                metroArea.selectAll("rect")
                  .data(function(d){ return d.values;})
                .enter().append("rect")
                  .attr("id",function(d){return "metroArea"+ d.city.key + d.x;})
                  .attr("width",x1.rangeBand())
                  .attr("x",function(d){ return x1(d.x);})
                  .attr("y",function(d){ return y(d.y);})
                  .attr("height",function(d){return height- y(d.y);})
                  .style("fill",function(d){return d.color;})
            }


            var focus = svg.append("g")
                  .attr("transform", "translate(-100,-100)")
                  .attr("class", "focus");


                focus.append("text")
                  .attr("y", -10)
                  .style("font-weight","bold");

            var voronoiGroup = svg.append("g")
                  .attr("class", "voronoi")
                  .style("fill","#FFFFFF")
                  .style("stroke","#000000")
                  .style("opacity","0")

            voronoiGroup.selectAll("path")
                    .data(voronoi(d3.nest()
                        .key(function(d) {return (x0(d.city.key) + x1(d.x)) + "," + y(d.y); })
                        .rollup(function(v) { return v[0]; })
                        .entries(d3.merge(filteredData.map(function(d) { return d.values; })) )
                        .map(function(d) { return d.values; })))
                .enter().append("path")
                    .attr("d", function(d) { if(d!=undefined){return "M" + d.join("L") + "Z"}; })
                    .datum(function(d) { if(d!=undefined){return d.point}; })
                    .on("mouseover", mouseover)
                    .on("mouseout", mouseout)
                    .on("click",click);
        
            function mouseover(d) {
                var popText = "",
                    name;

                name = d.city.name;
           
                var rect = d3.select("#metroArea"+d.city.key+d.x);

                rect.style("fill","#000000");
                rect.attr("width",(x1.rangeBand()*5));

                popText = "Name: " + name + " High Income: " + percFormat(d.city.values[1].y) + " Low Income: " + percFormat(d.city.values[0].y);


                focus.attr("transform", "translate(100,-25)");
                focus.select("text").text(popText);
            }

            function click(d){
                var years = d3.range(1977,2013);
     
                console.log("d.city",d.city);
            }


            function mouseout(d) {                          
                    var rect = d3.select("#metroArea"+d.city.key+d.x);
                    if(scope.state.series == "composite"){
                        rect.style("fill",function(){return compColor(d.x);})
                    }
                    else{
                        rect.style("fill",function(){return d.color})                        
                    }
                    
                    rect.attr("width",(x1.rangeBand()));
            }


        }
    },
    toggleSeries:function(e){
        var scope = this;
        //console.log(e.target.id);

        var buttons = d3.selectAll(".btn");

        buttons[0].forEach(function(button){
            button.className = "btn btn-danger";
        })
        d3.select("#"+e.target.id)[0][0].className = "btn btn-success";

        scope.setState({series:e.target.id});
    },
    render:function() {
    	var scope = this;

        var buttonStyle = {
            marginTop:'10px',
            marginLeft:'10px'
        }

        var compButton,
            highButton,
            lowButton;


        compButton = (
            <button id="composite" style={buttonStyle} className="btn btn-success" onClick={scope.toggleSeries}>Composite</button>
            )

        highButton = (
            <button id="highIncome" style={buttonStyle} className="btn btn-danger" onClick={scope.toggleSeries}>High Income</button>
            ) 

        lowButton = (
            <button id="lowIncome" style={buttonStyle} className="btn btn-danger" onClick={scope.toggleSeries}>Low Income</button>
            ) 

        var seriesButtons = <div>{compButton}{highButton}{lowButton}</div>


    	d3.selectAll("svg").remove();
    	console.log("bargraph",scope.state);

        if(scope.props.data.length != 0){
            scope.renderGraph();
            return (
                <div>
                    <h3>Rankings</h3>
                    <div id="rankGraph">{seriesButtons}</div>
                </div>
            );          
        }
        else{
            return (
                <div>
                </div>
            );          
        }
    }


});






module.exports = BarGraph;
