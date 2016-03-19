var React = require("react"),
	d3 = require("d3"),
    colorbrewer = require('colorbrewer'),
    msaIdToName = require('../utils/msaIdToName.json');

var DataStore = React.createClass({

	getInitialState:function(){
		return {
			loading:true,
			fullData:{},
            opportunityData:[],
			immData:[],
            migrationData:{},
            inflowMigration:{},
            outflowMigration:[],
            incData:{},
            irsNet:{},
            totalMigrationFlow:{},
			shareValues:[],
			newValues:[],
            densityComposite:[],
            msaPop:{}			
		}

	},
    componentWillMountOLD:function(){
        var scope = this;

        scope.getData(function(data){
            scope.setState({opportunityData:scope.processOpportunityData(data['opportunityData']),fullData:scope.processData(data['fullData']),msaPop:data['msaPop'],immData:scope.processImmData(data['immData']),migrationData:scope.processMigrationData(data['migrationData']),inflowMigration:scope.processInflowMigration(data['detailMigrationData']),outflowMigration:scope.processOutflowMigration(data['detailMigrationData']),irsNet:scope.processIrsNet(data['detailMigrationData']),incData:scope.processIncData(data['incData']),totalMigrationFlow:scope.processTotalMigrationFlow(data['detailMigrationData']),loading:false});
        })
    },
    getData:function(reqData,cb){
        var scope = this;

        var route = "/" + reqData;

        console.log("getData",reqData);
        d3.json(route,function(err,data){
            cb(data);
        })
    },
    getDataDemo:function(cb){
        var scope = this;


        // d3.json("/allMsa",function(err,msaData){
        //     d3.json("/countyPop",function(err,popData){
        //         d3.json("/shareImm",function(err,immData){
        //             d3.json("/migration",function(err,migrationData){
        //                 d3.json("/detailMigration",function(err,detailMigrationData){
        //                     //GREENVILLE/GREENWOOD SC IS A MISMATCH
        //                     d3.json("/inc5000",function(err,incData){
        //                         d3.json("/equalOpp",function(err,oppData){
        //                             var data = {};
        //                             data['fullData'] = msaData;
        //                             data['msaPop'] = popData;
        //                             data['immData'] = immData;
        //                             data['migrationData'] = migrationData;
        //                             data['detailMigrationData'] = detailMigrationData;
        //                             data['incData'] = incData;
        //                             data['opportunityData'] = oppData;
        //                             cb(data);  
        //                         })
        //                     })
        //                 })
        //             })
        //         })
        //     })
        // })
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


        var rankedData = scope.rankOpp(finalData);

        var polishedData = scope.polishOppData(rankedData);

        console.log(polishedData);
        return polishedData;

    },
    processInflowMigration:function(data){
        var scope = this; 

        var reducedData = {}

        var finalData = [];
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


        var rankedData = scope.rankMigration(finalData);

        var polishedData = scope.polishData(rankedData);
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


        var rankedData2 = scope.rankMigration(graphRelativeData);

        var polishedData2 = scope.polishData(rankedData2);


        var graphData = {};
        graphData["raw"] = graphRawData;
        graphData["relative"] = polishedData2;

        return graphData;  
    },
    processIncData:function(data){
        var scope = this;

        var reducedData = {}

        var graphData;

        var ages = d3.range(12);


        if(scope.state.fullData && Object.keys(scope.state.fullData).length > 0){
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


                var rankedData = scope.rankInc(finalData);

                var polishedData = scope.polishData(rankedData);


                var shareData = scope.state.fullData['share'];
                var totalEmp = {};

                Object.keys(shareData).forEach(function(msaId){

                    //Iterating through every year within a metro area
                    var valueObject = {};
                    Object.keys(shareData[msaId]).forEach(function(year){
                        var totalEmploySum = 0;
                        //Creates Total Employment number for that year
                        //Creates Employment in new firms for that year
                        ages.forEach(function(age){
                            if(shareData[msaId][year][age]){
                                totalEmploySum = totalEmploySum + shareData[msaId][year][age];                   
                            }
                        })

                        //Want to return: x:year y:percent
                        valueObject[year] = totalEmploySum;

                    })


                    //Only return once per metroArea
                    totalEmp[msaId] = {key:msaId,values:valueObject,area:false};
                })

                var graphRawData = polishedData;

                var graphRelativeData = graphRawData.map(function(metroArea){
                    var newValues = [];
                    metroArea.values.forEach(function(yearVal){
                        if(yearVal.x <= 2011){
                            var newCoord = {x:yearVal.x, y:0};

                            if(totalEmp[metroArea.key]){
                                var newY = yearVal.y / totalEmp[metroArea.key]["values"][yearVal.x];
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


                var rankedData2 = scope.rankInc(graphRelativeData);
                var polishedData2 = scope.polishData(rankedData2);

                var rankedData3 = scope.rankInc(graphRelativeData2);
                var polishedData3 = scope.polishData(rankedData3);

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
                setTimeout(function(){ scope.processIncData(data) }, 2000);  
            }
        }
        else{
            scope.getData('allMsa',function(fullData){
                scope.setState({"fullData":scope.processData(fullData)})
            })
            setTimeout(function(){ scope.processIncData(data) }, 10000); 
        }        
    },
    processOutflowMigration:function(data){
        var scope = this; 

        var reducedData = {}

        var finalData = [];
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


        var rankedData = scope.rankMigration(finalData);
        var polishedData = scope.polishData(rankedData);
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


        var rankedData2 = scope.rankMigration(graphRelativeData);

        var polishedData2 = scope.polishData(rankedData2);


        var graphData = {};
        graphData["raw"] = graphRawData;
        graphData["relative"] = polishedData2;

        return graphData;
    },
    processIrsNet:function(data){
        var scope = this; 

        var reducedData = {}

        var finalData = [];
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


        var rankedData = scope.rankMigration(finalData);
        var polishedData = scope.polishData(rankedData);
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


        var rankedData2 = scope.rankMigration(graphRelativeData);

        var polishedData2 = scope.polishData(rankedData2);


        var graphData = {};
        graphData["raw"] = graphRawData;
        graphData["relative"] = polishedData2;

        return graphData;  
    },
    processTotalMigrationFlow:function(data){
        var scope = this; 

        var reducedData = {}

        var finalData = [];
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


        var rankedData = scope.rankMigration(finalData);
        var polishedData = scope.polishData(rankedData);
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


        var rankedData2 = scope.rankMigration(graphRelativeData);

        var polishedData2 = scope.polishData(rankedData2);


        var graphData = {};
        graphData["raw"] = graphRawData;
        graphData["relative"] = polishedData2;

        return graphData;  

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


            var rankedData = scope.rankMigration(finalData);

            var polishedData = scope.polishData(rankedData);

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


            var rankedData2 = scope.rankMigration(graphRelativeData);

            var polishedData2 = scope.polishData(rankedData2);


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
    	var scope = this;

    	var reducedData = {}
        
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


    	var rankedData = scope.rankImm(finalData);

    	var polishedData = scope.polishImmData(rankedData);
    	return polishedData;
    },
    processData:function(data){
    	var scope = this;

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

                    if(rowData["year2"]>= 1990 && rowData["year2"]<= 2009){
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
    opportunityGraph:function(filters){
        var scope = this;
        var graphData;
        console.log("opportunity Graph");
        if(scope.state.opportunityData && scope.state.opportunityData.length > 0){
            graphData = scope.state.opportunityData;
            return graphData;  
        }
        else{
            scope.getData("equalOpp",function(data){
                scope.setState({"opportunityData":scope.processOpportunityData(data)})
            });
            setTimeout(function(){ scope.opportunityGraph(filters) }, 1500);
        }
    },
    immGraph:function(filters){
		var scope = this;
		var graphData;
        console.log("immigration Graph");
        if(scope.state.immData && scope.state.immData.length > 0){
            graphData = scope.state.immData;
            return graphData;  
        }
        else{
            scope.getData("shareImm",function(data){
                scope.setState({"immData":scope.processImmData(data)})
            });
            setTimeout(function(){ scope.immGraph(filters) }, 1500);
        }  	
    },
    incGraph:function(filters){
        var scope = this;
        var graphData;
        console.log("inc5000 Graph");
        if(scope.state.incData && Object.keys(scope.state.incData).length > 0){
            graphData = scope.state.incData;
            return graphData;  
        }
        else{
            scope.getData("inc5000",function(data){
                scope.setState({"incData":scope.processIncData(data)})
            });
            setTimeout(function(){ scope.incGraph(filters) }, 5000);
        }   


    },
    netMigrationGraph:function(filters){
        var scope = this;
        var graphData;
        console.log("net migration Graph");
        if(scope.state.migrationData && Object.keys(scope.state.migrationData).length > 0){
            graphData = scope.state.migrationData;
            return graphData;  
        }
        else{
            scope.getData("migration",function(data){
                scope.setState({"migrationData":scope.processMigrationData(data)})
            });
            setTimeout(function(){ scope.netMigrationGraph(filters) }, 1500);
        }   



        return graphData;               
    },
    inflowMigrationGraph:function(filters){
        var scope = this;
        var graphData;
        console.log("inflow migration Graph");
        if(scope.state.inflowMigration && Object.keys(scope.state.inflowMigration).length > 0){
            graphData = scope.state.inflowMigration;
            return graphData;  
        }
        else{
            scope.getData("detailMigration",function(data){
                scope.setState({"inflowMigration":scope.processInflowMigration(data)})
            });
            setTimeout(function(){ scope.inflowMigrationGraph(filters) }, 1500);
        }   

        return graphData; 
    },
    irsNetGraph:function(filters){
        var scope = this;
        var graphData;
        console.log("net IRS migration Graph");
        if(scope.state.irsNet && Object.keys(scope.state.irsNet).length > 0){
            graphData = scope.state.irsNet;
            return graphData;  
        }
        else{
            scope.getData("detailMigration",function(data){
                scope.setState({"irsNet":scope.processIrsNet(data)})
            });
            setTimeout(function(){ scope.irsNetGraph(filters) }, 1500);
        }   

        return graphData;            
    },
    outflowMigrationGraph:function(filters){
        var scope = this;
        var graphData;
        console.log("outflow migration Graph");
        if(scope.state.outflowMigration && Object.keys(scope.state.outflowMigration).length > 0){
            graphData = scope.state.outflowMigration;
            return graphData;  
        }
        else{
            scope.getData("detailMigration",function(data){
                scope.setState({"outflowMigration":scope.processOutflowMigration(data)})
            });
            setTimeout(function(){ scope.outflowMigrationGraph(filters) }, 1500);
        }   

        return graphData;           
    },
    totalMigrationFlowGraph:function(filters){
        var scope = this;
        var graphData;
        console.log("totalMigrationFlow Graph");
        if(scope.state.totalMigrationFlow && Object.keys(scope.state.totalMigrationFlow).length > 0){
            graphData = scope.state.totalMigrationFlow;
            return graphData;  
        }
        else{
            scope.getData("detailMigration",function(data){
                scope.setState({"totalMigrationFlow":scope.processTotalMigrationFlow(data)})
            });
            setTimeout(function(){ scope.totalMigrationFlowGraph(filters) }, 1500);
        }   

        return graphData;
    },
	shareGraph:function(filters){
        var scope = this;
        var graphData;
        console.log("share new emp Graph");
        if(scope.state.shareValues && scope.state.shareValues.length > 0){
            graphData = scope.state.shareValues;
            return graphData;  
        }
        else{
            scope.getData("allMsa",function(data){
                scope.setState({"shareValues":scope.processShareValues(data)})
            });
            setTimeout(function(){ scope.shareGraph(filters) }, 5000);
        }   

        return graphData;
	},
	newGraph:function(filters){
        var scope = this;
        var graphData;
        console.log("new firms per 1000 Graph");
        if(scope.state.newValues && scope.state.newValues.length > 0){
            graphData = scope.state.newValues;
            return graphData;  
        }
        else{
            scope.getData("allMsa",function(data){
                scope.setState({"newValues":scope.processNewValues(data)})
            });
            setTimeout(function(){ scope.newGraph(filters) }, 5000);
        }   

        return graphData;
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
            scope.setState({"densityComposite":scope.rankComposite()});
            setTimeout(function(){ scope.densCompGraph(filters) }, 20000);
        }   

        return graphData;
	},
	processNewValues:function(data){
		var scope = this,
		    ages = d3.range(12),
            newFirmData = {};

        //Final object will have the following for every msaId
        //msaId:{1977:{age0:numEmployed,age1:numEmployed...},1978:{age0:numEmployed,age1:numEmployed...}}

        //big object would look like:
        // {10000:{{},{}...}, 11000:{{},{}...], ...}

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
                var curCoord={"x":+year,"y":0},
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
                //Want to return: x:year y:percent
                return curCoord;
            })

            //Only return once per metroArea
            return {key:msaId,values:valueArray,area:false};
        })



        var rankedData = scope.rankNewFirm(chartData);

        var polishedData = scope.polishData(rankedData);

        return polishedData;
	},
	processShareValues:function(data){
       var scope = this,
            ages = d3.range(12),
            shareData = {};

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


        var rankedData = scope.rankShare(chartData);

        var polishedData = scope.polishData(rankedData);

		return polishedData;
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
	rankImm:function(cities){
		var scope=this,
            years = d3.range(2009,2015);

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
    rankInc:function(cities){
        var scope=this,
            years = d3.range(2007,2016);

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
    rankOpp:function(cities){
        var scope=this,
            incomes = ['highIncome','lowIncome'];

        incomes.forEach(function(income){
            var rank = 1;
            //Sort cities according to each year
            cities.sort(scope.sortCities(income));

            //Go through and assign ranks for current year
            cities.forEach(function(city){
                city.values.forEach(function(yearValues){
                    if(yearValues.x == income){
                        yearValues.rank = rank;
                    }
                })

                rank++;
            })
        })          

        return cities; 
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
    rankMigration:function(cities){
        var scope=this,
            years = d3.range(1990,2015);

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
            years = d3.range(1990,2010);


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


                var graphData = scope.polishData(compositeCityRanks);
                return graphData;
            }
            else{
                scope.getData("allMsa",function(data){
                    scope.setState({"newValues":scope.processNewValues(data)})
                });
                setTimeout(function(){ scope.rankComposite() }, 20000);
            }  
        }
        else{
            scope.getData("allMsa",function(data){
                scope.setState({"shareValues":scope.processShareValues(data)})
            });
            setTimeout(function(){ scope.rankComposite() }, 20000);
        }  



	},
    colorGroup:function(){
        var scope = this;


        var colorGroup = d3.scale.linear()
            .domain(d3.range(1,366,(366/9)))
            .range(colorbrewer.Spectral[9]);
        


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
    colorImmGroup:function(){
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


        
//low income -20 to 20
//high income is -10 to 10

        return colorGroup;

    },
    colorImmFunction:function(params){
        var scope = this,
            cityColor;
        if(params.values){
            var valueLength = params.values.length;
            var curRank = params.values[valueLength-1].rank
            var color = scope.colorImmGroup();
                       
            cityColor = color(curRank);            
        }

                
        return cityColor;

    },
    colorOppFunction:function(params){
        var scope = this,
            cityColor;

        if(params){
            //var valueLength = params.values.length;
            //var curRank = params.values[0].y;
            var color = scope.colorOppGroup(params.x);
                    




            cityColor = color(params.y);            
        }

                
        return cityColor;

    },
    polishImmData:function(data){
    	var scope = this;

        var newData = [];
        Object.keys(data).forEach(function(metroArea){
        	if(data[metroArea].length != 0){
        		
        			var city = {
        				values:null,
        				name: msaIdToName[data[metroArea].key],
        				key:data[metroArea].key,
        				color:scope.colorImmFunction(data[metroArea])
        			}


                    city.values = data[metroArea].values.map(function(i){
                        return {
                            city:city,
                            x:i.x,
                            y:i.y,
                            rank:i.rank
                        }
                    })	 
                newData.push(city);           
			}
        });
        return newData;
    },
    polishData:function(data){
    	var scope = this;

        var newData = [];
        Object.keys(data).forEach(function(metroArea){
        	if(data[metroArea].length != 0){
        		
        			var city = {
        				values:null,
        				name: msaIdToName[data[metroArea].key],
        				key:data[metroArea].key,
        				color:scope.colorFunction(data[metroArea])
        			}


                    city.values = data[metroArea].values.map(function(i){
                        return {
                            city:city,
                            x:i.x,
                            y:i.y,
                            rank:i.rank
                        }
                    })	 
                newData.push(city);           
			}
        });
        return newData;
    },
    polishOppData:function(data){
        var scope = this;

        var newData = [];
        Object.keys(data).forEach(function(metroArea){
            if(data[metroArea].length != 0){
                
                    var city = {
                        values:null,
                        name: msaIdToName[data[metroArea].key],
                        key:data[metroArea].key
                    }


                    city.values = data[metroArea].values.map(function(i){
                        return {
                            city:city,
                            color:scope.colorOppFunction(i),
                            x:i.x,
                            y:i.y,
                            rank:i.rank
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
