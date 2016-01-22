var React = require("react"),
	d3 = require("d3"),
	colorbrewer = require('colorbrewer'),
    metroPop20002009 = require("../utils/metroAreaPop2000_2009.json"),
    msaIdToName = require('../utils/msaIdToName.json'),
    abbrToFips = require('../utils/abbrToFips.json');


var ShareNewEmploymentByTimeGraph = React.createClass({
    getInitialState:function(){
        return {
            data:[],
            loading:true,
            group:"msa"
        }
    },
    getDefaultProps:function(){
        return({
            data:[],
            color:"population"
        })
    },
    componentWillMount:function(){
        var scope = this;
        console.log("mount",scope);
        scope.setState({data:scope.processData(scope.props.data),loading:false,group:scope.props.group});
    },
    componentWillReceiveProps:function(nextProps){
        var scope = this;
        console.log("recieving props",nextProps);
        scope.setState({data:scope.processData(scope.props.data),loading:false,group:nextProps.group});
    },
    processData:function(data){
        var scope = this;

        //Extract only the fields we need from the dataset
        var metroAreaData = scope.trimData(data);
        //Data Now arranged by MSAID -> Year -> Firm Age


        //Want an array with one object PER metro area
        //Object will look like: {values:[{x:1977,y:val}, {x:1978,y:val}....],key=msa,}
        //Convert the trimmed data into a set of (x,y) coordinates for the chart

        if(scope.state.group == "msa"){
            var chartData = scope.chartMsaData(metroAreaData);           
        }
        if(scope.state.group == "state"){
            var chartData = scope.chartStateData(metroAreaData);           
        }        
        //console.log("chartdata",chartData);


        //Add indexes to the objects themselves
        var finalData = scope.addIndex(chartData);

        return finalData;
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
    chartStateData:function(data){
        var scope = this,
            ages = d3.range(12),
            stateData = {};

        Object.keys(data).forEach(function(msaId){

            if(msaIdToName[msaId]){
                var state = msaIdToName[msaId].substr(msaIdToName[msaId].length - 2);    
                if(!stateData[state]){
                    stateData[state] = {msaArray:[]};
                }                 
                stateData[state]["msaArray"].push(msaId);
                //Iterating through every year within a metro area
                Object.keys(data[msaId]).forEach(function(year){
                    var totalEmploySum = 0,
                        newFirmSum = 0,
                        share = 0;

                    //Null check for state/year combo
                    if(!stateData[state][year]){
                        //If its new, default to 0
                        stateData[state][year] = {"totalEmploySum":0,"newFirmSum":0};
                    }

                    //Creates Total Employment number for that year
                    //Creates Employment in new firms for that year
                    ages.forEach(function(age){
                        if(data[msaId][year][age]){
                            stateData[state][year]["totalEmploySum"] = stateData[state][year]["totalEmploySum"] + data[msaId][year][age];                   
                        }
                        if(data[msaId][year][age] && (age == 0 || age == 1 || age == 2)){
                            stateData[state][year]["newFirmSum"] = stateData[state][year]["newFirmSum"] + data[msaId][year][age];
                        }
                    })

                })               
            }

        })

        var chartData = Object.keys(stateData).map(function(state){

            var valueArray = [];

            Object.keys(stateData[state]).forEach(function(year){

                if(year != "msaArray"){
                    var curCoord={"x":+year,"y":0},
                        share = 0;

                    share = stateData[state][year]["newFirmSum"]/stateData[state][year]["totalEmploySum"]       
                    curCoord["y"] = share;
                    //Want to return: x:year y:percent
                    valueArray.push(curCoord);
                }

            })

            return {key:state,values:valueArray,area:false,msaArray:stateData[state]["msaArray"]};                
            
        })


       
        return chartData;
    },
    chartMsaData:function(data){
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
            return {index:(+index),key:data[index].key,values:data[index].values,msaArray:data[index]["msaArray"]}
        })

        return indexedData;
    },
    colorGroup:function(){
        var scope = this;

        if(scope.state.group == "msa"){
            if(scope.props.color == "population"){
                var colorGroup = d3.scale.quantize()
                    .domain([50000,2500000])
                    .range(colorbrewer.YlOrRd[9]);
            }
            if(scope.props.color == "state"){
                var colorGroup = d3.scale.linear()
                    .domain([0,350,700])
                    .range(['red','green','blue']);
            }            
        }
        if(scope.state.group == "state"){
            if(scope.props.color == "population"){
                var colorGroup = d3.scale.quantize()
                    .domain([100000,10000000])
                    .range(colorbrewer.YlOrRd[9]);            
            }

            if(scope.props.color == "state"){
                var colorGroup = d3.scale.linear()
                    .domain([0,350,700])
                    .range(['red','green','blue']); 
            }
        
        }


        return colorGroup;

    },
    colorFunction:function(params){
        var scope = this,
            cityColor;

        var color = scope.colorGroup();

        if(scope.state.group == "msa"){
            if(scope.props.color == "population"){         
                if(metroPop20002009[params.key]){
                    var pop = metroPop20002009[params.key][2000].replace(/,/g , "");
                    cityColor = color(pop)
                }
                else{
                    cityColor = '#FFFFFF'
                }
            }
            if(scope.props.color == "state"){
                if(msaIdToName[params.key]){
                    var state = msaIdToName[params.key].substr(msaIdToName[params.key].length - 2);
                    var fips = abbrToFips[state] * 10;
                    cityColor = color(fips);
                }
                else{
                    cityColor = '#FFFFFF'                
                }
            }            
        }


        if(scope.state.group == "state"){
            if(scope.props.color == "state"){
                var fips = abbrToFips[params.key] * 10;
                cityColor = color(fips);               
            }
            if(scope.props.color == "population"){
                var totalPop = 0;

                if(params["msaArray"]){
                    params["msaArray"].forEach(function(msaId){
                        
                        if(metroPop20002009[msaId]){
                            totalPop = totalPop + +metroPop20002009[msaId][2000].replace(/,/g , "");        
                        }
                                            
                    })                    
                }

                if(totalPop > 0){
                    cityColor = color(totalPop)                    
                }
                else{
                    cityColor = '#FFFFFF'
                }
            }

        }


        return cityColor;

    },
	renderGraph:function(){

    	//1 - Share of employmment in new firms OVER TIME
        //One line per metro area -- line graph
        var percFormat = d3.format(".3%"),
            scope = this;

        var selected = "false";

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
                height = window.innerHeight*.4 - margin.top - margin.bottom;

            var voronoi = d3.geom.voronoi()
                .x(function(d) { return x(d.x); })
                .y(function(d) { return y(d.y); })
                .clipExtent([[-margin.left, -margin.top], [width + margin.right, height + margin.bottom]])


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
                .interpolate("cardinal")
                .x(function(d) { return x(d.x); })
                .y(function(d) { return y(d.y); });
  

            var svg = d3.select("#ShareNewEmploymentByTimeGraph").append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
              .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


            var cities = Object.keys(data).map(function(metroArea){

                if(scope.state.group == "msa"){
                    
                    var city = {
                        values:null,
                        index:data[metroArea].index,
                        name:msaIdToName[data[metroArea].key],
                        key:data[metroArea].key
                    }

                    city.values = data[metroArea].values.map(function(i){
                        return {
                            city:city,
                            x:i.x,
                            y:i.y
                        }
                    })
              
                }
                else{
                    var city = {
                        values:null,
                        index:data[metroArea].index,
                        msaArray:data[metroArea].msaArray,
                        key:data[metroArea].key
                    }

                    city.values = data[metroArea].values.map(function(i){
                        return {
                            city:city,
                            x:i.x,
                            y:i.y
                        }
                    })
                }
                return city;
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


            svg.append("g")
                  .attr("class", "cities")
                .selectAll("path")
                  .data(cities)
                .enter()
                  .append("path")
                    .attr("d", function(d) { d.line = this; return line(d.values); })
                    .style("stroke", function(d) {return scope.colorFunction(d);})
                    .style("fill","none");



            var focus = svg.append("g")
                  .attr("transform", "translate(-100,-100)")
                  .attr("class", "focus");

                focus.append("circle")
                  .attr("r", 3.5);

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
                        .key(function(d) {return x(d.x) + "," + y(d.y); })
                        .rollup(function(v) { return v[0]; })
                        .entries(d3.merge(cities.map(function(d) { return d.values; })) )
                        .map(function(d) { return d.values; })))
                .enter().append("path")
                    .attr("d", function(d) { return "M" + d.join("L") + "Z"; })
                    .datum(function(d) { return d.point; })
                    .on("mouseover", mouseover)
                    .on("mouseout", mouseout)
                    .on("click",click);


            function mouseover(d) {
                d3.select(d.city.line).style("stroke-width","2.5")
                d3.select(d.city.line).style("stroke","#000000")

                var popText = "",
                    name;
                if(scope.state.group == "msa"){
                    name = d.city.name;
                }
                else{
                    name = d.city.key;
                }

                popText += name + ' | ' + d.x +':  '+ percFormat(d.y);

                d.city.line.parentNode.appendChild(d.city.line);
                focus.attr("transform", "translate(" + x(d.x) + "," + y(d.y) + ")");
                focus.select("text").text(popText);
            }

            function click(d){
                d3.select("#hoverRow").remove();
                var years = d3.range(1977,2013);
     
                years.unshift("Name");
                years.unshift("Color");

                console.log("d.city",d.city);


                var table = d3.select("#currentRow").append("table")
                            .attr("id","hoverRow")
                            .attr("class", "table table-hover"),
                        thead = table.append("thead"),
                        tbody = table.append("tbody");

                // append the header row
                thead.append("tr")
                    .selectAll("th")
                    .data(years)
                    .enter()
                    .append("th")
                        .text(function(column) {if(column==1977){return "Year " +column}else{return column;}  });

                // create 1 row
                var rows = tbody.append("tr")
                    .selectAll("tr");

                var color = [{
                    0:{
                        float:"left",
                        height:38,
                        width:10,
                        backgroundColor:scope.colorFunction(d.city)
                    }
                }]

                var colorCell = rows.select("td")
                    .data(color)
                    .enter()
                    .append("td")
                    .attr("class", "col-md-5")
                    .style("background",function(v){return v[0].backgroundColor})
                    .style("min-width",'50px')
                    .style("height",function(v){return v[0].height});

                var name = [{0:d.city.name}];

                var nameCell = rows.select("td")
                    .data(name)
                    .enter()
                    .append("td")
                    .attr("class", "col-md-5")
                    .text(function(v){console.log("djdfhsjkf",v); return v[0]})
                    .style("min-width",'170px');




                // create a cell in each row for each column
                var cells = rows.select("td")
                    .data(d.city.values)
                    .enter()
                    .append("td")
                    .attr("class", "col-md-5")
                        .text(function(d) {return percFormat(d.y); });
                
                console.log(d3.select("#hoverRow")[0][0]);
            }


            function mouseout(d) {                              

                d3.select(d.city.line).style("stroke-width","1")
                d3.select(d.city.line).style("stroke",function(d){return scope.colorFunction(d)})

                focus.attr("transform", "translate(-100,-100)");
            }
        $('#currentRow').on('scroll', function () {
            $('#tableDiv').scrollLeft($(this).scrollLeft());
        });

        $('#tableDiv').on('scroll', function () {
            $('#currentRow').scrollLeft($(this).scrollLeft());
        });  

        }

	},
    renderTable:function(){

        var scope = this,
            data = scope.state.data,
            years = d3.range(1977,2013),
            commaFormat = d3.format(","),
            percFormat = d3.format(".3%");



        var cities = Object.keys(data).map(function(metroArea){

            if(scope.state.group == "msa"){
                return {
                    index:data[metroArea].index,
                    name:msaIdToName[data[metroArea].key],
                    values:data[metroArea].values,
                    color:scope.colorFunction(data[metroArea])
                }                
            }
            else{
                return {
                    index:data[metroArea].index,
                    name:data[metroArea].key,
                    values:data[metroArea].values,
                    color:scope.colorFunction(data[metroArea])
                }
            }

        });



        var allRows = cities.map(function(metroArea){


            //Will return the y value for each year of a metro area
            var yearValues = metroArea.values.map(function(firmValues){
                return (<td className="col-md-5">{percFormat(firmValues.y)}</td>)
            })



            var colorStyle = {
                background:metroArea.color,
                minWidth:50
            }


            return(<tr><td style={colorStyle}className="col-md-5"></td><td className="col-md-5" style={{minWidth:170}}>{metroArea.name}</td>{yearValues}</tr>)

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
                    <table id="fullTable" className="table table-hover" fixed-header>
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
            overflowX:'hidden',
            overflowY:'scroll',
            height:window.innerHeight*.4,
            width:window.innerWidth
        }

        var rowStyle = {
            overflowY:'hidden',
            overflowX:'scroll',
            height:window.innerHeight*.2,
            width:window.innerWidth
        }

		return (
            <div>
                <div id="currentRow" style={rowStyle}>

                </div>
    			<div id="tableDiv" style = {tableStyle} >
                    {table}
    			</div>
            </div>
		);
	}
	
});

module.exports = ShareNewEmploymentByTimeGraph;
