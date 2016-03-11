var React = require("react"),
    d3 = require("d3");

var BarGraph = React.createClass({
    getInitialState:function(){
        return {
            extent:[363,0],
            plot:"rank",
            dataType:"raw"
        }
    },
    getDefaultProps:function(){
        return({
            data:[],
            graph:"composite"
        })
    },
    renderGraph:function(){
        var scope = this;

        if(scope.props.data.length == 0){
            console.log('reloading')
            setTimeout(function(){ scope.renderGraph() }, 2000);
        }
        else{
        	d3.selectAll("svg").remove();

        	var data = scope.props.data;

            var margin = {top: 100, right: 40, bottom: 50, left: 55},
                width = window.innerWidth*.98 - margin.left - margin.right,
                height = window.innerHeight - margin.top - margin.bottom;

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

			var svg = d3.select("#rankGraph").append("svg")
			    .attr("width", width + margin.left + margin.right)
			    .attr("height", height + margin.top + margin.bottom)
			  .append("g")
			    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


			x0.domain(data.map(function(d) { return d.key; }));
            x1.domain(['lowIncome','highIncome']).rangeRoundBands([0,x0.rangeBand()]);
			y.domain([d3.min(data, function(d) { return d['values'][0]['y']; }), d3.max(data, function(d) { return d['values'][0]['y']; })]);

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
                  .data(data)
                .enter().append("g")
                  .attr("class","metroArea")
                  .attr("transform",function(d){return "translate(" + x0(d.key) + ",0)";});

            metroArea.selectAll("rect")
                  .data(function(d){ return d.values;})
                .enter().append("rect")
                  .attr("width",x1.rangeBand())
                  .attr("x",function(d){ return x1(d.x);})
                  .attr("y",function(d){ return y(d.y);})
                  .attr("height",function(d){return height- y(d.y);})
                  .style("fill",function(d){return d.color;})


        }
    },
    render:function() {
    	var scope = this;

        var buttonStyle = {
            marginTop:'10px',
            marginLeft:'10px'
        }

    	d3.selectAll("svg").remove();
    	console.log("bargraph",scope);

        if(scope.props.data.length != 0){
            scope.renderGraph();
            return (
                <div>
                    <h3>Rankings</h3>
                    <div id="rankGraph"></div>
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
