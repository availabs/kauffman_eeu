var React = require("react"),
    d3 = require("d3"),
    metroPop20002009 = require("../utils/metroAreaPop2000_2009.json"),
    msaIdToName = require('../utils/msaIdToName.json'),
    RankTable = require('../graphs/RankTable.react'),
    abbrToFips = require('../utils/abbrToFips.json');

var LineGraph = React.createClass({
    getInitialState:function(){
        return {
            extent:[363,0],
            plot:"rank"
        }
    },
    getDefaultProps:function(){
        return({
            data:[],
            graph:"composite"
        })
    },
    renderGraph:function(){

        //1 - Share of employmment in new firms OVER TIME
        //One line per metro area -- line graph
        var percFormat = d3.format(".3%"),
            scope = this;

        var selected = "false";

        if(scope.props.data.length == 0){
            console.log('reloading')
            setTimeout(function(){ scope.renderGraph() }, 2000);
        }
        else{
            //Get rid of everything already in the svg
            d3.selectAll("svg").remove();
            var data = scope.props.data;

            console.log("render graph",data);


            var filteredData = [];
            filteredData = data.filter(function(city){
                var withinBounds;

                city.values.forEach(function(yearVal){
                    if(yearVal.x == 2009){
                        if(yearVal.rank <= scope.state.extent[0] && yearVal.rank >= scope.state.extent[1]){
                            withinBounds = true;
                        }
                        else{
                            withinBounds = false;
                        }
                    }
                })

                if(withinBounds){
                    return city;
                }

            })

            console.log(data);

            var margin = {top: 100, right: 40, bottom: 50, left: 55},
                width = window.innerWidth*.98 - margin.left - margin.right,
                height = window.innerHeight - margin.top - margin.bottom;


            if(scope.state.plot == "rank"){
                var voronoi = d3.geom.voronoi()
                    .x(function(d) { return x(d.x); })
                    .y(function(d) { return y(d.rank); })
                    .clipExtent([[-margin.left, -margin.top], [width + margin.right, height + margin.bottom]])

                var y = d3.scale.linear()
                    .range([0,height]);


                var yBrush = d3.scale.linear()
                    .range([0,height]);

                yBrush.domain([0,363]);

                y.domain([scope.state.extent[1],scope.state.extent[0]]);

            }
            else{
                var voronoi = d3.geom.voronoi()
                    .x(function(d) { return x(d.x); })
                    .y(function(d) { return y(d.y); })
                    .clipExtent([[-margin.left, -margin.top], [width + margin.right, height + margin.bottom]])

            var y = d3.scale.linear()
                .range([0,height]);


            var yBrush = d3.scale.linear()
                .range([0,height]);

            yBrush.domain([0,363]);

            y.domain([scope.state.extent[1],scope.state.extent[0]]);
            }








            var x = d3.scale.ordinal()
                .domain(d3.range(
                    [d3.min(filteredData, function(c) { return d3.min(c.values, function(v) { return v.x }); })],
                    [d3.max(filteredData, function(c) { return d3.max(c.values, function(v) { return v.x }); })+1]
                    ))
                .rangeRoundBands([0,width]);

            var xTangent = 40; // Length of Bézier tangents to control curve.

            if(scope.state.plot == "rank"){
                var line = function line(d) {
                  var path = [];
                    var once = 0;
                  x.domain().slice(1).forEach(function(b, i) {
                    var a = x.domain()[i];

                    if(once < 2){
                        //console.log(curve(a, b, i, d))
                        once++;
                    }
                    path.push("L", x(a), ",", y(d[i].rank), "h", x.rangeBand(), curve(a, b, i, d));
                  });
                  path[0] = "M";
                  path.push("h", x.rangeBand());
                  return path.join("");
                }

                var curve = function curve(a, b, i, d) {
                  return "C" + (x(a) + xTangent + x.rangeBand()) + "," + y(d[i].rank)+ " "
                      + (x(b) - xTangent) + "," + y(d[i+1].rank) + " "
                      + x(b) + "," + y(d[i+1].rank);
                }            
            }
            else{
                var line = function line(d) {
                  var path = [];
                    var once = 0;
                  x.domain().slice(1).forEach(function(b, i) {
                    var a = x.domain()[i];

                    if(once < 2){
                        //console.log(curve(a, b, i, d))
                        once++;
                    }
                    path.push("L", x(a), ",", y(d[i].y), "h", x.rangeBand(), curve(a, b, i, d));
                  });
                  path[0] = "M";
                  path.push("h", x.rangeBand());
                  return path.join("");
                }

                var curve = function curve(a, b, i, d) {
                  return "C" + (x(a) + xTangent + x.rangeBand()) + "," + y(d[i].y)+ " "
                      + (x(b) - xTangent) + "," + y(d[i+1].y) + " "
                      + x(b) + "," + y(d[i+1].y);
                }                 
            }





                
            var xAxis = d3.svg.axis()
                .scale(x)
                .orient("bottom");

            var yAxis = d3.svg.axis()
                .scale(y)
                .orient("left");




            var svg = d3.select("#rankGraph").append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
              .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");



            filteredData.sort(function(a,b){

                return b.values[0].rank - a.values[0].rank
            })
   


            //For each city
            //Draw a path from (x1,y1) to (x2,y2)
            //Where x goes from year[0] to year[end]


            filteredData.forEach(function(b,i){

                    svg.append("g")
                        .append("path")
                        .attr("d",function(){b.border = this; return line(b.values)})
                        .style("stroke","black")
                        .style("stroke-width",((height)/(y.domain()[1]-y.domain()[0]))-1)
                        .style("fill","none")
                        .style("opacity",".4");     

                svg.append("g")
                        .append("path")
                        .attr("class","cities")
                        .attr("d",function(){b.line = this; return line(b.values)})
                        .style("stroke",b.color)
                        .style("stroke-width",((height-85)/(y.domain()[1]-y.domain()[0]))-2)
                        .style("fill","none")
                        .style("opacity",".6");                    
                


            })


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
                        .key(function(d) { return x(d.x) + "," + y(d.y); })
                        .rollup(function(v) { return v[0]; })
                        .entries(d3.merge(filteredData.map(function(d) { return d.values; })) )
                        .map(function(d) { return d.values; })))
                .enter().append("path")
                    .attr("d", function(d) { return "M" + d.join("L") + "Z"; })
                    .datum(function(d) { return d.point; })
                    .on("mouseover", mouseover)
                    .on("mouseout", mouseout)
                    .on("click",click);


            function mouseover(d) {
                d3.select(d.city.line).style("stroke-width",( (height/(y.domain()[1]-y.domain()[0]) )+1))
                d3.select(d.city.line).style("stroke","#000000")
                d3.select(d.city.line).style("opacity","1")

                var popText = "",
                    name;

                    name = d.city.name;
               

                if(scope.state.plot == "rank"){
                    popText += name + ' | ' + d.x +':  '+ d.rank;                    
                }
                else{
                    popText += name + ' | ' + d.x +':  '+ d.y;
                }


                d.city.line.parentNode.appendChild(d.city.line);
                focus.attr("transform", "translate(100,-25)");
                focus.select("text").text(popText);
            }

            function click(d){
                d3.select("#hoverRow").remove();
                d3.select("#hoverRowLock").remove();
                var years = d3.range(1977,2013);
     


                console.log("d.city",d.city);


                var table = d3.select("#currentRowScroll").append("table")
                            .attr("id","hoverRow")
                            .attr("class", "table table-hover")
                            .style("margin","0px"),
                        thead = table.append("tbody"),
                        tbody = table.append("tbody");



                // create 1 row
                var rows = tbody.append("tr")
                    .selectAll("tr");


                // create a cell in each row for each column
                var cells = rows.select("td")
                    .data(d.city.values)
                    .enter()
                    .append("td")
                        .text(function(d) {return d.rank; })
                        .style("min-width",'150px')
                        .style("height",'60px');
                
                console.log(d3.select("#hoverRow")[0][0]);



                var tableLock = d3.select("#currentRowLock").append("table")
                            .attr("id","hoverRowLock")
                            .attr("class", "table table-hover")
                            .style("margin","0px"),
                        theadLock = tableLock.append("tbody"),
                        tbodyLock = tableLock.append("tbody");

       



               // create 1 row
                var rowsLock = tbodyLock.append("tr")
                    .selectAll("tr");

                var color = [{
                    0:{
                        float:"left",
                        height:38,
                        width:10,
                        backgroundColor:d.city.color
                    }
                }]

                var colorCell = rowsLock.select("td")
                    .data(color)
                    .enter()
                    .append("td")
                    .style("background",function(v){return v[0].backgroundColor})
                    .style("min-width",'150px')
                    .style("height",'60px');  


                var nameLock = [{0:d.city.name}];

                var nameCellLock = rowsLock.select("td")
                    .data(nameLock)
                    .enter()
                    .append("td")
                    .text(function(v){return v[0]})
                    .style("min-width",'150px')
                    .style("height",'60px');

            }


            function mouseout(d) {                              
                d3.select(d.city.line).style("stroke-width",( ((height-74)/(y.domain()[1]-y.domain()[0])-2 )))
                d3.select(d.city.line).style("stroke",function(){return d.city.color})
                d3.select(d.city.line).style("opacity",".6")
                focus.attr("transform", "translate(-100,-100)");
            }


            if(scope.props.group == "state"){
                var startValue = scope.state.extent[1];
                var endValue = scope.state.extent[0];             
            }
            else{
                var startValue = scope.state.extent[1];
                var endValue = scope.state.extent[0];                
            }



            var brush = d3.svg.brush()
                .y(yBrush)
                .extent([startValue, endValue])
                .on("brushstart", brushstart)
                .on("brush", brushmove)
                .on("brushend", brushend);

            var arc = d3.svg.arc()
                    .outerRadius((width / 128))
                    .startAngle(0)
                    .endAngle(function(d, i) { return i ? -Math.PI : Math.PI; });





            var brushg = svg.append("g")
                .attr("class", "brush")
                .attr("transform", "translate("+(width+20)+",0)")
                .call(brush);  

            brushg.selectAll(".resize").append("path")
                .attr("transform", "translate(0," +  (width / 256) + ")")
                .attr("transform", "rotate(-90)")
                .attr("d", arc);


            brushg.selectAll("rect")
                .attr("transform","translate(-11,0)")
                .attr("width",22);

            brushstart();

            function brushstart() {
                svg.classed("selecting", true);
            }    

            function brushmove() {
                var s = brush.extent();
            }            

            function brushend() {
                var s = brush.extent();


               
                brush.extent([Math.round(s[1]),Math.round(s[0])])(d3.select(this));
                
                s = brush.extent();
                scope.setState({extent:[Math.round(s[0]),Math.round(s[1])]})
                


                svg.classed("selecting", !d3.event.target.empty());
            }

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
              .attr("dy", "2em")
              .attr("x","-15em")
              .style("text-anchor", "end")
              .text("Rank");            

        }

    },
    resetBrush:function(){
        var scope = this;

        var extent = [363,0];            
        

        scope.setState({extent:extent})
    },
    render:function() {
        var scope = this;

        d3.selectAll("svg").remove();

        var tables;
        console.log("linegraph render state",scope.state);
        var rowStyle = {
            overflow:'hidden'
        }

        var tableStyle = {
            overflow:'hidden',
            height:window.innerHeight*.4 - 10,
            width:window.innerWidth
        }

        var lockStyle = {
            width:window.innerWidth*.1 - 50,
            float:'left',
            display:'inline-block',
            paddingRight:'300px'
        }

        var scrollStyle = {
            display:'inline-block' ,
            width:window.innerWidth*.8 - 50         
        }

        var divStyle = {
            width:window.innerWidth*.8 - 50
        }

        var currentRowStyle = {
            width:window.innerWidth
        }
            var buttonStyle = {
            marginTop:'10px',
            marginLeft:'10px'
        }
        if(scope.props.data.length != 0){
            scope.renderGraph();
            return (
                <div>
                    <h3>Rankings</h3>
                    <div id="rankGraph"><button  style={buttonStyle}className="btn" onClick={scope.resetBrush}>Reset Brush Filter</button></div>
                    <div>
                        <div style = {currentRowStyle}>
                            <div style={lockStyle} id="currentRowLock"></div>
                            <div style={scrollStyle} id="currentRowScroll" style={rowStyle}></div>
                        </div>
                        
                    </div>
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






module.exports = LineGraph;