"use strict"
var React = require("react"),
    d3 = require("d3"),
    topojson = require("topojson"),
    states = require("../components/utils/states.topo.js"),
    msa = require("../components/utils/msa.topo.js");

var backColor = "#DCDCDC",
    msaColor = "#7EC0EE";


var Home = React.createClass({

    getInitialState:function(){
        return {};
    },
    componentDidMount:function(){
        var scope = this;
        scope.renderGraph();
    },
    renderGraph:function(){
        var scope = this;

        var width = 960,
            height = 600;



        var projection = d3.geo.albersUsa()
            .scale(1000)
            .translate([width / 2.5, height / 2.5]);


        var path = d3.geo.path()
            .projection(projection);


        var svg = d3.select("#mapDiv").append("svg")
            .attr("width", width)
            .attr("height", height);


        svg.append("path")
          .datum(topojson.feature(states,states["objects"]["states.geo"]))
          .style("fill",backColor)
          .attr("d", path);

        svg.insert("path", ".graticule")
              .datum(topojson.mesh(states,states["objects"]["states.geo"], function(a, b) { return a !== b; }))
              .style("fill", "none")
              .style("stroke","#fff")
              .attr("d", path);


        svg.selectAll("path", ".msa")
              .data(topojson.feature(msa,msa["objects"]["fixMsa.geo"]).features)
              .enter().append('path')
              .attr("class","msa")
              .attr("id",function(d){return "msa"+d.properties.CBSAFP;})
              .style("fill", msaColor)
              .style("stroke","#fff")
              .attr("d", path)
              .on('click',click);

          
        function click(d){
            console.log(d3.select("#msaLegendContent"));
            console.log(d);
            d3.select("#msaLegendContent")[0][0].textContent = "Name: " + d.properties.NAME;
        }

    },
    render:function() {
        var scope = this;

        var legendStyle = {
          float:'left',
          width:'18%',
          height:'300px',
          boxShadow:'2px 2px' + backColor,
          paddingLeft:'10px',
          paddingTop:'2px',
          paddingRight:'10px',
          paddingBottom:'2px',
          marginLeft:'40px',
          marginRight:'200px',
          marginTop:'15px',
          background:backColor,
          color:"#black"
        }

        var headerStyle = {
          textAlign:'center',
          marginBottom:'0px',
          borderBottom:'2px solid black'
        }

        var contentStyle={
          marginTop:'5px'
        }

        return (
            <div>
                <div id="msaLegend" style={legendStyle}>
                  <div id="msaLegendHeader" style={headerStyle}><h4>Metropolitan Statistical Area</h4></div>
                  <div id="msaLegendContent" style={contentStyle}></div>
                </div>
                <div id="mapDiv"></div>
            </div>
                
        );
    }
});

module.exports = Home;
