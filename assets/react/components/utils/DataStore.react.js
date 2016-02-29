var React = require("react"),
	d3 = require("d3"),
    colorbrewer = require('colorbrewer'),
    msaIdToName = require('../utils/msaIdToName.json');

var DataStore = React.createClass({

	getInitialState:function(){
		return {
			loading:true,
			fullData:{},
			immData:[],
            migrationData:{},
			shareValues:[],
			newValues:[],
            msaPop:{},
			shareRanks:[],
			newRanks:[],
			compRanks:[]			
		}

	},
    componentWillMount:function(){
        var scope = this;

        scope.getData(function(data){
            scope.setState({fullData:scope.processData(data['fullData']),msaPop:data['msaPop'],immData:scope.processImmData(data['immData']),migrationData:scope.processMigrationData(data['migrationData']),loading:false});
        })
    },
    getData:function(cb){
        var scope = this;


        d3.json("/allMsa",function(err,msaData){

            d3.json("/countyPop",function(err,popData){
               
                d3.json("/shareImm",function(err,immData){

                    d3.json("/migration",function(err,migrationData){
                        var data = {};
                        data['fullData'] = msaData;
                        data['msaPop'] = popData;
                        data['immData'] = immData;
                        data['migrationData'] = migrationData;
                        cb(data);
                    })
                })
            })
        })
    },
    processMigrationData:function(data){
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


        var rankedData = scope.rankMigration(finalData);

        var polishedData = scope.polishData(rankedData);
        console.log(polishedData);
        return polishedData;

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
        console.log(polishedData);
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
    immGraph:function(filters){
		var scope = this;
		var graphData;




		graphData = scope.state.immData;
		return graphData;    	
    },
    migrationGraph:function(filters){
        var scope = this;
        var graphData;




        graphData = scope.state.migrationData;
        return graphData;               
    },
	shareGraph:function(filters){
		var scope = this,
			cities=[];


        if(scope.state.loading){
            console.log('reloading')
            setTimeout(function(){ scope.shareGraph(filters) }, 1500);
        }
        else{
			if(scope.state.shareValues.length == 0){
				scope.processShareValues();
			}
			if(scope.state.shareRanks == undefined || scope.state.shareRanks.length == 0){
				scope.processShareRanks();
			}
			if(scope.state.shareRanks.length != 0 && scope.state.shareValues.length != 0){
				//Apply filters

				//Add colors and Names
				//Nest itself
				var graphData = scope.polishData(scope.state.shareRanks);
								return graphData;
			}        	
        }


	},
	newGraph:function(filters){
		var scope = this,
			cities=[];


        if(scope.state.loading){
            console.log('reloading')
            setTimeout(function(){ scope.newGraph(filters) }, 1500);
        }
        else{
			if(scope.state.newValues.length == 0){
				scope.processNewValues();
			}
			if(scope.state.newRanks == undefined || scope.state.newRanks.length == 0){
				scope.processNewRanks();
			}
			if(scope.state.newRanks.length != 0 && scope.state.newValues.length != 0){
				//Apply filters

				//Add colors and Names
				//Nest itself
				var graphData = scope.polishData(scope.state.newRanks);
								return graphData;
			}
		}



	},
	densCompGraph:function(filters){
		var scope = this,
			cities=[];
        if(scope.state.loading){
            console.log('reloading')
            setTimeout(function(){ scope.compGraph(filters) }, 1500);
        }
        else{
			if(scope.state.shareRanks == undefined || scope.state.shareRanks.length == 0){
				scope.processShareRanks();
			}
			if(scope.state.newRanks == undefined || scope.state.newRanks.length == 0){
				scope.processNewRanks();
			}
        	if(scope.state.compRanks == undefined || scope.state.compRanks.length == 0){
        		scope.processCompRanks();
        	}
			if(scope.state.compRanks.length != 0){
				//Apply filters

				//Add colors and Names
				//Nest itself
				var graphData = scope.polishData(scope.state.compRanks);
				return graphData;
			}       
        }

		


	},
	processNewRanks:function(){
		var scope = this,
			rankedCities;

		if(scope.state.newValues.length == 0){
			scope.processNewValues();
		}

		if(scope.state.newValues.length != 0){
			rankedCities = scope.rankNewFirm(scope.state.newValues);
		}

		scope.setState({newRanks:rankedCities});

	},
	processShareRanks:function(){
		var scope = this,
			rankedCities;

		if(scope.state.shareValues.length == 0){
			scope.processShareValues();
		}

		if(scope.state.shareValues.length != 0){
			rankedCities = scope.rankShare(scope.state.shareValues);
		}
		scope.setState({shareRanks:rankedCities});
	},
	processCompRanks:function(){
		var scope = this,
			rankedCities;

		if(scope.state.shareRanks.length == 0){
			scope.processShareRanks();
		}
		if(scope.state.newRanks.length == 0){
			scope.processNewRanks();
		}

		if(scope.state.shareRanks.length != 0 &&  scope.state.newRanks.length != 0){
			rankedCities = scope.rankComposite();
		}
		scope.setState({compRanks:rankedCities});		
	},
	processNewValues:function(){
		var scope = this,
		    ages = d3.range(12),
			data = scope.state.fullData['new'];

        //Every msa represented as:
        //{values:[{x:val,y:val}....],key=msa,}
        //Want to return 1 (x,y) object for each year, where x=year and y=new firms per 1000 people
        var chartData = Object.keys(data).map(function(msaId){
            //Iterating through every year within a metro area
            var valueArray = Object.keys(data[msaId]).map(function(year){
                var curCoord={"x":+year,"y":0},
                    newFirmSum = 0,
                    newPer1000 = 0,
                    pop = 0,
                    pop1000 = 0;


                //Creates number of new firms for that year
                ages.forEach(function(age){

                    if(data[msaId][year][age] && (age < 6)){
                        
                        newFirmSum = newFirmSum + +data[msaId][year][age];
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






		scope.setState({newValues:chartData});
	},
	processShareValues:function(){
       var scope = this,
            ages = d3.range(12),
            data = scope.state.fullData["share"];

        //Every msa represented as:
        //{values:[{x:val,y:val}....],key=msa,}
        //Want to return 1 (x,y) object for each year, where x=year and y=percent employed in new firms
        var chartData = Object.keys(data).map(function(msaId){

            //Iterating through every year within a metro area
            var valueArray = Object.keys(data[msaId]).map(function(year){
                var curCoord={"x":+year,"y":0},
                    totalEmploySum = 0,
                    newFirmSum = 0,
                    share = 0;


                //Creates Total Employment number for that year
                //Creates Employment in new firms for that year
                ages.forEach(function(age){
                    if(data[msaId][year][age]){
                        totalEmploySum = totalEmploySum + data[msaId][year][age];                   
                    }
                    if(data[msaId][year][age] && (age < 6)){
                        newFirmSum = newFirmSum + data[msaId][year][age];
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




		scope.setState({shareValues:chartData});
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

		var newFirms = scope.state.newRanks,
			share = scope.state.shareRanks;
		console.log(newFirms,share);

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

		return compositeCityRanks;
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
    colorImmFunction:function(params){
        var scope = this,
            cityColor;
        console.log(params)
        if(params.values){
            var valueLength = params.values.length;
            var curRank = params.values[valueLength-1].rank
            var color = scope.colorImmGroup();
                       
            cityColor = color(curRank);            
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


	render:function(){
		var scope = this;

		return (<div></div>);
	}

	
});

module.exports = DataStore;
