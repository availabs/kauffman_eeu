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

			var x = d3.scale.ordinal()
			    .rangeRoundBands([0, width], .1);

			var y = d3.scale.linear()
			    .range([height, 0]);

			var xAxis = d3.svg.axis()
			    .scale(x)
			    .orient("bottom");

			var yAxis = d3.svg.axis()
			    .scale(y)
			    .orient("left")
			    .ticks(10, "%");

			var svg = d3.select("#rankGraph").append("svg")
			    .attr("width", width + margin.left + margin.right)
			    .attr("height", height + margin.top + margin.bottom)
			  .append("g")
			    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


			  x.domain(data.map(function(d) { return d.key; }));
			  y.domain([d3.min(data, function(d) { return d['values'][0]['y']; }), d3.max(data, function(d) { return d['values'][0]['y']; })]);

			  svg.append("g")
			      .attr("class", "x axis")
			      .attr("transform", "translate(0," + height + ")")
			      .call(xAxis);

			  svg.append("g")
			      .attr("class", "y axis")
			      .call(yAxis)
			    .append("text")
			      .attr("transform", "rotate(-90)")
			      .attr("y", 6)
			      .attr("dy", ".71em")
			      .style("text-anchor", "end")
			      .text("Frequency");

			  svg.selectAll(".bar")
			      .data(data)
			    .enter().append("rect")
			      .attr("class", "bar")
			      .attr("x", function(d) { return x(d.name); })
			      .attr("width", x.rangeBand())
			      .attr("y", function(d) { return y(d['values'][0]['y']); })
			      .attr("height", function(d) { return height - y(d['values'][0]['y']); });




        }
    },
    render:function() {
    	var scope = this;

    	d3.selectAll("svg").remove();
    	console.log("bargraph",scope);

        if(scope.props.data.length != 0){
            scope.renderGraph();
            return (
                <div>
                    <h3>Rankings</h3>
                    <div id="rankGraph"><button  style={buttonStyle}className="btn" onClick={scope.resetBrush}>Reset Brush Filter</button>{valueButton}{rankButton}{rawButton}{relativeButton}</div>
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
