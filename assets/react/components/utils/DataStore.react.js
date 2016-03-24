var React = require("react"),
	d3 = require("d3"),
    colorbrewer = require('colorbrewer'),
    msaIdToName = require('../utils/msaIdToName.json'),
    graphInfo = require('../utils/graphInfo.json');

var DataStore = React.createClass({
	getInitialState:function(){
		return {
			loading:true,
            equalOpp:{},
            opportunity:[],
            shareImm:{},
			imm:{},
            detailMigration:{},
            migration:{},
            netMigration:{},
            inflowMigration:{},
            outflowMigration:[],
            inc5000:{},
            inc:{},
            irsNet:{},
            totalMigrationFlow:{},
            allMsa:{},
			share:[],
			newValues:[],
            densityComposite:[],
            msaPop:{}			
		}
	},
    getData:function(reqData,cb){
        var scope = this;

        var route = "/" + reqData;

        console.log("getData",reqData);
        d3.json(route,function(err,data){
            cb(data);
        })
    },
    getGraphData:function(graphName,filters){
        var scope = this,
            graphData,
            route = graphInfo[graphName].route;

        console.log("getGraphData || graphName:" + graphName, " Route:" +route);
        console.log(scope.state);
        if(scope.state[route] && Object.keys(scope.state[route]).length > 0){
            if(scope.state[graphName] && Object.keys(scope.state[graphName]).length > 0){
                graphData = scope.state[graphName];
                return graphData;  
            }
            else{
                scope.setState({[graphName]:scope[('process'+[route])](scope.state[route],graphName)})
                setTimeout(function(){ scope.getGraphData(graphName,filters) }, 1500);                
            }
        }
        else{
            scope.getData(route,function(data){
                scope.setState({[route]:data,[graphName]:scope[('process'+route)](data,graphName)})                
            });
            setTimeout(function(){ scope.getGraphData(graphName,filters) }, 5000);
        }  
    }, 
    relativeAgainstPopulation:function(graphRawData){
        var scope = this,
            maxYear = d3.max(graphRawData, function(c) { return d3.max(c.values, function(v) { return v.x }); })
        
        if(scope.state.msaPop && Object.keys(scope.state.msaPop).length > 0){        
            var graphRelativeData = graphRawData.map(function(metroArea){
                var newValues = [];
                metroArea.values.forEach(function(yearVal){
                    if(yearVal.x <= maxYear){
                        var newCoord = {x:yearVal.x, y:0};

                        if(scope.state.msaPop[metroArea.key]){
                            if(scope.state.msaPop[metroArea.key][yearVal.x]){
                                var newY = yearVal.y / scope.state.msaPop[metroArea.key][yearVal.x];
                                newCoord = {x: yearVal.x, y:newY};                               
                            }
                        }
                        newValues.push(newCoord);                       
                    }
                })
                return ({key:metroArea.key,values:newValues,area:false});                
            })

            return graphRelativeData;
        }
        else{
            scope.getData('countyPop',function(msaData){
                scope.setState({"msaPop":msaData})
            })
            setTimeout(function(){ scope.relativeAgainstPopulation(data) }, 1500);    
        }
    },
    convertToCoordinateArray:function(data,dataset){
        var scope = this,
            finalData = [];

        Object.keys(data).forEach(function(msaId){
            var valueArray = [];
            Object.keys(data[msaId]).forEach(function(year){
                if(dataset != "opportunity"){
                    if(dataset != "inc5000"){
                        if(data[msaId][year] != 0){
                            valueArray.push( {x:+year,y:+Math.round(+data[msaId][year])});  
                        }                        
                    }
                    else{
                        valueArray.push( {x:+year,y:+data[msaId][year]});          
                    }
                }
                else{
                    valueArray.push( {x:year,y:+data[msaId][year]});  
                } 
            })

            if(valueArray.length != 0){
             finalData.push({key:msaId,values:valueArray,area:false});                
            }
        })

        return finalData;
    },
    processequalOpp:function(data){
        var scope = this;
        var msaGains = {};

        console.log("processequalOpp");
        //filter out null rows
        Object.keys(data).forEach(function(msaId){
            if(data[msaId]["highIncome"] != null && data[msaId]["lowIncome"] != null){
                msaGains[msaId] = {};
                msaGains[msaId] = data[msaId];
            }

        })

        var finalData = scope.convertToCoordinateArray(msaGains,"opportunity");
        
        finalData.sort(scope.sortCities("lowIncome"));
        var polishedData = scope.polishData(finalData,"opportunity");

        return polishedData;
    },
    processinc5000:function(data){
        var scope = this;
        console.log("processinc5000");
        if(scope.state.newValues && scope.state.newValues.length > 0){

            var finalData = scope.convertToCoordinateArray(data,"inc5000");
            var rankedData = scope.rankCities(finalData);
            var polishedData = scope.polishData(rankedData,"inc5000");

            var newFirms = scope.state.newValues;
            var totalEmp = {};

            newFirms.forEach(function(city){

                //Iterating through every year within a metro area
                var valueObject = {};
                Object.keys(city.values).forEach(function(yearValue){
                    //Want to return: x:year y:percent
                    valueObject[city.values[yearValue].x] = 0;
                    valueObject[city.values[yearValue].x] = city.values[yearValue].raw;
                })

                //Only return once per metroArea
                totalEmp[city.key] = {key:city.key,values:valueObject,area:false};                    
            })

            var graphRawData = polishedData;

            var graphRelativeData = graphRawData.map(function(metroArea){
                var newValues = [];
                metroArea.values.forEach(function(yearVal){
                    if(yearVal.x < 2010){
                        var newCoord = {x:yearVal.x, y:0};

                        if(totalEmp[metroArea.key] && totalEmp[metroArea.key]["values"][yearVal.x]){
                            var newY = +yearVal.y / totalEmp[metroArea.key]["values"][yearVal.x];
                            newCoord = {x: yearVal.x, y:newY};
                        }
                        newValues.push(newCoord);                       
                    }     
                })

                 return ({key:metroArea.key,values:newValues,area:false});                
            })

            var graphRelativeData2 = [];
            graphRelativeData2 = scope.relativeAgainstPopulation(graphRawData);

            if(graphRelativeData2 && graphRelativeData2.length > 0){
                var rankedData2 = scope.rankCities(graphRelativeData);
                var polishedData2 = scope.polishData(rankedData2,"relativeInc5000");

                var rankedData3 = scope.rankCities(graphRelativeData2);
                var polishedData3 = scope.polishData(rankedData3,"relativeInc5000");

                var graphData = {};
                graphData["raw"] = graphRawData;
                graphData["relative"] = polishedData2;
                graphData["relative2"] = polishedData3;

                return graphData;               
            }
        }
        else{
            if(scope.state.allMsa && Object.keys(scope.state.allMsa).length > 0){
                scope.setState({"newValues":scope.processallMsa(scope.state.allMsa,"newValues")});
                setTimeout(function(){ scope.processinc5000(data) }, 3000);                
            }
            else{
                scope.getData("allMsa",function(rawMsaData){
                    scope.setState({"allMsa":rawMsaData,"newValues":scope.processallMsa(rawMsaData,"newValues")})
                });
                setTimeout(function(){ scope.processinc5000(data) }, 10000);
            }
        }
    },   
    processGeneral:function(data,dataset){
        var scope = this;
        console.log("processgeneral");
        var finalData = scope.convertToCoordinateArray(data);

        var rankedData = scope.rankCities(finalData);
        var polishedData = scope.polishData(rankedData,dataset);
        var graphRawData = polishedData;

        var graphRelativeData = [];
        graphRelativeData = scope.relativeAgainstPopulation(graphRawData);

        if(graphRelativeData && graphRelativeData.length > 0){
            var rankedData2 = scope.rankCities(graphRelativeData);
            var polishedData2 = scope.polishData(rankedData2,("relative"+dataset));

            var graphData = {};
            graphData["raw"] = graphRawData;
            graphData["relative"] = polishedData2;
            return graphData;                
        }
    },
    processmigration:function(data,dataset){
        var scope = this;
        console.log("processmigration");
        return scope.processGeneral(data,dataset);
    },
    processshareImm:function(data,dataset){
        var scope = this;
        console.log("processshareImm");
        return scope.processGeneral(data,dataset);
    },
    processdetailMigration:function(data,dataset){
        var scope = this, 
            reducedData = {},
            finalData = [];
            console.log("processdetailMigration")
        Object.keys(data).forEach(function(msaId){
            var valueArray = [];
            Object.keys(data[msaId]).forEach(function(year){
                if(data[msaId][year]){
                    if(data[msaId][year]['outflow']){
                        if(year > 12){
                            var curYear = "19" + year;
                        }
                        else{
                            var curYear = "20" + year;
                        }

                        var curValue = 0;
                        if(dataset == "outflowMigration"){
                            curValue = +data[msaId][year]['outflow']['individuals']
                        }
                        else{
                            curValue += +data[msaId][year]['inflow']['individuals']

                            if(dataset == "totalMigrationFlow"){
                                curValue += +data[msaId][year]['outflow']['individuals']
                            }
                            if(dataset == "irsNet"){
                                curValue -= +data[msaId][year]['outflow']['individuals']
                            }
                        }

                        valueArray.push( {x:+curYear,y:curValue});                        
                    }                
                }
            })

            if(valueArray.length != 0){
             finalData.push({key:msaId,values:valueArray,area:false});                
            }
        })

        var rankedData = scope.rankCities(finalData);
        var polishedData = scope.polishData(rankedData,dataset);

        polishedData.forEach(function(metroArea){
            metroArea.values.sort(function(a,b){
                return a.x - b.x
            })
        })

        var graphRawData = polishedData;

        var graphRelativeData = [];
        graphRelativeData = scope.relativeAgainstPopulation(graphRawData);

        if(graphRelativeData && graphRelativeData.length > 0){
            var rankedData2 = scope.rankCities(graphRelativeData);
            var polishedData2 = scope.polishData(rankedData2,("relative"+dataset));

            var graphData = {};
            graphData["raw"] = graphRawData;
            graphData["relative"] = polishedData2;
            return graphData;                
        }             
    },
    processallMsa:function(data,dataset){
        var scope = this,
            ages = d3.range(12),
            newFirmData = {};

        //Final object will have the following for every msaId
        //msaId:{1977:{age0:numEmployed,age1:numEmployed...},1978:{age0:numEmployed,age1:numEmployed...}}

        //big object would look like:
        // {10000:{{},{}...}, 11000:{{},{}...], ...}
        console.log("processallMsa " + dataset);
        if(dataset == "densityComposite"){
            return scope.processdensityComposite(dataset)
        }
        else{
            if(scope.state.msaPop && Object.keys(scope.state.msaPop).length > 0){
                Object.keys(data).forEach(function(firmAge){

                    Object.keys(data[firmAge]).forEach(function(metroAreaId){
                        //If we havent gotten to this MSA yet
                        if(!newFirmData[metroAreaId]){
                            newFirmData[metroAreaId] = {};
                        }

                        //Iterating through every year for a given firm age in a metro area
                        data[firmAge][metroAreaId].forEach(function(rowData){
                            if(dataset == "newValues"){
                                if(rowData["year2"]>= 1990 && rowData["year2"]<= 2009){
                                    if(!newFirmData[metroAreaId][rowData["year2"]]){
                                        newFirmData[metroAreaId][rowData["year2"]] = {};
                                    }
                                    newFirmData[metroAreaId][rowData["year2"]][firmAge] = rowData["firms"]; 
                                }                      
                            }
                            else{
                                if(!newFirmData[metroAreaId][rowData["year2"]]){
                                    newFirmData[metroAreaId][rowData["year2"]] = {};
                                }                        
                                newFirmData[metroAreaId][rowData["year2"]][firmAge] = rowData["emp"];
                            }
                        })
                    })
                })  

                //Every msa represented as:
                //{values:[{x:val,y:val}....],key=msa,}
                //Want to return 1 (x,y) object for each year, where x=year and y=new firms per 1000 people
                var chartData = Object.keys(newFirmData).map(function(msaId){
                    //Iterating through every year within a metro area
                    var valueArray = Object.keys(newFirmData[msaId]).map(function(year){
                        var curCoord={"x":+year,"y":0,"raw":0},
                            newFirmSum = 0,
                            newPer1000 = 0,
                            pop = 0,
                            pop1000 = 0,
                            totalEmploySum = 0,
                            share = 0;

                        //Creates number of new firms for that year
                        ages.forEach(function(age){
                            if(newFirmData[msaId][year][age] && (age < 6)){
                                newFirmSum = newFirmSum + +newFirmData[msaId][year][age];
                            }

                            if(dataset == "share"){
                                if(newFirmData[msaId][year][age]){
                                    totalEmploySum = totalEmploySum + +newFirmData[msaId][year][age];                   
                                }                            
                            }
                        })

                        if(dataset == "share"){
                            share = newFirmSum/totalEmploySum;

                            curCoord["raw"] = newFirmSum
                            curCoord["y"] = share;
                            //Want to return: x:year y:percent
                            return curCoord;
                        }
                        else{
                            if(scope.state.msaPop[msaId] && scope.state.msaPop[msaId][year]){
                                pop = scope.state.msaPop[msaId][year];
                                pop1000 = (pop/1000);                   
                            }
                            else{
                                pop1000=0;
                            }

                            if(pop1000 == 0){
                                newPer1000 = 0;
                            }
                            else{
                                newPer1000 = newFirmSum/pop1000;
                            }
                            
                            curCoord["y"] = newPer1000;
                            curCoord["raw"] = newFirmSum;
                            //Want to return: x:year y:percent
                            return curCoord;                        
                        }
                    })

                    //Only return once per metroArea
                    return {key:msaId,values:valueArray,area:false};
                })

                var rankedData = scope.rankCities(chartData);
                var polishedData = scope.polishData(rankedData,dataset);

                return polishedData;            
            }
            else{
                scope.getData('countyPop',function(msaData){
                    scope.setState({"msaPop":msaData})
                })
                setTimeout(function(){ scope.processallMsa(data,dataset) }, 1500);    
            }
        }
    },
    processdensityComposite:function(dataset){
        var scope = this,
            years = d3.range(1990,2010);        
        console.log("processdensityComposite");
        if(scope.state.share && scope.state.share.length > 0){
            if(scope.state.newValues && scope.state.newValues.length > 0){

                var newFirms = scope.state.newValues,
                    share = scope.state.share;

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
                            compositeCityRanks.push({key:item.key,values:resultValues})
                        }
                    }
                })

                compositeCityRanks = scope.rankCities(compositeCityRanks);
                var graphData = scope.polishData(compositeCityRanks,"densityComposite");
                return graphData;
            }
            else{
                if(scope.state.allMsa && Object.keys(scope.state.allMsa).length > 0){
                        scope.setState({"newValues":scope.processallMsa(scope.state.allMsa,"newValues")});
                        setTimeout(function(){ scope.processdensityComposite(dataset) }, 1500);                
                }
                else{
                    scope.getData("allMsa",function(data){
                        scope.setState({"allMsa":data,"newValues":scope.processallMsa(data,"newValues")})
                    });
                    setTimeout(function(){ scope.processdensityComposite(dataset) }, 10000);
                }
            }  
        }
        else{
            if(scope.state.allMsa && Object.keys(scope.state.allMsa).length > 0){
                scope.setState({"share":scope.processallMsa(scope.state.allMsa,"share")});
                setTimeout(function(){ scope.processdensityComposite(dataset) }, 1500);                
            }
            else{
                scope.getData("allMsa",function(data){
                    scope.setState({"allMsa":data,"share":scope.processallMsa(data,"share")})
                });
                setTimeout(function(){ scope.processdensityComposite(dataset) }, 10000);
            }
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

        	if(aValue > bValue){
        		return -1;
        	}
        	if(bValue > aValue){
        		return 1;
        	}        		
        	        	
        	return 0;    	
    	}
    },
    rankCities:function(cities){
        var scope=this,
            years = d3.range(
                [d3.min(cities, function(c) { return d3.min(c.values, function(v) { return v.x }); })],
                [d3.max(cities, function(c) { return d3.max(c.values, function(v) { return v.x }); })+1]
            );

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
    colorGroup:function(){
        var scope = this;

        var colorGroup = d3.scale.linear()
            .domain(d3.range(1,366,(366/9)))
            .range(colorbrewer.Spectral[9]);
        
        return colorGroup;
    },
    colorOppGroup:function(group){
        var scope = this;

        if(group == "lowIncome"){
            var colorGroup = d3.scale.linear()
                .domain([-.2,.2])
                .range(['red','green']);
        }
        if(group == "highIncome"){
            var colorGroup = d3.scale.linear()
               .domain([-.1,.1])
               .range(['red','green']);           
        }

        return colorGroup;
    },
    colorFunction:function(params,dataset){
        var scope = this,
            cityColor;

        if(params){
            if(dataset == "opportunity" && params.x){
                var color = scope.colorOppGroup(params.x);    
                cityColor = color(params.y);                             
            }
            else if(params.values){
                var valueLength = params.values.length;
                var curRank = params.values[valueLength-1].rank
                var color = scope.colorGroup();
                cityColor = color(curRank);   
            }
        }  

        return cityColor;
    },
    polishData:function(data,dataset){
    	var scope = this;
        var newData = [];

        Object.keys(data).forEach(function(metroArea){
        	if(data[metroArea].length != 0){
        			var city = {
        				values:null,
        				name: msaIdToName[data[metroArea].key],
        				key:data[metroArea].key,
        				color:scope.colorFunction(data[metroArea],dataset)
        			}

                    city.values = data[metroArea].values.map(function(i){
                        return {
                            city:city,
                            x:i.x,
                            y:i.y,
                            rank:i.rank,
                            raw:i.raw,
                            color:scope.colorFunction(i,dataset)
                        }
                    })	 
                newData.push(city);           
			}
        });
        return newData;
    },
	render:function(){
		var scope = this;

		return (<div></div>);
	}
});

module.exports = DataStore;
