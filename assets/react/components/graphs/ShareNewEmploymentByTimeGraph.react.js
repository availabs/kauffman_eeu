var React = require("react"),
	d3 = require("d3"),
    $lime = "#8CBF26",
    $red = "#e5603b",
    $redDark = "#d04f4f",
    $blue = "#6a8da7",
    $green = "#56bc76",
    $orange = "#eac85e",
    $pink = "#E671B8",
    $purple = "#A700AE",
    $brown = "#A05000",
    $teal = "#4ab0ce",
    $gray = "#666",
    $white = "#fff",
    $textColor = $gray,
    COLOR_VALUES = [$green, $teal, $redDark,  $blue, $red, $orange,  ];
	nv = require("nvd3");


var ShareNewEmploymentByTimeGraph = React.createClass({
    getInitialState:function(){
        return {
            curChart:"line",
            data:[],
            loading:true
        }
    },
    getDefaultProps:function(){
        return {"msa":"10580"};
    },
    componentWillReceiveProps:function(nextProps){
        var scope = this;

        //console.log("ShareNewEmploymentByTimeGraph",nextProps);
        scope.getData(nextProps.msa,function(data){
            scope.setState({data:scope.processData(data),loading:false});
        })
    },
    componentDidMount:function(){
        var scope = this;

        scope.getData(scope.props.msa,function(data){
            scope.setState({data:scope.processData(data),loading:false});
        })
    },
    getData:function(msaId,cb){
        var scope = this,
            url = "http://bds.availabs.org",
            path = "/firm/age/msa";

        d3.json("/getMsa/"+msaId,function(err,data){
            return cb(data);  
        })

    },
    processData:function(data){
        var scope = this,
            yearAgeTable = {},
            totalEmploySum = 0,
            newFirmSum = 0,
            graphData=[];


        Object.keys(data).forEach(function(item){
            data[item][scope.props.msa].map(function(row){

                if( yearAgeTable[row["year2"]] === undefined ){
                    yearAgeTable[row["year2"]] = {};                        
                }
                //Emp = jobs for (firms of this age) in this year
                yearAgeTable[row["year2"]][item] = row["emp"]; 
            })      

        });

        //yearAgeTable is data before it is processed even further for bdsTest

        //Goes through every element of yearAgeTable
        //Each element represents a year of data
        //Each element has sub elements, one for each age of firm for that year
        //Want an array with 1 object
        //[{values:[{x:val,y:val}....],key=msa,}]
        //Want to return 1 object for each year, where x=year and y=percent employed in new firms



        console.log("Line Graph First Processing Data",yearAgeTable);



        return yearAgeTable;
    },
    chartData:function(data){
    	var scope = this,
            ages = d3.range(12),
            allLines = [],
        	curLine = {"values":[],"key":scope.props.msa,"area":false},
        	valueArray=[];

        //Put all coordinates into this array
        valueArray = Object.keys(data).map(function(year){
        	var curCoord={"x":+year,"y":0},
	            totalEmploySum = 0,
	            newFirmSum = 0,
	            share = 0;


            //Creates Total Employment number for that year
            //Creates Employment in new firms for that year
            ages.forEach(function(age){
                if(data[year][age]){
                    totalEmploySum = totalEmploySum + data[year][age];                   
                }
                if(data[year][age] && (age == 0 || age == 1 || age == 2)){
                    newFirmSum = newFirmSum + data[year][age];
                }
            })
            share = newFirmSum/totalEmploySum;

            curCoord["y"] = share;
            //Want to return: x:year y:percent
            return curCoord;
        })

        //Put coordinates into the current line we are computing
        curLine["values"] = valueArray;
        //Push current line into array
        allLines.push(curLine);


        console.log("lineseries",allLines);
        return allLines;
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
	        console.log("render graph in new employment line graph",scope.state.data);
	        

	        nv.addGraph(function(){
				var chart = nv.models.lineChart()
			                .margin({left: 100})  //Adjust chart margins to give the x-axis some breathing room.
			                .useInteractiveGuideline(true)  //We want nice looking tooltips and a guidelin	                
			                .showLegend(true)       //Show the legend, allowing users to turn on/off line series.
			                .showYAxis(true)        //Show the y-axis
			                .showXAxis(true)		//Show the x-axis     
			                .isArea(false);
			                
			    chart.tooltip.enabled(true);


				chart.xAxis     //Chart x-axis settings
				      .axisLabel('Year')
				      .tickFormat(d3.format(''))
				      .axisLabelDistance(40)
				      .tickPadding(25);

				chart.yAxis     //Chart y-axis settings
				      .axisLabel('Share (percent) of employment in new firms')
				      .tickFormat(d3.format('.3%'))
				      .axisLabelDistance(40)
				      .tickPadding(25);

	            //Data is an array of series objects
	            //[
	            //	{values:[{x:VAL,y:VAL},{x:VAL,y:VAL},key:"msaId",OPTIONS...]},
	            //	{values:[{x:VAL,y:VAL},{x:VAL,y:VAL},key:"msaId",OPTIONS...]},
	            //	{values:[{x:VAL,y:VAL},{x:VAL,y:VAL},key:"msaId",OPTIONS...]},
	            //	...]

	            //key = msaID
	            //x coord = year
	            //y coord = share of employment in new firms

	            var finalData = scope.chartData(scope.state.data)
	            console.log("FINAL DATA",finalData);
	            d3.select('#ShareNewEmploymentByTimeGraph svg')
	                .datum(finalData)
	                .call(chart);  
	        
	            nv.utils.windowResize(chart.update);
	            return chart;
	        })

	}




	},
    componentDidUpdate:function(){
    	var scope = this;
        if(!scope.state.loading){
            //console.log('RYAN RYAN',scope.state.data, d3.select('#ShareNewEmploymentByTimeGraph svg'))
            scope.renderGraph();
        }
    },
	render:function() {
		var scope = this;

    	var svgStyle = {
          height: '100%',
          width: '100%'
        }		


		return (
			<div>
                <div style={svgStyle} id="ShareNewEmploymentByTimeGraph">
                	<svg style={svgStyle}/>
                </div>
			</div>
		);
	}
	
});

module.exports = ShareNewEmploymentByTimeGraph;
