var React = require("react"),
	d3 = require("d3"),
    metroPop20002009 = require("../utils/metroAreaPop2000_2009.json"),
    colorbrewer = require('colorbrewer'),
    msaIdToName = require('../utils/msaIdToName.json');

var DataStore = React.createClass({

	getInitialState:function(){
		return {
			loading:true,
			fullData:{},
			shareValues:[],
			newValues:[],
			shareRanks:[],
			newRanks:[],
			compRanks:[]			
		}

	},
    componentDidMount:function(){
        var scope = this;

        scope.getData(function(data){
            scope.setState({fullData:scope.processData(data),loading:false});
        })
    },
    getData:function(cb){
        var scope = this;

        d3.json("/allMsa",function(err,data){
            return cb(data);  
        })

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
	shareGraph:function(filters){
		var scope = this,
			cities=[];

		console.log("sharegraph",scope.state);
        if(scope.state.loading){
            console.log('reloading')
            setTimeout(function(){ scope.shareGraph(filters) }, 1500);
        }
        else{
			if(scope.state.shareValues.length == 0){
				scope.processShareValues();
			}
			if(scope.state.shareRanks.length == 0){
				scope.processShareRanks();
			}
			if(scope.state.shareRanks.length != 0 && scope.state.shareValues.length != 0){
				//Apply Filters
				//merge rank and share into cities
			}        	
        }

		console.log("end",scope.state);
		return cities;

	},
	newGraph:function(filters){
		var scope = this,
			cities=[];

		console.log(scope.state);
		if(scope.state.newValues.length == 0){
			scope.processNewValues();
		}
		if(scope.state.newRanks.length == 0){
			scope.processNewRanks();
		}
		if(scope.state.newRanks.length != 0 && scope.state.newValues.length != 0){
			//Apply Filters
			//merge rank and share into cities
		}

		return cities;

	},
	compGraph:function(filters){
		var scope = this,
			cities=[];

		if(scope.state.shareRanks.length == 0){
			scope.processShareRanks();
		}
		if(scope.state.newRanks.length == 0){
			scope.processNewRanks();
		}
		if(scope.state.newRanks.length != 0 && scope.state.shareRanks.length != 0){
			//Apply Filters
			//merge rank and share into cities
		}		

		return cities;
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

		if(scope.state.shareRanks.length != 0 &&  scope.state.snewRanks.length != 0){
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

                if(metroPop20002009[msaId] && metroPop20002009[msaId][year]){
                    pop = metroPop20002009[msaId][year].replace(/,/g , "");
                    pop = +pop;
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

		var newFirms = scope.rankNewFirm(scope.props.data["newFirms"]),
			share = scope.rankShare(scope.props.data["share"]);
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

					compositeCityRanks.push({name:item.name,color:item.color,values:resultValues})
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


	render:function(){
		var scope = this;

		return (<div></div>);
	}

	
});

module.exports = DataStore;
