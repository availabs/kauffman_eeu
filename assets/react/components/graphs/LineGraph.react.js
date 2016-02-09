var React = require("react"),
	d3 = require("d3"),
	metroPop20002009 = require("../utils/metroAreaPop2000_2009.json"),
    colorbrewer = require('colorbrewer'),
    msaIdToName = require('../utils/msaIdToName.json'),
    RankTable = require('../graphs/RankTable.react'),
    abbrToFips = require('../utils/abbrToFips.json');

var LineGraph = React.createClass({
    getInitialState:function(){
        return {
            data:[],
            loading:true,
            group:"msa",
            sortYear:2002,
            metric:"share",
            extent:[363,0],
            loading:true
        }
    },
    getDefaultProps:function(){
        return({
            data:[],
            color:"population",
            group:"msa"
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




        return chartData;
    },
    trimData:function(data){
        var scope = this,
        	shareData = {},
        	newFirmData = {},
            trimmedData = {};

        //Final object will have the following for every msaId
        //msaId:{1977:{age0:numEmployed,age1:numEmployed...},1978:{age0:numEmployed,age1:numEmployed...}}

        //big object would look like:
        // {10000:{{},{}...}, 11000:{{},{}...], ...}

        Object.keys(data).forEach(function(firmAge){

            Object.keys(data[firmAge]).forEach(function(metroAreaId){
                //If we havent gotten to this MSA yet
                if(!shareData[metroAreaId]){
                    shareData[metroAreaId] = {};
                }
                if(!newFirmData[metroAreaId]){
                    newFirmData[metroAreaId] = {};
                }

                //Iterating through every year for a given firm age in a metro area
                data[firmAge][metroAreaId].forEach(function(rowData){
                    if(!shareData[metroAreaId][rowData["year2"]]){
                        shareData[metroAreaId][rowData["year2"]] = {};
                    }
                    shareData[metroAreaId][rowData["year2"]][firmAge] = rowData["emp"];

                    if(rowData["year2"]>= 2000 && rowData["year2"]<= 2009){
                        if(!newFirmData[metroAreaId][rowData["year2"]]){
                            newFirmData[metroAreaId][rowData["year2"]] = {};
                        }
                        newFirmData[metroAreaId][rowData["year2"]][firmAge] = rowData["firms"];                       
                    }

                })
            })
        })

		trimmedData['share'] = shareData;
		trimmedData['new'] = newFirmData;

        return trimmedData;
    },
    chartStateData:function(data){
        var scope = this,
            ages = d3.range(12),
            stateData = {};

        Object.keys(data["share"]).forEach(function(msaId){

            if(msaIdToName[msaId]){
                var state = msaIdToName[msaId].substr(msaIdToName[msaId].length - 2);    
                if(!stateData[state]){
                    stateData[state] = {msaArray:[],newFirmData:{},shareData:{}};
                }                 
                stateData[state]["msaArray"].push(msaId);
                //Iterating through every year within a metro area
                Object.keys(data["share"][msaId]).forEach(function(year){
                   var pop = 0;



                    //Null check for state/year combo
                    if(!stateData[state]["shareData"][year]){
                        //If its new, default to 0
                        stateData[state]["shareData"][year] = {"totalEmploySum":0,"newFirmSum":0};
                    }
                    if(!stateData[state]["newFirmData"][year]){
                        //If its new, default to 0
                        stateData[state]["newFirmData"][year] = {"totalPopSum":0,"newFirmSum":0};
                    }


                    //Creates Total Employment number for that year
                    //Creates Employment in new firms for that year
                    ages.forEach(function(age){
                        if(data["share"][msaId][year][age]){
                            stateData[state]["shareData"][year]["totalEmploySum"] =  stateData[state]["shareData"][year]["totalEmploySum"] + data["share"][msaId][year][age];                   
                        }
                        if(data["share"][msaId][year][age] && (age < 6)){
                             stateData[state]["shareData"][year]["newFirmSum"] =  stateData[state]["shareData"][year]["newFirmSum"] + data["share"][msaId][year][age];
                        }
                    })




                    //Creates number of new firms for that year
                    ages.forEach(function(age){
                    	if(data["new"][msaId][year]){
	                        if(data["new"][msaId][year][age] && (age < 6)){
	                            var localNewFirm = +data["new"][msaId][year][age];
	                            stateData[state]["newFirmData"][year]["newFirmSum"] = stateData[state]["newFirmData"][year]["newFirmSum"] + localNewFirm;        
	                        }
                    	}
                    })
                    //Instead of share, want newFirmSum/(pop/1000)

                    if(metroPop20002009[msaId] && metroPop20002009[msaId][year]){
                        pop = metroPop20002009[msaId][year].replace(/,/g , "");
                        pop = +pop;


                        stateData[state]["newFirmData"][year]["totalPopSum"] = stateData[state]["newFirmData"][year]["totalPopSum"] + pop;                   
                    }
                })               
            }

        })

		var chartData = {};


		var chartData = Object.keys(stateData).map(function(state){
			var shareData = [],
				newFirmData = [];

			Object.keys(stateData[state]["shareData"]).forEach(function(year){
                if(year != "msaArray"){
                    var curCoord={"x":+year,"y":0},
                        share = 0;

                    share = stateData[state]["shareData"][year]["newFirmSum"]/stateData[state]["shareData"][year]["totalEmploySum"]       
                    curCoord["y"] = share;
                    //Want to return: x:year y:percent
                    shareData.push(curCoord);
                }
			})

			Object.keys(stateData[state]["newFirmData"]).forEach(function(year){

                if(year != "msaArray"){
                    var curCoord={"x":+year,"y":0},
                        share = 0;

                    if(stateData[state]["newFirmData"][year]["totalPopSum"] != 0 && stateData[state]["newFirmData"][year]["newFirmSum"] != 0){
                        var pop1000 = stateData[state]["newFirmData"][year]["totalPopSum"]/1000;
                        var newPer1000 =  stateData[state]["newFirmData"][year]["newFirmSum"]/pop1000;      
                        curCoord["y"] = newPer1000;

                        //Want to return: x:year y:percent
                        newFirmData.push(curCoord);                        
                    }

                }
			})
            return {key:state,newFirmData:newFirmData,shareData:shareData,area:false,msaArray:stateData[state]["msaArray"]};   

		})

       	var finalData = scope.nestData(chartData);
        return finalData;
    },
    chartMsaData:function(data){
        var scope = this,
            ages = d3.range(12),
            msaData = {};

        Object.keys(data["share"]).forEach(function(msaId){

   
            if(!msaData[msaId]){
                msaData[msaId] = {newFirmData:{},shareData:{}};
            }                 
            //Iterating through every year within a metro area
            Object.keys(data["share"][msaId]).forEach(function(year){
               var pop = 0;



                //Null check for state/year combo
                if(!msaData[msaId]["shareData"][year]){
                    //If its new, default to 0
                    msaData[msaId]["shareData"][year] = {"totalEmploySum":0,"newFirmSum":0};
                }
                if(!msaData[msaId]["newFirmData"][year]){
                    //If its new, default to 0
                    msaData[msaId]["newFirmData"][year] = {"totalPopSum":0,"newFirmSum":0};
                }


                //Creates Total Employment number for that year
                //Creates Employment in new firms for that year
                ages.forEach(function(age){
                    if(data["share"][msaId][year][age]){
                        msaData[msaId]["shareData"][year]["totalEmploySum"] =  msaData[msaId]["shareData"][year]["totalEmploySum"] + data["share"][msaId][year][age];                   
                    }
                    if(data["share"][msaId][year][age] && (age < 6)){
                         msaData[msaId]["shareData"][year]["newFirmSum"] =  msaData[msaId]["shareData"][year]["newFirmSum"] + data["share"][msaId][year][age];
                    }
                })




                //Creates number of new firms for that year
                ages.forEach(function(age){
                	if(data["new"][msaId][year]){
                        if(data["new"][msaId][year][age] && (age < 6)){
                            var localNewFirm = +data["new"][msaId][year][age];
                            msaData[msaId]["newFirmData"][year]["newFirmSum"] = msaData[msaId]["newFirmData"][year]["newFirmSum"] + localNewFirm;        
                        }
                	}
                })
                //Instead of share, want newFirmSum/(pop/1000)

                if(metroPop20002009[msaId] && metroPop20002009[msaId][year]){
                    pop = metroPop20002009[msaId][year].replace(/,/g , "");
                    pop = +pop;


                    msaData[msaId]["newFirmData"][year]["totalPopSum"] = msaData[msaId]["newFirmData"][year]["totalPopSum"] + pop;                   
                }
            })               
            

        })

		var chartData = {};


		var chartData = Object.keys(msaData).map(function(msaId){
			var shareData = [],
				newFirmData = [];

			Object.keys(msaData[msaId]["shareData"]).forEach(function(year){
                if(year != "msaArray"){
                    var curCoord={"x":+year,"y":0},
                        share = 0;

                    share = msaData[msaId]["shareData"][year]["newFirmSum"]/msaData[msaId]["shareData"][year]["totalEmploySum"]       
                    curCoord["y"] = share;
                    //Want to return: x:year y:percent
                    shareData.push(curCoord);
                }
			})

			Object.keys(msaData[msaId]["newFirmData"]).forEach(function(year){

                if(year != "msaArray"){
                    var curCoord={"x":+year,"y":0},
                        share = 0;

                    if(msaData[msaId]["newFirmData"][year]["totalPopSum"] != 0 && msaData[msaId]["newFirmData"][year]["newFirmSum"] != 0){
                        var pop1000 = msaData[msaId]["newFirmData"][year]["totalPopSum"]/1000;
                        var newPer1000 =  msaData[msaId]["newFirmData"][year]["newFirmSum"]/pop1000;      
                        curCoord["y"] = newPer1000;

                        //Want to return: x:year y:percent
                        newFirmData.push(curCoord);                        
                    }

                }
			})
            return {key:msaId,newFirmData:newFirmData,shareData:shareData,area:false};   

		})

       
       	var finalData = scope.nestData(chartData);
        return finalData;
    },
    colorGroup:function(){
        var scope = this;

        if(scope.state.group == "msa"){
            var colorGroup = d3.scale.linear()
                .domain(d3.range(1,366,(366/9)))
                .range(colorbrewer.Spectral[9]);
        }
        if(scope.state.group == "state"){
            var colorGroup = d3.scale.linear()
                .domain(d3.range(1,51,(51/9)))
                .range(colorbrewer.Spectral[9]);                  
        }


        return colorGroup;

    },
    colorFunction:function(params){
        var scope = this,
            cityColor;

        if(params.values){
            var valueLength = params.values.length;
            var curRank = params.values[valueLength-1].rank
            var color = scope.colorGroup();
                       
            cityColor = color(curRank);            
        }

                
        return cityColor;

    },
    nestData:function(data){

		var scope = this,
            color = d3.scale.category20(),
            newFirmYears = d3.range(2000,2010),
            shareYears = d3.range(1977,2009),
            commaFormat = d3.format(",");

        var newFirmCities = [];
        Object.keys(data).forEach(function(metroArea){
        	if(data[metroArea]['newFirmData'].length != 0){
        		
	            if(scope.state.group == "msa"){
	                newFirmCities.push( {
	                    name:msaIdToName[data[metroArea].key],
	                    key:data[metroArea].key,
	                    values:data[metroArea]['newFirmData'],
	                    color:scope.colorFunction(data[metroArea])
	                })                
	            }
	            else{
	            	newFirmCities.push({
	                    name:data[metroArea].key,
	                    key:data[metroArea].key,
	                    values:data[metroArea]['newFirmData'],
	                    color:scope.colorFunction(data[metroArea])
	                })
	                
	            }
			}
        });

        var shareCities = []
        Object.keys(data).forEach(function(metroArea){
        	if(data[metroArea]['shareData'].length != 0){
	            if(scope.state.group == "msa"){
	                shareCities.push({
	                    name:msaIdToName[data[metroArea].key],
	                    key:data[metroArea].key,
	                    values:data[metroArea]['shareData'],
	                    color:scope.colorFunction(data[metroArea])
	                }) 
	            }
	            else{
	                shareCities.push({
	                    name:data[metroArea].key,
	                    key:data[metroArea].key,
	                    values:data[metroArea]['shareData'],
	                    color:scope.colorFunction(data[metroArea])
	                }) 
	            }        		
        	}
        });

        var finalData = {share:shareCities,newFirms:newFirmCities};



        return finalData;

    },
	toggleChart:function(e){
		var scope = this;

		var headerItems = d3.selectAll('li');

		headerItems.forEach(function(items){
			items.forEach(function(item){
				item.className = "";
			})
		})
		d3.select('#rankings')
			.attr('class',"active");
		console.log(e.target.id);
		if(e.target.id == "newFirms"){
			scope.setState({metric:"newFirms"});
			d3.select('#newFirmsList')
				.attr('class',"active");

		}
		else if(e.target.id == "share"){
			scope.setState({metric:"share"});
			d3.select('#shareNewList')
				.attr('class',"active");
		}
		else{
			scope.setState({metric:"composite"});
			d3.select('#compositeList')
				.attr('class',"active");
		}
	},
    sortTable:function(e){
        var scope = this;
        console.log("sortTable",e.target.id);
        if(!e.target.id){
            if(scope.props.metric == "share"){
                scope.setState({sortYear:"1977"})               
            }
            if(scope.props.metric == "newFirms"){
                scope.setState({sortYear:"2000"})   
            }
        }
        else{
            scope.setState({sortYear:e.target.id})          
        }

    },
    sortCities:function(year){
        var scope = this;
        return function(a,b){

            var aValue,
                bValue;

            a.values.forEach(function(yearValues){
                if(yearValues.x == year){
                    aValue = yearValues.y;
                }
            })              
        

            b.values.forEach(function(yearValues){
                if(yearValues.x == year){
                    bValue = yearValues.y;
                }
            })       

            if(scope.props.metric == "composite"){
                if(aValue > bValue){
                    return 1;
                }
                if(bValue > aValue){
                    return -1;
                }
            }
            else{
                if(aValue > bValue){
                    return -1;
                }
                if(bValue > aValue){
                    return 1;
                }               
            }           



            return 0;       

        }
    },
    rankShare:function(cities){
        var scope=this,
            years = d3.range(1977,2013);

        years.forEach(function(year){
            var rank = 1;
            //Sort cities according to each year
            cities.sort(scope.sortCities(year));

            //Go through and assign ranks for current year
            cities.forEach(function(city){

                city.values.forEach(function(yearValues){
                    if(yearValues.x == year){
                        yearValues.rank = rank;
                    }
                })

                rank++;
            })
        })          

        return cities; 
    },
    rankNewFirm:function(cities){
        var scope=this,
            years = d3.range(2000,2010);


        years.forEach(function(year){
            var rank = 1;
            //Sort cities according to each year
            cities.sort(scope.sortCities(year));

            //Go through and assign ranks for current year
            cities.forEach(function(city){

                city.values.forEach(function(yearValues){
                    if(yearValues.x == year){
                        yearValues.rank = rank;
                    }
                })

                rank++;
            })
        })          

        return cities;        

    },
    rankComposite:function(){
        var scope = this,
            years = d3.range(2000,2010);

        var newFirms = scope.newFirmsGraph(scope.state.data["newFirms"]),
            share = scope.shareGraph(scope.state.data["share"]);
            console.log("newifmrs",newFirms);
        var compositeCityRanks = [];

        newFirms.forEach(function(item){
            for(var i=0; i<share.length;i++){
                if(item.key == share[i].key){

                    var resultValues = [];

                    item.values.forEach(function(itemValues){
                        for(var j=0;j<share[i].values.length;j++){
                            if(itemValues.x == share[i].values[j].x){
                                resultValues.push({x:itemValues.x,y:( ((newFirms.length - itemValues.rank)+1 + (share.length-share[i].values[j].rank)+1)/2 )})
                            }
                        }
                    })

                    compositeCityRanks.push({key:item.key,name:item.name,color:item.color,values:resultValues})
                }
            }
        })

        //console.log(compositeCityRanks);

        var years = d3.range(2000,2010);

        //Rank them
        years.forEach(function(year){
            var rank = 1;
            //Sort cities according to each year
            compositeCityRanks.sort(scope.sortCities(year));

            //Go through and assign ranks for current year
            compositeCityRanks.forEach(function(city){

                city.values.forEach(function(yearValues){

                    if(yearValues.x == year){
                        yearValues.rank = rank;
                    }
                })

                rank++;
            })

        })          


        return compositeCityRanks;
    },
    shareGraph:function(data){
        var scope = this;

        var cities = Object.keys(data).map(function(metroArea){

                if(scope.state.group == "msa"){
                    
                    var city = {
                        values:null,
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
                        color:data[metroArea].color,
                        msaArray:data[metroArea].msaArray,
                        key:data[metroArea].key,
                        name:data[metroArea].key
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

        return scope.rankShare(cities);

    },
    newFirmsGraph:function(data){
        var scope = this;

        var cities = Object.keys(data).map(function(metroArea){

                if(scope.state.group == "msa"){
                    
                    var city = {
                        values:null,
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
                        color:data[metroArea].color,
                        msaArray:data[metroArea].msaArray,
                        key:data[metroArea].key,
                        name:data[metroArea].key
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

        return scope.rankNewFirm(cities);
    },
    compositeGraph:function(data){
        var scope = this;

        var newData = scope.rankComposite();
        
        var cities = Object.keys(newData).map(function(metroArea){

                if(scope.state.group == "msa"){
                    
                    var city = {
                        values:null,
                        key:newData[metroArea].key,
                        name:newData[metroArea].name
                    }

                    city.values = newData[metroArea].values.map(function(i){
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
                        color:newData[metroArea].color,
                        msaArray:newData[metroArea].msaArray,
                        key:newData[metroArea].key,
                        name:newData[metroArea].name
                    }

                    city.values = newData[metroArea].values.map(function(i){
                        return {
                            city:city,
                            x:i.x,
                            y:i.y
                        }
                    })
                }
                return city;
            });
        return scope.rankNewFirm(cities);
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
            if(scope.state.metric == "share"){
                var cities = scope.shareGraph(data.share);
            }
            if(scope.state.metric == "newFirms"){
                var cities = scope.newFirmsGraph(data.newFirms);
            }
            if(scope.state.metric == "composite"){
                var cities = scope.compositeGraph(data);
            }



            var filteredData = [];
            filteredData = cities.filter(function(city){
                var withinBounds;
                city.values.forEach(function(yearVal){
                    if(yearVal.x == scope.state.sortYear){
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

            var margin = {top: 100, right: 40, bottom: 50, left: 55},
                width = window.innerWidth*.98 - margin.left - margin.right,
                height = window.innerHeight - margin.top - margin.bottom;

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
                        .style("stroke",scope.colorFunction(b))
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
                if(scope.state.group == "msa"){
                    name = d.city.name;
                }
                else{
                    name = d.city.key;
                }

                popText += name + ' | ' + d.x +':  '+ d.rank;

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
                        backgroundColor:scope.colorFunction(d.city)
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
                d3.select(d.city.line).style("stroke",function(){return scope.colorFunction(d.city);})
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

                if(scope.state.group == "state"){
                    if(Math.round(s[1]) - Math.round(s[0]) > 50 ){
                        brush.extent([Math.round(s[1]),Math.round(s[1]-50)]) (d3.select(this));
                    }
                    else{
                        brush.extent([Math.round(s[1]),Math.round(s[0])])(d3.select(this));
                    }
                    s = brush.extent();
                    scope.setState({extent:[Math.round(s[0]),Math.round(s[1])]})
                }
                else{
                    brush.extent([Math.round(s[1]),Math.round(s[0])])(d3.select(this));
                    
                    s = brush.extent();
                    scope.setState({extent:[Math.round(s[0]),Math.round(s[1])]})
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

        }

    },
    resetBrush:function(){
        var scope = this;

        if(scope.state.group == "msa"){
        var extent = [363,0];            
        }
        else{
            var extent = [51,0];
        }
        scope.setState({extent:extent})
    },
	render:function() {
		var scope = this;

		d3.selectAll("svg").remove();

		var tables;
		console.log("render setstate",scope.state);
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
		if(scope.state.loading == false){
            scope.renderGraph();
			return (
				<div>
					<h3>Rankings</h3>
			    	<ul className="nav nav-tabs">
			    		<li id="newFirmsList"  onClick={scope.toggleChart}><a id="newFirms" >New Firms Per 1000 People</a></li>
			    		<li id="shareNewList" className="active" onClick={scope.toggleChart} ><a id="share" >Share of Employment in New Firms</a></li>
			    		<li id="compositeList" onClick={scope.toggleChart} ><a id="composite" >Composite Rankings</a></li>
			    	</ul>
                    <div id="rankGraph"><button  style={buttonStyle}className="btn" onClick={scope.resetBrush}>Reset Brush Filter</button></div>
                    <div>
                        <div style = {currentRowStyle}>
                            <div style={lockStyle} id="currentRowLock"></div>
                            <div style={scrollStyle} id="currentRowScroll" style={rowStyle}></div>
                        </div>
			    	    <RankTable data={scope.state.data} metric={scope.state.metric} />
                    </div>
				</div>
			);			
		}
		else{
			return (
				<div>
					<h3>Rankings</h3>
			    	<ul className="nav nav-tabs">
			    		<li id="newFirmsList" className="active" onClick={scope.toggleChart}><a id="newFirms" >New Firms Per 1000 People</a></li>
			    		<li id="shareNewList" onClick={scope.toggleChart} ><a id="share" >Share of Employment in New Firms</a></li>
			    		<li id="compositeList" onClick={scope.toggleChart} ><a id="composite" >Composite Rankings</a></li>
			    	</ul>
				</div>
			);			
		}

	}
});






module.exports = LineGraph;