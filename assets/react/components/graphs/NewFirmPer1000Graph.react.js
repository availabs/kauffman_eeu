var React = require("react"),
	d3 = require("d3"),
    metroPop20002009 = require("../utils/metroAreaPop2000_2009.json"),
	nv = require("nvd3"),
    msaIdToName = require('../utils/msaIdToName.json');


var NewFirmPer1000Graph = React.createClass({
    getInitialState:function(){
        return {
            curChart:"line",
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
                    //Only want years 2000 thru 2009, since thats all we have pop data for right now
                    if(rowData["year2"]>= 2000 && rowData["year2"]<= 2009){
                        if(!trimmedData[metroAreaId][rowData["year2"]]){
                            trimmedData[metroAreaId][rowData["year2"]] = {};
                        }
                        trimmedData[metroAreaId][rowData["year2"]][firmAge] = rowData["firms"];                       
                    }

                })
            })

        })

        return trimmedData;

    },
    chartData:function(data){
        var scope = this,
            ages = d3.range(12);

        var upperLimit = function(share){
            if(share > 15000){
                return 15000
            }
            else{
                return share;
            }
        }

        //Every msa represented as:
        //{values:[{x:val,y:val}....],key=msa,}
        //Want to return 1 (x,y) object for each year, where x=year and y=new firms per 1000 people
        var chartData = Object.keys(data).map(function(msaId){
            //Iterating through every year within a metro area
            var valueArray = Object.keys(data[msaId]).map(function(year){
                var curCoord={"x":+year,"y":0},
                    newFirmSum = 0,
                    newPer1000 = 0,
                    pop = 0,
                    pop1000 = 0;


                //Creates number of new firms for that year
                ages.forEach(function(age){

                    if(data[msaId][year][age] && (age == 0 || age == 1 || age == 2)){
                        newFirmSum = newFirmSum + data[msaId][year][age];
                    }
                })
                //Instead of share, want newFirmSum/(pop/1000)

                if(metroPop20002009[msaId] && metroPop20002009[msaId][year]){
                    pop = metroPop20002009[msaId][year].replace(/,/g , "");
                    pop = +pop;
                    pop1000 = (pop/1000);                   
                }
                else{
                    pop1000=0;
                }

                if(pop1000 == 0){
                    newPer1000 = 0;
                }
                else{
                    newPer1000 = newFirmSum/pop1000;
                }

                newPer1000 = upperLimit(newPer1000);

                curCoord["y"] = newPer1000;
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

        //Get only the fields we need
        var metroAreaData = scope.trimData(data);
        //Now arranged by MSAID -> Year -> Firm Age



        //Want an array with one object PER metro area
        //Object will look like: {values:[{x:1977,y:val}, {x:1978,y:val}....],key=msa,}
        //Convert the trimmed data into a set of (x,y) coordinates for the chart
        var chartData = scope.chartData(metroAreaData);


        //Add indexes to the objects themselves
        var finalData = scope.addIndex(chartData);

        return finalData;
    },
	renderGraph:function(){

    	//1 - New firms per 1000 people OVER TIME
        //One line per metro area -- line graph

        var scope = this;
        if(scope.state.loading){
            console.log('reloading')
            setTimeout(function(){ scope.renderGraph() }, 2000);
            
        
        }
        else{
	        //console.log("render graph in new employment line graph",scope.state.data);
            //Get rid of everything already in the svg
            d3.selectAll("svg").remove();        

            var data = scope.state.data;


            var margin = {top: 20, right: 40, bottom: 50, left: 75},
                width = window.innerWidth*.98 - margin.left - margin.right,
                height = window.innerHeight*.6 - margin.top - margin.bottom;

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

            var svg = d3.select("#NewFirmPer1000Graph").append("svg")
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
              .attr("dx","50em")
              .attr("dy","3em")
              .text("Year");

            svg.append("g")
              .attr("class", "y axis")
              .call(yAxis)
            .append("text")
              .attr("transform", "rotate(-90)")
              .attr("y", "-5em")
              .attr("dy", ".71em")
              .attr("x","-8em")
              .style("text-anchor", "end")
              .text("New Firms per 1000 people");

            var city = svg.selectAll(".city")
              .data(cities)
            .enter().append("g")
              .attr("class", "city");

            city.append("path")
              .attr("class", "line")
              .attr("d", function(d) { return line(d.values); })
              .style("stroke", function(d) { return color(d.msaId); })
              .style("fill","none");

            // city.append("text")
            //   .datum(function(d) { return {msaId: d.msaId, value: d.values[d.values.length - 1]}; })
            //   .attr("transform", function(d) { return "translate(" + x(d.value.x) + "," + y(d.value.y) + ")"; })
            //   .attr("x", 3)
            //   .attr("dy", ".35em")
            //   .text(function(d) { return d.x; });

            d3.select('#NewFirmPer1000Legend')
                .style('overflow',"scroll")
                .style('overflow-x',"hidden");


            var legSvg = d3.select('#NewFirmPer1000Legend')
                .append("svg")
                .attr("width",window.innerWidth*.98)
                .attr("height",scope.state.data.length*6)
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

module.exports = NewFirmPer1000Graph;
