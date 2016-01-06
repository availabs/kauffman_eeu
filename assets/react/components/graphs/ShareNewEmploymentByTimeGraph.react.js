var React = require("react"),
	d3 = require("d3"),
	colorbrewer = require('colorbrewer'),
    metroPop20002009 = require("../utils/metroAreaPop2000_2009.json"),
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
            d3.selectAll("svg").remove();
            var data = scope.state.data;

            var margin = {top: 20, right: 40, bottom: 50, left: 75},
                width = window.innerWidth*.98 - margin.left - margin.right,
                height = window.innerHeight*.6 - margin.top - margin.bottom;


            var x = d3.scale.linear()
                .range([0, width]);

            var y = d3.scale.linear()
                .range([height, 0]);



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



            var color = d3.scale.quantize()
                .domain([50000,1500000])
                .range(colorbrewer.YlOrRd[9]);

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
              .attr("x","-6em")
              .style("text-anchor", "end")
              .text("Share of Employment in New Firms");


            var city = svg.selectAll(".city")
              .data(cities)
            .enter().append("g")
              .attr("class", "city");

            city.append("path")
              .attr("class", "line")
              .attr("d", function(d) { return line(d.values); })
              .style("stroke", function(d) { 
                    var cityColor = '';

                    if(metroPop20002009[d.msaId]){
                        var pop = metroPop20002009[d.msaId][2000].replace(/,/g , "");
                        cityColor = color(pop)
                    }
                    else{
                        cityColor = '#FFFFFF'
                    }
                return cityColor; 
                })
              .style("fill","none");

            city.append("text")
              .datum(function(d) { return {msaId: d.msaId, value: d.values[d.values.length - 1]}; })
              .attr("transform", function(d) { return "translate(" + x(d.value.x) + "," + y(d.value.y) + ")"; })
              .attr("x", 3)
              .attr("dy", ".35em")
              .text(function(d) { return d.x; });
           

        }

	},
    renderTable:function(){

        var scope = this,
            data = scope.state.data,
            years = d3.range(1977,2013),
            commaFormat = d3.format(","),
            percFormat = d3.format(".3%");

            var color = d3.scale.quantize()
                .domain([50000,1500000])
                .range(colorbrewer.YlOrRd[9]);

        var cities = Object.keys(data).map(function(metroArea){

            var cityColor = '';
            if(metroPop20002009[data[metroArea].key]){
                var pop = metroPop20002009[data[metroArea].key][2000].replace(/,/g , "");
                cityColor = color(pop)
            }
            else{
                cityColor = '#FFFFFF'
            }


            return {
                index:data[metroArea].index,
                name:msaIdToName[data[metroArea].key],
                msaId:data[metroArea].key,
                values:data[metroArea].values,
                color:cityColor
            }
        });



        var allRows = cities.map(function(metroArea){


            //Will return the y value for each year of a metro area
            var yearValues = metroArea.values.map(function(firmValues){
                return (<td className="col-md-1">{percFormat(firmValues.y)}</td>)
            })



            var colorStyle = {
                float:"left",
                height:38,
                width:10,
                backgroundColor:metroArea.color
            }



            //Row has color - name - values

            return(<tr><td className="col-md-1"><div style={colorStyle}></div></td><td className="col-md-1">{metroArea.name}</td>{yearValues}</tr>)

        });

        var yearHead = years.map(function(year){
            if(year == 1977){
                return(<th>Year: <br/>{year}</th>)               
            }
            else{
                return(<th>{year}</th>)
            }

        })


        //Full table
        var table = (
                    <table className="table table-hover" fixed-header>
                        <thead>
                            <tr>
                                <th>
                                Color
                                </th>
                                <th>
                                Name
                                </th>
                                {yearHead}
                            </tr>
                        </thead>
                        <tbody>
                            {allRows}
                        </tbody>
                    </table>
                    )

        return table;
    },
	render:function() {
		var scope = this,
            table;

        if(scope.state.data != []){
          scope.renderGraph();
          table = scope.renderTable();
        }

        var tableStyle = {
            overflow:'scroll',
            height:'400px',
            width:'100%'
        }

		return (
			<div style = {tableStyle} >
            {table}
			</div>
		);
	}
	
});

module.exports = ShareNewEmploymentByTimeGraph;
