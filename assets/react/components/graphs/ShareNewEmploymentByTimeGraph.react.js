var React = require("react"),
	d3 = require("d3"),
	nv = require("nvd3");


var ShareNewEmploymentByTimeGraph = React.createClass({
    getInitialState:function(){
        return {
            data:[],
            loading:true
        }
    },
    getDefaultProps:function(){
        return({
            data:[]
        })
    },
    componentWillMount:function(){
        var scope = this;
        
        scope.setState({data:scope.processData(scope.props.data),loading:false});
    },
    trimData:function(data){
        var scope = this,
            trimmedData = {};

        Object.keys(data).forEach(function(firmAge){

            Object.keys(data[firmAge]).forEach(function(metroAreaId){
                //If we havent gotten to this MSA yet
                if(!trimmedData[metroAreaId]){
                    trimmedData[metroAreaId] = {};
                }

                //Iterating through every year for a given firm age in a metro area
                data[firmAge][metroAreaId].forEach(function(rowData){
                    if(!trimmedData[metroAreaId][rowData["year2"]]){
                        trimmedData[metroAreaId][rowData["year2"]] = {};
                    }
                    trimmedData[metroAreaId][rowData["year2"]][firmAge] = rowData["emp"];
                })
            })
        })

        return trimmedData;
    },
    processData:function(data){
        var scope = this;
        var ages = d3.range(12);

        //End goal of processing is to create the following object FOR EVERY METRO AREA:
        //msaId:{1977:{age0:numEmployed,age1:numEmployed...},1978:{age0:numEmployed,age1:numEmployed...}}

        //big object would look like:
        // {10000:{{},{}...}, 11000:{{},{}...], ...}

        //Extract only the fields we need from the dataset
        var fullMetroAreaData = scope.trimData(data);

        //console.log("after 1st process",fullMetroAreaData);

        //Now arranged by MSAID -> Year -> Firm Age

        //Want an array with one object PER metro area
        //Object will look like: {values:[{x:1977,y:val}, {x:1978,y:val}....],key=msa,}

        var chartData = Object.keys(fullMetroAreaData).map(function(msaId){

        	//Iterating through every year within a metro area
        	var valueArray = Object.keys(fullMetroAreaData[msaId]).map(function(year){
	        	var curCoord={"x":+year,"y":0},
		            totalEmploySum = 0,
		            newFirmSum = 0,
		            share = 0;


	            //Creates Total Employment number for that year
	            //Creates Employment in new firms for that year
	            ages.forEach(function(age){
	                if(fullMetroAreaData[msaId][year][age]){
	                    totalEmploySum = totalEmploySum + fullMetroAreaData[msaId][year][age];                   
	                }
	                if(fullMetroAreaData[msaId][year][age] && (age == 0 || age == 1 || age == 2)){
	                    newFirmSum = newFirmSum + fullMetroAreaData[msaId][year][age];
	                }
	            })
	            share = newFirmSum/totalEmploySum;

	            curCoord["y"] = share;
	            //Want to return: x:year y:percent
	            return curCoord;
        	})


        	//Only return once per metroArea
        	return {key:msaId,values:valueArray,area:false};

        })




        //Goes through every element of yearAgeTable
        //Each element represents a year of data
        //Each element has sub elements, one for each age of firm for that year
        //Want an array with 1 object
        //[{values:[{x:val,y:val}....],key=msa,}]
        //Want to return 1 object for each year, where x=year and y=percent employed in new firms



        //console.log("Done Processing",chartData);



        return chartData;
    },
	renderGraph:function(){

    	//1 - Share of employmment in new firms OVER TIME
        //One line per metro area -- line graph

        var scope = this;

        if(scope.state.loading){
            console.log('reloading')
            setTimeout(function(){ scope.renderGraph() }, 2000);
            
        
        }
        else{
            //Get rid of everything already in the svg
            d3.select("svg").remove();
            var data = scope.state.data;
            var margin = {top: 20, right: 80, bottom: 30, left: 50},
                width = 960 - margin.left - margin.right,
                height = 500 - margin.top - margin.bottom;

            var x = d3.scale.linear()
                .range([0, width]);

            var y = d3.scale.linear()
                .range([height, 0]);

            var color = d3.scale.category10();

            var xAxis = d3.svg.axis()
                .scale(x)
                .orient("bottom");

            var yAxis = d3.svg.axis()
                .scale(y)
                .orient("left");

            var line = d3.svg.line()
                .interpolate("basis")
                .x(function(d) { return x(d.x); })
                .y(function(d) { return y(d.y); });
  

            var svg = d3.select("body").append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
              .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            color.domain(d3.keys(data).map(function(metroArea) { return data[metroArea].key; }));

            var cities = Object.keys(data).map(function(metroArea){

                return {
                    msaId:data[metroArea].key,
                    values:data[metroArea].values
                }
            });



            x.domain([
                d3.min(cities, function(c) { return d3.min(c.values, function(v) { return v.x }); }),
                d3.max(cities, function(c) { return d3.max(c.values, function(v) { return v.x }); })
            ]);

            y.domain([
                d3.min(cities, function(c) { return d3.min(c.values, function(v) { return v.y; }); }),
                d3.max(cities, function(c) { return d3.max(c.values, function(v) { return v.y; }); })
            ]);

            svg.append("g")
              .attr("class", "x axis")
              .attr("transform", "translate(0," + height + ")")
              .call(xAxis)
            .append("text")
              .style("text-anchor", "end")
              .attr("dx","60em")
              .attr("dy","2em")
              .text("Year");

            svg.append("g")
              .attr("class", "y axis")
              .call(yAxis)
            .append("text")
              .attr("transform", "rotate(-90)")
              .attr("y", 6)
              .attr("dy", ".71em")
              .style("text-anchor", "end")
              .text("Share of Employment in New Firms");

            var city = svg.selectAll(".city")
              .data(cities)
            .enter().append("g")
              .attr("class", "city");

            city.append("path")
              .attr("class", "line")
              .attr("d", function(d) { return line(d.values); })
              .style("stroke", function(d) { return color(d.msaId); })
              .style("fill","none");

            city.append("text")
              .datum(function(d) { return {msaId: d.msaId, value: d.values[d.values.length - 1]}; })
              .attr("transform", function(d) { return "translate(" + x(d.value.x) + "," + y(d.value.y) + ")"; })
              .attr("x", 3)
              .attr("dy", ".35em")
              .text(function(d) { return d.x; });
            
    	}

	},
	render:function() {
		var scope = this;

    if(scope.state.data != []){
      scope.renderGraph();
    }

		return (
			<div>
        <div id="ShareNewEmploymentByTimeGraph"></div>
			</div>
		);
	}
	
});

module.exports = ShareNewEmploymentByTimeGraph;
