var React = require("react"),
	d3 = require("d3"),
	metroPop20002009 = require("../utils/metroAreaPop2000_2009.json"),
    colorbrewer = require('colorbrewer'),
    msaIdToName = require('../utils/msaIdToName.json'),
    abbrToFips = require('../utils/abbrToFips.json');

var RankingsGraph = React.createClass({
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
                        if(data["share"][msaId][year][age] && (age == 0 || age == 1 || age == 2)){
                             stateData[state]["shareData"][year]["newFirmSum"] =  stateData[state]["shareData"][year]["newFirmSum"] + data["share"][msaId][year][age];
                        }
                    })




                    //Creates number of new firms for that year
                    ages.forEach(function(age){
                    	if(data["new"][msaId][year]){
	                        if(data["new"][msaId][year][age] && (age == 0 || age == 1 || age == 2)){
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

       
        return chartData;
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
                    if(data["share"][msaId][year][age] && (age == 0 || age == 1 || age == 2)){
                         msaData[msaId]["shareData"][year]["newFirmSum"] =  msaData[msaId]["shareData"][year]["newFirmSum"] + data["share"][msaId][year][age];
                    }
                })




                //Creates number of new firms for that year
                ages.forEach(function(age){
                	if(data["new"][msaId][year]){
                        if(data["new"][msaId][year][age] && (age == 0 || age == 1 || age == 2)){
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

       
        return chartData;
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
    renderTable:function(){

		var scope = this,
            data = scope.state.data,
            color = d3.scale.category20(),
            newFirmYears = d3.range(2000,2010),
            shareYears = d3.range(1977,2009),
            commaFormat = d3.format(","),
            percFormat = d3.format(".3%");



        var newFirmCities = Object.keys(data).map(function(metroArea){
            if(scope.state.group == "msa"){
                return {
                    name:msaIdToName[data[metroArea].key],
                    values:data[metroArea]['newFirmData'],
                    color:scope.colorFunction(data[metroArea])
                }                
            }
            else{
                return {
                    name:data[metroArea].key,
                    values:data[metroArea]['newFirmData'],
                    color:scope.colorFunction(data[metroArea])
                }
            }

        });

        var shareCities = Object.keys(data).map(function(metroArea){
            if(scope.state.group == "msa"){
                return {
                    name:msaIdToName[data[metroArea].key],
                    values:data[metroArea]['shareData'],
                    color:scope.colorFunction(data[metroArea])
                }                
            }
            else{
                return {
                    name:data[metroArea].key,
                    values:data[metroArea]['shareData'],
                    color:scope.colorFunction(data[metroArea])
                }
            }

        });

        console.log("unsorted cities",newFirmCities,shareCities);

        newFirmCities.sort(scope.sortCities);
        shareCities.sort(scope.sortCities);
        console.log("sorted cities",newFirmCities,shareCities);
 
    },
    sortCities:function(a,b){
    	var scope = this;

			var aValue,
        		bValue;

        	//THIS COMES FROM STATE
        	var sortYear = 2002;
        	//var sortYear = scope.state.sortYear;

        	a.values.forEach(function(yearValues){
        		if(yearValues.x == sortYear){
        			aValue = yearValues.y;
        		}
        	})

        	b.values.forEach(function(yearValues){
        		if(yearValues.x == sortYear){
        			bValue = yearValues.y;
        		}
        	})

        	if(aValue > bValue){
        		return -1;
        	}
        	if(bValue > aValue){
        		return 1;
        	}
        	return 0;    	

    },
	rankShare:function(){

	},
	rankNewFirm:function(){

	},
	render:function() {
		var scope = this;
		console.log("RANKINGS GRAPH")
		d3.selectAll("svg").remove();

		var tables;

		if(scope.state.data != []){
			console.log("render data",scope.state.data);
			tables = scope.renderTable();
		}
        var divStyle = {
            overflowX:'scroll',
            overflowY:'scroll',
            height:window.innerHeight*.4,
            width:window.innerWidth
        }


		return (
			<div>
				<h3>Rankings</h3>
				<div style = {divStyle}>
					{tables["newFirmTable"]}
				</div>
				<div style = {divStyle}>
					{tables["shareTable"]}
				</div>

			</div>
			
		);
	}
});

module.exports = RankingsGraph;