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
            .translate([width / 2, height / 2]);


        var path = d3.geo.path()
            .projection(projection);


        var svg = d3.select("#mapDiv").append("svg")
            .attr("width", width)
            .attr("height", height);
console.log(msa);




        svg.append("path")
          .datum(topojson.feature(states,states["objects"]["states.geo"]))
          .style("fill","#333")
          .attr("d", path);

        svg.insert("path", ".graticule")
              .datum(topojson.mesh(states,states["objects"]["states.geo"], function(a, b) { return a !== b; }))
              .style("fill", "none")
              .style("stroke","#fff")
              .attr("d", path);


        svg.insert("path", ".graticule")
              .datum(topojson.feature(msa,msa["objects"]["fixMsa.geo"], function(a, b) { return a !== b; }))
              .style("fill", "#ff0000")
              .style("stroke","#fff")
              .attr("d", path)
              .on("click",click);


        function click(d){
            console.log(d);
        }
    },
    render:function() {
        var scope = this;

        return (
            <div className="container main">
                <h1> The Map </h1>

                <div id="mapDiv"></div>
            </div>
                
        );
    }
});

module.exports = Home;
