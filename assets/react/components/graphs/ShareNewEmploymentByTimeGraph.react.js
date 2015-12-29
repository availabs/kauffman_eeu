var React = require("react"),
	d3 = require("d3"),
	nv = require("nvd3"),
    msaIdToName = require('../utils/msaIdToName.json');


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

        //Final object will have the following for every msaId
        //msaId:{1977:{age0:numEmployed,age1:numEmployed...},1978:{age0:numEmployed,age1:numEmployed...}}

        //big object would look like:
        // {10000:{{},{}...}, 11000:{{},{}...], ...}

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
    chartData:function(data){
        var scope = this,
            ages = d3.range(12);

        //Every msa represented as:
        //{values:[{x:val,y:val}....],key=msa,}
        //Want to return 1 (x,y) object for each year, where x=year and y=percent employed in new firms
        var chartData = Object.keys(data).map(function(msaId){

            //Iterating through every year within a metro area
            var valueArray = Object.keys(data[msaId]).map(function(year){
                var curCoord={"x":+year,"y":0},
                    totalEmploySum = 0,
                    newFirmSum = 0,
                    share = 0;


                //Creates Total Employment number for that year
                //Creates Employment in new firms for that year
                ages.forEach(function(age){
                    if(data[msaId][year][age]){
                        totalEmploySum = totalEmploySum + data[msaId][year][age];                   
                    }
                    if(data[msaId][year][age] && (age == 0 || age == 1 || age == 2)){
                        newFirmSum = newFirmSum + data[msaId][year][age];
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

        return chartData;

    },
    addIndex:function(data){
        var scope = this;

        var indexedData = Object.keys(data).map(function(index){
            return {index:(+index),key:data[index].key,values:data[index].values}
        })

        return indexedData;
    },
    processData:function(data){
        var scope = this;

        //Extract only the fields we need from the dataset
        var metroAreaData = scope.trimData(data);
        //Data Now arranged by MSAID -> Year -> Firm Age


        //Want an array with one object PER metro area
        //Object will look like: {values:[{x:1977,y:val}, {x:1978,y:val}....],key=msa,}
        //Convert the trimmed data into a set of (x,y) coordinates for the chart
        var chartData = scope.chartData(metroAreaData);


        //Add indexes to the objects themselves
        var finalData = scope.addIndex(chartData);

        return finalData;
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

            var margin = {top: 20, right: 40, bottom: 50, left: 75},
                width = window.innerWidth*.98 - margin.left - margin.right,
                height = window.innerHeight*.98 - margin.top - margin.bottom;


            var x = d3.scale.linear()
                .range([0, width]);

            var y = d3.scale.linear()
                .range([height, 0]);

            var color = d3.scale.category20();

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
  

            var svg = d3.select("#ShareNewEmploymentByTimeGraph").append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
              .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            color.domain(d3.keys(data).map(function(metroArea) { return data[metroArea].key; }));

            var cities = Object.keys(data).map(function(metroArea){

                return {
                    index:data[metroArea].index,
                    name:msaIdToName[data[metroArea].key],
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

            // city.append("text")                                    
            //     .attr("x", function(d){return (d.index%5)*300})
            //     .attr("y", function(d){return height + margin.top + 30 + Math.floor(d.index/5)*20})        
            //     .attr("class", "legend")     
            //     .style("fill", function(d) {   
            //         return d.color = color(d.msaId); })             
            //     .text(function(d){return d.name});
            
            d3.select('#ShareNewEmploymentByTimeLegend')
                .style('overflow',"scroll")
                .style('overflow-x',"hidden");


            var legSvg = d3.select('#ShareNewEmploymentByTimeLegend')
                .append("svg")
                .attr("width",window.innerWidth*.98)
                .attr("height",window.innerHeight*.98)
                .attr("overflow","auto");

            var legend = legSvg.append("g")
                .attr("class", "legend1")    
                .attr('transform', 'translate('+margin.left+',75)');

            legend.selectAll('rect')
              .data(cities)
              .enter()
              .append("rect")
              .attr("x", function(d){return (d.index%4)*300})
              .attr("y", function(d){return Math.floor(d.index/4)*20 - 12;})
              .attr("width", 5)
              .attr("height", 12)
              .style("fill", function(d) { return color(d.msaId); })

            legend.selectAll('text')
              .data(cities)
              .enter()
              .append("text")
              .attr("x", function(d){return 7 + (d.index%4)*300})
              .attr("y", function(d){return Math.floor(d.index/4)*20;})
              .attr("width", 5)
              .attr("height", 5)
              .text(function(d) {return d.name});
        }

	},
	render:function() {
		var scope = this;

        if(scope.state.data != []){
          scope.renderGraph();
        }

		return (
			<div>

			</div>
		);
	}
	
});

module.exports = ShareNewEmploymentByTimeGraph;
