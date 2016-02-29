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
    componentWillUpdate:function(nextProps,nextState){
        var scope = this;


        if(nextProps.graph.slice(-9) == "Composite"){
            nextState.plot = "rank";
        }


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





            var filteredData = [];



            var margin = {top: 100, right: 40, bottom: 50, left: 55},
                width = window.innerWidth*.98 - margin.left - margin.right,
                height = window.innerHeight - margin.top - margin.bottom;


            if(scope.state.plot == "rank"){

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


                var voronoi = d3.geom.voronoi()
                    .x(function(d) { return x(d.x); })
                    .y(function(d) { return y(d.rank); })
                    .clipExtent([[-margin.left, -margin.top], [width + margin.right, height + margin.bottom]])

                var y = d3.scale.linear()
                    .range([0,height]);


                var yBrush = d3.scale.linear()
                    .range([0,height]);

                yBrush.domain([0,d3.max(scope.props.data, function(c) { return d3.max(c.values, function(v) { return v.rank }); })]);

                y.domain([scope.state.extent[1],scope.state.extent[0]]);

            }
            else{

                filteredData = data.filter(function(city){
                    var withinBounds;

                    city.values.forEach(function(yearVal){
                        if(yearVal.x == 2009){
                            if(yearVal.y >= scope.state.extent[0] && yearVal.y <= scope.state.extent[1]){
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

                var voronoi = d3.geom.voronoi()
                    .x(function(d) { return x(d.x); })
                    .y(function(d) { return y(d.y); })
                    .clipExtent([[-margin.left, -margin.top], [width + margin.right, height + margin.bottom]])

                var y = d3.scale.linear()
                .range([height,0]);


                var yBrush = d3.scale.linear()
                .range([height,0]);



                yBrush.domain([d3.min(filteredData, function(c) { return d3.min(c.values, function(v) { return v.y }); }),d3.max(scope.props.data, function(c) { return d3.max(c.values, function(v) { return v.y }); })]);

                y.domain([scope.state.extent[0],scope.state.extent[1]]);
            }





            if(scope.state.plot == "rank"){

                var x = d3.scale.ordinal()
                    .domain(d3.range(
                        [d3.min(filteredData, function(c) { return d3.min(c.values, function(v) { return v.x }); })],
                        [d3.max(filteredData, function(c) { return d3.max(c.values, function(v) { return v.x }); })+1]
                        ))
                    .rangeRoundBands([0,width]);

                var xTangent = 40; // Length of Bézier tangents to control curve.

                var line = function line(d) {
                  var path = [];
                    var once = 0;

                  x.domain().slice(1).forEach(function(b, i) {
                    var a = x.domain()[i];

                    if(once < 2){
                        //console.log(curve(a, b, i, d))
                        once++;
                    }
                    if(d[i+1] != undefined){
                        path.push("L", x(a), ",", y(d[i].rank), "h", x.rangeBand(), curve(a, b, i, d));    
                    }
                    
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



                var heightVal = y.domain()[1]-y.domain()[0];


            }
            else{
                var x = d3.scale.linear()
                    .range([0, width]);

                x.domain([
                    d3.min(data, function(c) { return d3.min(c.values, function(v) { return v.x }); }),
                    d3.max(data, function(c) { return d3.max(c.values, function(v) { return v.x }); })
                ]);

                var line = d3.svg.line()
                    .interpolate("cardinal")
                    .x(function(d) { return x(d.x); })
                    .y(function(d) { return y(d.y); });


                heightVal = 200             
            }




                
            var xAxis = d3.svg.axis()
                .scale(x)
                .orient("bottom");

            var yAxis = d3.svg.axis()
                .scale(y)
                .orient("left");

            var yAxisBrush = d3.svg.axis()
                .scale(yBrush)
                .orient("right");


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
                        .style("stroke-width",((height)/(heightVal))-1.5)
                        .style("fill","none")
                        .style("opacity",".4");     

                svg.append("g")
                        .append("path")
                        .attr("class","cities")
                        .attr("d",function(){b.line = this; return line(b.values)})
                        .style("stroke",b.color)
                        .style("stroke-width",((height-85)/(heightVal))-2)
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
                    .attr("d", function(d) { if(d!=undefined){return "M" + d.join("L") + "Z"}; })
                    .datum(function(d) { if(d!=undefined){return d.point}; })
                    .on("mouseover", mouseover)
                    .on("mouseout", mouseout)
                    .on("click",click);


            function mouseover(d) {
                d3.select(d.city.line).style("stroke-width",( (height/(heightVal) )+1))
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
                d3.select(d.city.line).style("stroke-width",( ((height-74)/(heightVal)-2 )))
                d3.select(d.city.line).style("stroke",function(){return d.city.color})
                d3.select(d.city.line).style("opacity",".6")
                focus.attr("transform", "translate(-100,-100)");
            }

                var startValue = scope.state.extent[1];
                var endValue = scope.state.extent[0];             



            var brush = d3.svg.brush()
                .y(yBrush)
                .extent([startValue, endValue])
                .on("brushstart", brushstart)
                .on("brush", brushmove)
                .on("brushend", brushend);

            var arc = d3.svg.arc()
                    .outerRadius(20)
                    .startAngle(0)
                    .endAngle(function(d, i) { return i ? -Math.PI : Math.PI; });





            var brushg = svg.append("g")
                .attr("class", "brush")
                .attr("transform", "translate("+(width+20)+",0)")
                .call(brush)
                .style("opacity",".4");  

            brushg.selectAll(".resize").append("path")
                .attr("transform", "rotate(-90)")
                .attr("d", arc);


            brushg.selectAll("rect")
                .attr("transform","translate(-20,0)")
                .attr("width",40);

            brushstart();

            function brushstart() {
                svg.classed("selecting", true);
            }    

            function brushmove() {
                var s = brush.extent();
            }            

            function brushend() {
                var s = brush.extent();



                
                

                if(scope.state.plot == "rank"){

brush.extent([Math.round(s[1]),Math.round(s[0])])(d3.select(this));
                s = brush.extent();
                scope.setState({extent:[Math.round(s[0]),Math.round(s[1])]})                      
                }
                else{

brush.extent([s[1],s[0]])(d3.select(this));
                s = brush.extent();

                scope.setState({extent:[s[1],s[0]]})                            
                }              


                


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

            svg.append("g")
              .attr("class", "y axis")
              .attr("transform","translate("+width+",0)")
              .call(yAxisBrush)
            .append("text")
              .attr("transform", "rotate(-90)")
              .attr("y", "-5em")
              .attr("dy", "2em")
              .attr("x","-15em")          

        }

    },
    resetBrush:function(){
        var scope = this;


        if(scope.state.plot == "rank"){
            var extent = [d3.max(scope.props.data, function(c) { return d3.max(c.values, function(v) { return v.rank }); }),0]              
        }
        else{
            var extent = [d3.min(scope.props.data, function(c) { return d3.min(c.values, function(v) { return v.y }); }),d3.max(scope.props.data, function(c) { return d3.max(c.values, function(v) { return v.y }); })]            
        }
         
        
        console.log("reset",extent)
        scope.setState({extent:extent})
    },
    toggleRankValue:function(e){
        console.log("toggle rank/val");
        var scope = this;


        var valButton = d3.select('#valueButton');
        var rankButton = d3.select('#rankButton')
        var activeButton;

        if(valButton.attr("class") == "btn btn-danger"){
            valButton.attr("class","btn btn-success") 
            var active = valButton.attr('id');
        }
        else{
            valButton.attr("class","btn btn-danger"); 
        }

        if(rankButton.attr("class") == "btn btn-danger"){
            rankButton.attr("class","btn btn-success");
            var active = rankButton.attr('id');
        }
        else{
            rankButton.attr("class","btn btn-danger");
        }

        if(active == 'rankButton'){
            //scope.setState({plot:'rank',extent:[363,0]});
            var extent = [d3.max(scope.props.data, function(c) { return d3.max(c.values, function(v) { return v.rank }); }),0]
            scope.setState({plot:'rank',extent:extent})

        }
        else{

            var extent = [0,d3.max(scope.props.data, function(c) { return d3.max(c.values, function(v) { return v.y }); })]

            scope.setState({plot:'value',extent:extent})

        }



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
            width:window.innerWidth*.8-50
        }
            var buttonStyle = {
            marginTop:'10px',
            marginLeft:'10px'
        }

        var rankButton;
        var valueButton;

        if(scope.props.graph.slice(-9) != "Composite"){
            valueButton = (
                <button id="valueButton" style={buttonStyle} className="btn btn-danger" onClick={scope.toggleRankValue}>Value</button>
                )

            rankButton = (
                <button id="rankButton" style={buttonStyle} className="btn btn-success" onClick={scope.toggleRankValue}>Rank</button>
                )            
        }






        if(scope.props.data.length != 0){
            scope.renderGraph();
            return (
                <div>
                    <h3>Rankings</h3>
                    <div id="rankGraph"><button  style={buttonStyle}className="btn" onClick={scope.resetBrush}>Reset Brush Filter</button>{valueButton}{rankButton}</div>
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