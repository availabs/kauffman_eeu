"use strict"
var React = require("react"),
    d3 = require("d3"),
    topojson = require("topojson"),
    states = require("../components/utils/states.topo.js"),
    msa = require("../components/utils/msa.topo.js");

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
            .translate([width / 2, height / 2.5]);


        var path = d3.geo.path()
            .projection(projection);


        var svg = d3.select("#mapDiv").append("svg")
            .attr("width", width)
            .attr("height", height);


        svg.append("path")
          .datum(topojson.feature(states,states["objects"]["states.geo"]))
          .style("fill","#333")
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
              .style("fill", "#ff0000")
              .style("stroke","#fff")
              .attr("d", path)
              .on('click',click);


console.log(topojson.feature(msa,msa["objects"]["fixMsa.geo"]))


          
        function click(d){
            console.log(d);
        }

    },
    render:function() {
        var scope = this;

        return (
            <div className="container main">
                <div id="mapDiv"></div>
            </div>
                
        );
    }
});

module.exports = Home;
