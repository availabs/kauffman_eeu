var React = require("react"),
	d3 = require("d3"),
    colorbrewer = require('colorbrewer'),
    msaIdToName = require('../utils/msaIdToName.json');

var DataStore = React.createClass({
	getInitialState:function(){
		return {
			loading:true,
            rawOpportunityData:{},
            opportunityData:[],
            rawImmData:{},
			immData:[],
            detailMigration:{},
            rawMigrationData:{},
            migrationData:{},
            inflowMigration:{},
            outflowMigration:[],
            rawIncData:{},
            incData:{},
            irsNet:{},
            totalMigrationFlow:{},
            allMsa:{},
			shareValues:[],
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
    processOpportunityData:function(data){
        var scope = this;
        var msaGains = {};

        //filter out null rows
        Object.keys(data).forEach(function(msaId){
            if(data[msaId]["highIncome"] != null && data[msaId]["lowIncome"] != null){
                msaGains[msaId] = {};
                msaGains[msaId] = data[msaId];
            }

        })

        var reducedData = {}
        var finalData = [];
        Object.keys(msaGains).forEach(function(msaId){
            var valueArray = [];

            Object.keys(msaGains[msaId]).forEach(function(income){
                valueArray.push( {x:income,y:+msaGains[msaId][income]});                    
            })

            if(valueArray.length != 0){
             finalData.push({key:msaId,values:valueArray,area:false});                
            }
        })
        
        finalData.sort(scope.sortCities("lowIncome"));
        var polishedData = scope.polishData(finalData,"opportunity");

        return polishedData;
    },
    processInflowMigration:function(data){
        var scope = this, 
            reducedData = {},
            finalData = [];

        if(scope.state.msaPop && Object.keys(scope.state.msaPop).length > 0){
            Object.keys(data).forEach(function(msaId){
                var valueArray = [];
                Object.keys(data[msaId]).forEach(function(year){
                    if(data[msaId][year]){
                        if(data[msaId][year]['inflow']){
                            if(year > 12){
                                var curYear = "19" + year;
                            }
                            else{
                                var curYear = "20" + year;
                            }
                            valueArray.push( {x:+curYear,y:+data[msaId][year]['inflow']['individuals']});                        
                        }                     
                    }
                })

                if(valueArray.length != 0){
                 finalData.push({key:msaId,values:valueArray,area:false});                
                }
            })

            var rankedData = scope.rankCities(finalData);
            var polishedData = scope.polishData(rankedData,"inflowMigration");

            polishedData.forEach(function(metroArea){
                metroArea.values.sort(function(a,b){
                    return a.x - b.x
                })
            })

            var graphData;
            var graphRawData = polishedData;

            var graphRelativeData = graphRawData.map(function(metroArea){
                var newValues = [];
                metroArea.values.forEach(function(yearVal){
                    if(yearVal.x <= 2011){
                        var newCoord = {x:yearVal.x, y:0};

                        if(scope.state.msaPop[metroArea.key]){
                            var newY = yearVal.y / scope.state.msaPop[metroArea.key][yearVal.x];
                            newCoord = {x: yearVal.x, y:newY};
                        }
                        newValues.push(newCoord);                       
                    }
                })
                 return ({key:metroArea.key,values:newValues,area:false});                
            })


            var rankedData2 = scope.rankCities(graphRelativeData);
            var polishedData2 = scope.polishData(rankedData2,"relativeInflowMigration");

            var graphData = {};
            graphData["raw"] = graphRawData;
            graphData["relative"] = polishedData2;

            return graphData;              
        }
        else{
            scope.getData('countyPop',function(msaData){
                scope.setState({"msaPop":msaData})
            })
            setTimeout(function(){ scope.processInflowMigration(data) }, 1500);    
        }

    },
    processIncData:function(data){
        var scope = this;

        var reducedData = {}

        var graphData;

        var ages = d3.range(12);


        if(scope.state.newValues && scope.state.newValues.length > 0){
            if(scope.state.msaPop && Object.keys(scope.state.msaPop).length > 0){
                var finalData = [];
                Object.keys(data).forEach(function(msaId){
                    var valueArray = [];
                    Object.keys(data[msaId]).forEach(function(year){
                        valueArray.push( {x:+year,y:+data[msaId][year]});                    
                    })

                    if(valueArray.length != 0){
                     finalData.push({key:msaId,values:valueArray,area:false});                
                    }
                })


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

                console.log("raw firms object in inc5000",totalEmp);
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

                var graphRelativeData2 = graphRawData.map(function(metroArea){
                    var newValues = [];
                    metroArea.values.forEach(function(yearVal){
                        if(yearVal.x <= 2013){
                            var newCoord = {x:yearVal.x, y:0};

                            if(scope.state.msaPop[metroArea.key]){
                                var newY = yearVal.y / scope.state.msaPop[metroArea.key][yearVal.x];
                                newCoord = {x: yearVal.x, y:newY};
                            
                            }
                            newValues.push(newCoord);                       
                        }
         
                    })

                     return ({key:metroArea.key,values:newValues,area:false});      
                })


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
            else{
                scope.getData('countyPop',function(msaData){
                    scope.setState({"msaPop":msaData})
                })
                setTimeout(function(){ scope.processIncData(data) }, 3000);    
            }
        }
        else{
            if(scope.state.allMsa && Object.keys(scope.state.allMsa).length > 0){
                scope.setState({"newValues":scope.processNewValues(scope.state.allMsa)});
                setTimeout(function(){ scope.processIncData(data) }, 3000);                
            }
            else{
                scope.getData("allMsa",function(rawMsaData){
                    scope.setState({"allMsa":rawMsaData,"newValues":scope.processNewValues(rawMsaData)})
                });
                setTimeout(function(){ scope.processIncData(data) }, 10000);
            }
        }
    },
    processOutflowMigration:function(data){
        var scope = this, 
            reducedData = {},
            finalData = [];

        if(scope.state.msaPop && Object.keys(scope.state.msaPop).length > 0){
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
                            valueArray.push( {x:+curYear,y:+data[msaId][year]['outflow']['individuals']});                        
                        }                
                    }
                })

                if(valueArray.length != 0){
                 finalData.push({key:msaId,values:valueArray,area:false});                
                }
            })

            var rankedData = scope.rankCities(finalData);
            var polishedData = scope.polishData(rankedData,"outflowMigration");

            polishedData.forEach(function(metroArea){
                metroArea.values.sort(function(a,b){
                    return a.x - b.x
                })
            })
          
            var graphRawData = polishedData;

            var graphRelativeData = graphRawData.map(function(metroArea){
                var newValues = [];
                metroArea.values.forEach(function(yearVal){
                    if(yearVal.x <= 2011){
                        var newCoord = {x:yearVal.x, y:0};

                        if(scope.state.msaPop[metroArea.key]){
                            var newY = yearVal.y / scope.state.msaPop[metroArea.key][yearVal.x];
                            newCoord = {x: yearVal.x, y:newY};
                        
                        }
                        newValues.push(newCoord);                       
                    }
                })
                 return ({key:metroArea.key,values:newValues,area:false});                
            })

            var rankedData2 = scope.rankCities(graphRelativeData);
            var polishedData2 = scope.polishData(rankedData2,"outflowMigration");

            var graphData = {};
            graphData["raw"] = graphRawData;
            graphData["relative"] = polishedData2;

            return graphData;            
        }
        else{
            scope.getData('countyPop',function(msaData){
                scope.setState({"msaPop":msaData})
            })
            setTimeout(function(){ scope.processOutflowMigration(data) }, 1500);    
        }
    },
    processIrsNet:function(data){
        var scope = this, 
            reducedData = {},
            finalData = [];
        if(scope.state.msaPop && Object.keys(scope.state.msaPop).length > 0){
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
                            valueArray.push( {x:+curYear,y:(+data[msaId][year]['inflow']['individuals'] - +data[msaId][year]['outflow']['individuals'])});                        
                        }                   
                    }
                })

                if(valueArray.length != 0){
                 finalData.push({key:msaId,values:valueArray,area:false});                
                }
            })


            var rankedData = scope.rankCities(finalData);
            var polishedData = scope.polishData(rankedData,"irsNet");

            polishedData.forEach(function(metroArea){
                metroArea.values.sort(function(a,b){
                    return a.x - b.x
                })
            })

            var graphRawData = polishedData;

            var graphRelativeData = graphRawData.map(function(metroArea){
                var newValues = [];
                metroArea.values.forEach(function(yearVal){
                    if(yearVal.x <= 2011){
                        var newCoord = {x:yearVal.x, y:0};

                        if(scope.state.msaPop[metroArea.key]){
                            var newY = yearVal.y / scope.state.msaPop[metroArea.key][yearVal.x];
                            newCoord = {x: yearVal.x, y:newY};   
                        }
                        newValues.push(newCoord);                       
                    }
                })
                 return ({key:metroArea.key,values:newValues,area:false});                
            })

            var rankedData2 = scope.rankCities(graphRelativeData);
            var polishedData2 = scope.polishData(rankedData2,"relativeIrsNet");

            var graphData = {};
            graphData["raw"] = graphRawData;
            graphData["relative"] = polishedData2;

            return graphData;             
        }
        else{
            scope.getData('countyPop',function(msaData){
                scope.setState({"msaPop":msaData})
            })
            setTimeout(function(){ scope.processIrsNet(data) }, 1500);    
        }
    },
    processTotalMigrationFlow:function(data){
        var scope = this, 
            reducedData = {},
            finalData = [];

        if(scope.state.msaPop && Object.keys(scope.state.msaPop).length > 0){
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
                            valueArray.push( {x:+curYear,y:(+data[msaId][year]['inflow']['individuals'] + +data[msaId][year]['outflow']['individuals'])});                        
                        }                
                    }
                })

                if(valueArray.length != 0){
                 finalData.push({key:msaId,values:valueArray,area:false});                
                }
            })

            var rankedData = scope.rankCities(finalData);
            var polishedData = scope.polishData(rankedData,"totalMigrationFlow");

            polishedData.forEach(function(metroArea){
                metroArea.values.sort(function(a,b){
                    return a.x - b.x
                })
            })

            var graphRawData = polishedData;

            var graphRelativeData = graphRawData.map(function(metroArea){
                var newValues = [];
                metroArea.values.forEach(function(yearVal){
                    if(yearVal.x <= 2011){
                        var newCoord = {x:yearVal.x, y:0};

                        if(scope.state.msaPop[metroArea.key]){
                            var newY = yearVal.y / scope.state.msaPop[metroArea.key][yearVal.x];
                            newCoord = {x: yearVal.x, y:newY};
                        }
                        newValues.push(newCoord);                       
                    }
                })
                 return ({key:metroArea.key,values:newValues,area:false});                
            })

            var rankedData2 = scope.rankCities(graphRelativeData);
            var polishedData2 = scope.polishData(rankedData2,"relativeTotalMigrationFlow");

            var graphData = {};
            graphData["raw"] = graphRawData;
            graphData["relative"] = polishedData2;

            return graphData;              
        }
        else{
            scope.getData('countyPop',function(msaData){
                scope.setState({"msaPop":msaData})
            })
            setTimeout(function(){ scope.processTotalMigrationFlow(data) }, 1500);    
        }
    },
    processMigrationData:function(data){
        var scope = this;

        if(scope.state.msaPop && Object.keys(scope.state.msaPop).length > 0){
            var finalData = [];
            Object.keys(data).forEach(function(msaId){
                var valueArray = [];
                Object.keys(data[msaId]).forEach(function(year){
                    if(data[msaId][year] != 0){
                        valueArray.push( {x:+year,y:+data[msaId][year]});                    
                    }
                })

                if(valueArray.length != 0){
                 finalData.push({key:msaId,values:valueArray,area:false});                
                }
            })

            var rankedData = scope.rankCities(finalData);
            var polishedData = scope.polishData(rankedData,"migrationData");
            var graphRawData = polishedData;

            var graphRelativeData = graphRawData.map(function(metroArea){
                var newValues = [];
                metroArea.values.forEach(function(yearVal){
                    if(yearVal.x <= 2011){
                        var newCoord = {x:yearVal.x, y:0};

                        if(scope.state.msaPop[metroArea.key]){
                            var newY = yearVal.y / scope.state.msaPop[metroArea.key][yearVal.x];
                            newCoord = {x: yearVal.x, y:newY};
                        }
                        newValues.push(newCoord);                       
                    }
                })
                return ({key:metroArea.key,values:newValues,area:false});                
            })

            var rankedData2 = scope.rankCities(graphRelativeData);
            var polishedData2 = scope.polishData(rankedData2,"relativeMigrationData");

            var graphData = {};
            graphData["raw"] = graphRawData;
            graphData["relative"] = polishedData2;
            return graphData;
        }
        else{
            scope.getData('countyPop',function(msaData){
                scope.setState({"msaPop":msaData})
            })
            setTimeout(function(){ scope.processMigrationData(data) }, 1500);    
        }
    },
    processImmData:function(data){
    	var scope = this,
    	    reducedData = {},
            finalData = [];

    	Object.keys(data).forEach(function(msaId){
            var valueArray = [];
    		Object.keys(data[msaId]).forEach(function(year){
                if(data[msaId][year] != 0){
                    valueArray.push( {x:+year,y:+data[msaId][year]});                    
                }	
    		})

            if(valueArray.length != 0){
             finalData.push({key:msaId,values:valueArray,area:false});                
            }
    	})

    	var rankedData = scope.rankCities(finalData);
    	var polishedData = scope.polishData(rankedData,"immData");

    	return polishedData;
    },
    processNewValues:function(data){
        var scope = this,
            ages = d3.range(12),
            newFirmData = {};

        //Final object will have the following for every msaId
        //msaId:{1977:{age0:numEmployed,age1:numEmployed...},1978:{age0:numEmployed,age1:numEmployed...}}

        //big object would look like:
        // {10000:{{},{}...}, 11000:{{},{}...], ...}

        if(scope.state.msaPop && Object.keys(scope.state.msaPop).length > 0){
            Object.keys(data).forEach(function(firmAge){

                Object.keys(data[firmAge]).forEach(function(metroAreaId){
                    //If we havent gotten to this MSA yet
                    if(!newFirmData[metroAreaId]){
                        newFirmData[metroAreaId] = {};
                    }

                    //Iterating through every year for a given firm age in a metro area
                    data[firmAge][metroAreaId].forEach(function(rowData){
                        if(rowData["year2"]>= 1990 && rowData["year2"]<= 2009){
                            if(!newFirmData[metroAreaId][rowData["year2"]]){
                                newFirmData[metroAreaId][rowData["year2"]] = {};
                            }
                            newFirmData[metroAreaId][rowData["year2"]][firmAge] = rowData["firms"];                       
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
                        pop1000 = 0;


                    //Creates number of new firms for that year
                    ages.forEach(function(age){

                        if(newFirmData[msaId][year][age] && (age < 6)){
                            
                            newFirmSum = newFirmSum + +newFirmData[msaId][year][age];
                        }
                    })
                    //Instead of share, want newFirmSum/(pop/1000)

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
                })

                //Only return once per metroArea
                return {key:msaId,values:valueArray,area:false};
            })



            var rankedData = scope.rankCities(chartData);

            var polishedData = scope.polishData(rankedData,"newFirms");

            return polishedData;            
        }
        else{
            scope.getData('countyPop',function(msaData){
                scope.setState({"msaPop":msaData})
            })
            setTimeout(function(){ scope.processNewValues(data) }, 1500);    
        }

    },
    processShareValues:function(data){
       var scope = this,
            ages = d3.range(12),
            shareData = {};

        //Final object will have the following for every msaId
        //msaId:{1977:{age0:numEmployed,age1:numEmployed...},1978:{age0:numEmployed,age1:numEmployed...}}

        //big object would look like:
        // {10000:{{},{}...}, 11000:{{},{}...], ...}


        if(scope.state.msaPop && Object.keys(scope.state.msaPop).length > 0){
            Object.keys(data).forEach(function(firmAge){

                Object.keys(data[firmAge]).forEach(function(metroAreaId){
                    //If we havent gotten to this MSA yet
                    if(!shareData[metroAreaId]){
                        shareData[metroAreaId] = {};
                    }
                    //Iterating through every year for a given firm age in a metro area
                    data[firmAge][metroAreaId].forEach(function(rowData){
                        if(!shareData[metroAreaId][rowData["year2"]]){
                            shareData[metroAreaId][rowData["year2"]] = {};
                        }
                        shareData[metroAreaId][rowData["year2"]][firmAge] = rowData["emp"];
                    })
                })
            })

            //Every msa represented as:
            //{values:[{x:val,y:val}....],key=msa,}
            //Want to return 1 (x,y) object for each year, where x=year and y=percent employed in new firms
            var chartData = Object.keys(shareData).map(function(msaId){

                //Iterating through every year within a metro area
                var valueArray = Object.keys(shareData[msaId]).map(function(year){
                    var curCoord={"x":+year,"y":0},
                        totalEmploySum = 0,
                        newFirmSum = 0,
                        share = 0;


                    //Creates Total Employment number for that year
                    //Creates Employment in new firms for that year
                    ages.forEach(function(age){
                        if(shareData[msaId][year][age]){
                            totalEmploySum = totalEmploySum + shareData[msaId][year][age];                   
                        }
                        if(shareData[msaId][year][age] && (age < 6)){
                            newFirmSum = newFirmSum + shareData[msaId][year][age];
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


            var rankedData = scope.rankCities(chartData);

            var polishedData = scope.polishData(rankedData,"shareEmp");

            return polishedData;            
        }
        else{
            scope.getData('countyPop',function(msaData){
                scope.setState({"msaPop":msaData})
            })
            setTimeout(function(){ scope.processShareValues(data) }, 1500);    
        }
    },
    processDensityComposite:function(){
        var scope = this,
            years = d3.range(1990,2010);        

        if(scope.state.shareValues && scope.state.shareValues.length > 0){
            if(scope.state.newValues && scope.state.newValues.length > 0){

                var newFirms = scope.state.newValues,
                    share = scope.state.shareValues;
                console.log("comp raw data",newFirms,share);

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

                //console.log(compositeCityRanks);

                var years = d3.range(1990,2010);

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
                var graphData = scope.polishData(compositeCityRanks,"densityComposite");
                return graphData;
            }
            else{
                if(scope.state.allMsa && Object.keys(scope.state.allMsa).length > 0){
                        scope.setState({"newValues":scope.processNewValues(scope.state.allMsa)});
                        setTimeout(function(){ scope.processDensityComposite() }, 1500);                
                }
                else{
                    scope.getData("allMsa",function(data){
                        scope.setState({"allMsa":data,"newValues":scope.processNewValues(data)})
                    });
                    setTimeout(function(){ scope.processDensityComposite() }, 10000);
                }
            }  
        }
        else{
            if(scope.state.allMsa && Object.keys(scope.state.allMsa).length > 0){
                scope.setState({"shareValues":scope.processShareValues(scope.state.allMsa)});
                setTimeout(function(){ scope.processDensityComposite() }, 1500);                
            }
            else{
                scope.getData("allMsa",function(data){
                    scope.setState({"allMsa":data,"shareValues":scope.processShareValues(data)})
                });
                setTimeout(function(){ scope.processDensityComposite() }, 10000);
            }
        }  
    },
    opportunityGraph:function(filters){
        var scope = this;
        var graphData;
        console.log("opportunity Graph");
        if(scope.state.rawOpportunityData && Object.keys(scope.state.rawOpportunityData).length > 0){
            if(scope.state.opportunityData && scope.state.opportunityData.length > 0){
                graphData = scope.state.opportunityData;        
                return graphData;          
            }
            else{
                scope.setState({"opportunityData":scope.processOpportunityData(scope.state.rawOpportunityData)});
                setTimeout(function(){ scope.opportunityGraph(filters) }, 1500);                
            }
        }
        else{
            scope.getData("equalOpp",function(data){
                scope.setState({"rawOpportunityData":data,"opportunityData":scope.processOpportunityData(data)})
            });
            setTimeout(function(){ scope.opportunityGraph(filters) }, 1500);
        }
    },
    immGraph:function(filters){
        var scope = this;
        var graphData;
        console.log("share of immigration Graph");
        if(scope.state.rawImmData && Object.keys(scope.state.rawImmData).length > 0){
            if(scope.state.immData && scope.state.immData.length > 0){
                graphData = scope.state.immData;        
                return graphData;          
            }
            else{
                scope.setState({"immData":scope.processImmData(scope.state.rawImmData)});
                setTimeout(function(){ scope.immGraph(filters) }, 1500);                
            }
        }
        else{
            scope.getData("shareImm",function(data){
                scope.setState({"rawImmData":data,"immData":scope.processImmData(data)})
            });
            setTimeout(function(){ scope.immGraph(filters) }, 1500);
        }
    },
    incGraph:function(filters){
        var scope = this;
        var graphData;
        console.log("inc5000 Graph");
        if(scope.state.rawIncData && Object.keys(scope.state.rawIncData).length > 0){
            if(scope.state.incData && Object.keys(scope.state.incData).length > 0){
                graphData = scope.state.incData;
                return graphData;  
            }
            else{
                scope.setState({"incData":scope.processIncData(scope.state.rawIncData)});
                setTimeout(function(){ scope.incGraph(filters) }, 1500);                
            }
        }
        else{
            scope.getData("inc5000",function(data){
                scope.setState({"rawIncData":data,"incData":scope.processIncData(data)})
            });
            setTimeout(function(){ scope.incGraph(filters) }, 5000);
        } 
    },
    netMigrationGraph:function(filters){
        var scope = this;
        var graphData;
        console.log("ACS net migration Graph");
        if(scope.state.rawMigrationData && Object.keys(scope.state.rawMigrationData).length > 0){
            if(scope.state.migrationData && Object.keys(scope.state.migrationData).length > 0){
                graphData = scope.state.migrationData;
                return graphData;  
            }
            else{
                scope.setState({"migrationData":scope.processMigrationData(scope.state.rawMigrationData)});
                setTimeout(function(){ scope.netMigrationGraph(filters) }, 1500);                
            }
        }
        else{
            scope.getData("migration",function(data){
                scope.setState({"rawMigrationData":data,"migrationData":scope.processMigrationData(data)})
            });
            setTimeout(function(){ scope.netMigrationGraph(filters) }, 5000);
        }               
    },
    inflowMigrationGraph:function(filters){
        var scope = this;
        var graphData;
        console.log("inflowMigration Graph");
        if(scope.state.detailMigration && Object.keys(scope.state.detailMigration).length > 0){
            if(scope.state.inflowMigration && Object.keys(scope.state.inflowMigration).length > 0){
                graphData = scope.state.inflowMigration;
                return graphData;  
            }
            else{
                scope.setState({"inflowMigration":scope.processInflowMigration(scope.state.detailMigration)});
                setTimeout(function(){ scope.inflowMigrationGraph(filters) }, 1500);                
            }
        }
        else{
            scope.getData("detailMigration",function(data){
                scope.setState({"detailMigration":data,"inflowMigration":scope.processInflowMigration(data)})
            });
            setTimeout(function(){ scope.inflowMigrationGraph(filters) }, 5000);
        } 
    },
    irsNetGraph:function(filters){
        var scope = this;
        var graphData;
        console.log("irsNet Graph");
        if(scope.state.detailMigration && Object.keys(scope.state.detailMigration).length > 0){
            if(scope.state.irsNet && Object.keys(scope.state.irsNet).length > 0){
                graphData = scope.state.irsNet;
                return graphData;  
            }
            else{
                scope.setState({"irsNet":scope.processIrsNet(scope.state.detailMigration)});
                setTimeout(function(){ scope.irsNetGraph(filters) }, 1500);                
            }
        }
        else{
            scope.getData("detailMigration",function(data){
                scope.setState({"detailMigration":data,"irsNet":scope.processIrsNet(data)})
            });
            setTimeout(function(){ scope.irsNetGraph(filters) }, 5000);
        }             
    },
    outflowMigrationGraph:function(filters){
        var scope = this;
        var graphData;
        console.log("outflowMigration Graph");
        if(scope.state.detailMigration && Object.keys(scope.state.detailMigration).length > 0){
            if(scope.state.outflowMigration && Object.keys(scope.state.outflowMigration).length > 0){
                graphData = scope.state.outflowMigration;
                return graphData;  
            }
            else{
                scope.setState({"outflowMigration":scope.processOutflowMigration(scope.state.detailMigration)});
                setTimeout(function(){ scope.outflowMigrationGraph(filters) }, 1500);                
            }
        }
        else{
            scope.getData("detailMigration",function(data){
                scope.setState({"detailMigration":data,"outflowMigration":scope.processOutflowMigration(data)})
            });
            setTimeout(function(){ scope.outflowMigrationGraph(filters) }, 5000);
        }        
    },
    totalMigrationFlowGraph:function(filters){
        var scope = this;
        var graphData;
        console.log("totalMigrationFlow Graph");
        if(scope.state.detailMigration && Object.keys(scope.state.detailMigration).length > 0){
            if(scope.state.totalMigrationFlow && Object.keys(scope.state.totalMigrationFlow).length > 0){
                graphData = scope.state.totalMigrationFlow;
                return graphData;  
            }
            else{
                scope.setState({"totalMigrationFlow":scope.processTotalMigrationFlow(scope.state.detailMigration)});
                setTimeout(function(){ scope.totalMigrationFlowGraph(filters) }, 1500);                
            }
        }
        else{
            scope.getData("detailMigration",function(data){
                scope.setState({"detailMigration":data,"totalMigrationFlow":scope.processTotalMigrationFlow(data)})
            });
            setTimeout(function(){ scope.totalMigrationFlowGraph(filters) }, 5000);
        }
    },
	shareGraph:function(filters){
        var scope = this;
        var graphData;
        console.log("share new emp Graph");
        if(scope.state.allMsa && Object.keys(scope.state.allMsa).length > 0){
            if(scope.state.shareValues && scope.state.shareValues.length > 0){
                graphData = scope.state.shareValues;
                return graphData;  
            }
            else{
                scope.setState({"shareValues":scope.processShareValues(scope.state.allMsa)});
                setTimeout(function(){ scope.shareGraph(filters) }, 1500);                
            }
        }
        else{
            scope.getData("allMsa",function(data){
                scope.setState({"allMsa":data,"shareValues":scope.processShareValues(data)})
            });
            setTimeout(function(){ scope.shareGraph(filters) }, 5000);
        }
	},
	newGraph:function(filters){
        var scope = this;
        var graphData;
        console.log("new firms per 1000 Graph");
        if(scope.state.allMsa && Object.keys(scope.state.allMsa).length > 0){
            if(scope.state.newValues && scope.state.newValues.length > 0){
                graphData = scope.state.newValues;
                return graphData;  
            }
            else{
                scope.setState({"newValues":scope.processNewValues(scope.state.allMsa)});
                setTimeout(function(){ scope.newGraph(filters) }, 1500);                
            }
        }
        else{
            scope.getData("allMsa",function(data){
                scope.setState({"allMsa":data,"newValues":scope.processNewValues(data)})
            });
            setTimeout(function(){ scope.newGraph(filters) }, 5000);
        }
	},
	densCompGraph:function(filters){
        var scope = this;
        var graphData;
        console.log("composite density Graph");
        if(scope.state.densityComposite && scope.state.densityComposite.length > 0){
            graphData = scope.state.densityComposite;
            return graphData;  
        }
        else{
            scope.setState({"densityComposite":scope.processDensityComposite()});
            setTimeout(function(){ scope.densCompGraph(filters) }, 20000);
        }   

        return graphData;
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
