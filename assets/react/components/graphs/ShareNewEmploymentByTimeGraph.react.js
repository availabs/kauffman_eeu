var React = require("react"),
	d3 = require("d3"),
	nv = require("nvd3");


var ShareNewEmploymentByTimeGraph = React.createClass({
    getInitialState:function(){
        return {
            curChart:"line",
            data:[],
            loading:true
        }
    },
    componentDidMount:function(){
        var scope = this;

        scope.getData(function(data){
            scope.setState({data:scope.processData(data),loading:false});
        })
    },
    getData:function(cb){
    	//Get data should get the raw data from every MSA
    	//Should make a new route and function
        var scope = this;

        d3.json("/allMsa",function(err,data){
            return cb(data);  
        })

    },
    processData:function(data){
        var scope = this;
        //console.log("unproccessed",data);
        var ages = d3.range(12);

        var fullMetroAreaData = {};

        //Aggregate data is an object
        //Inside it, is an object for each firm age (0 thru 11)
        //Within those is an object for each metro area, with key = msaId and value = an array of objects
        //Each object contains one object per year. They contain data

        //End goal of processing is to create the following object FOR EVERY METRO AREA:
        //msaId:{1977:{age0:numEmployed,age1:numEmployed...},1978:{age0:numEmployed,age1:numEmployed...}}

        //big object would look like:
        // {10000:{{},{}...}, 11000:{{},{}...], ...}

        Object.keys(data).forEach(function(firmAge){

        	Object.keys(data[firmAge]).forEach(function(metroAreaId){
        		//If we havent gotten to this MSA yet
   				if(!fullMetroAreaData[metroAreaId]){
					fullMetroAreaData[metroAreaId] = {};
   				}

   				//Iterating through every year for a given firm age in a metro area
   				data[firmAge][metroAreaId].forEach(function(rowData){
   					if(!fullMetroAreaData[metroAreaId][rowData["year2"]]){
   						fullMetroAreaData[metroAreaId][rowData["year2"]] = {};
   					}
					fullMetroAreaData[metroAreaId][rowData["year2"]][firmAge] = rowData["emp"];
   				})
        	})

        })
        //console.log("after 1st process",fullMetroAreaData);

        //Now arranged by MSAID -> Year -> Firm Age

        //Want an array with one object PER metro area
        //Object will look like: {values:[{x:1977,y:val}, {x:1978,y:val}....],key=msa,}

        var chartData = Object.keys(fullMetroAreaData).map(function(msaId){

        	//Iterating through every year within a metro area
        	var valueArray = Object.keys(fullMetroAreaData[msaId]).map(function(year){
	        	var curCoord={"x":+year,"y":0},
		            totalEmploySum = 0,
		            newFirmSum = 0,
		            share = 0;


	            //Creates Total Employment number for that year
	            //Creates Employment in new firms for that year
	            ages.forEach(function(age){
	                if(fullMetroAreaData[msaId][year][age]){
	                    totalEmploySum = totalEmploySum + fullMetroAreaData[msaId][year][age];                   
	                }
	                if(fullMetroAreaData[msaId][year][age] && (age == 0 || age == 1 || age == 2)){
	                    newFirmSum = newFirmSum + fullMetroAreaData[msaId][year][age];
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




        //Goes through every element of yearAgeTable
        //Each element represents a year of data
        //Each element has sub elements, one for each age of firm for that year
        //Want an array with 1 object
        //[{values:[{x:val,y:val}....],key=msa,}]
        //Want to return 1 object for each year, where x=year and y=percent employed in new firms



        //console.log("Done Processing",chartData);



        return chartData;
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
	        //console.log("render graph in new employment line graph",scope.state.data);
	        

	        nv.addGraph(function(){
				var chart = nv.models.lineChart()
			                .margin({left: 100})  //Adjust chart margins to give the x-axis some breathing room.
			                .useInteractiveGuideline(false)  //We want nice looking tooltips and a guidelin	                
			                .showLegend(false)       //Show the legend, allowing users to turn on/off line series.
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

	            d3.select('#ShareNewEmploymentByTimeGraph svg')
	                .datum(scope.state.data)
	                .call(chart);  
	        
	            nv.utils.windowResize(chart.update);
	            return chart;
	        })

	}




	},
    componentDidUpdate:function(){
    	var scope = this;
            //console.log('RYAN RYAN',scope.state.data, d3.select('#ShareNewEmploymentByTimeGraph svg'))
            scope.renderGraph();
        
    },
    test:function(){
    	console.log("TESTING");
    	this.renderGraph();
    },
	render:function() {
		var scope = this;

    	var svgStyle = {
          height: '100%',
          width: '100%'
        }		

        var divStyle = {
        	position:'relative',
        	height:'600px',
        	width:'1300px'
        }


		return (
			<div>
                <div style={divStyle} id="ShareNewEmploymentByTimeGraph">
                	<svg style={svgStyle}/>
                </div>

			</div>
		);
	}
	
});

module.exports = ShareNewEmploymentByTimeGraph;
