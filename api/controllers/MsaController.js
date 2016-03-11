var	fs = require('fs'),
	d3 = require('d3'),
	http = require('http'),
	countypopagg = require('../../assets/cache/countyPop/countypopagg.json'),
    msaIdToName = require("../../assets/react/components/utils/msaIdToName.json"),
    msatocounty = require("../../assets/react/utils/data/msatocounty.js"),
	aggImmShare = require('../../assets/react/utils/data/ACS_5_Year_Immigration_Percentage/aggImmShare.json'),    
    sicsToState = require('../../assets/react/components/utils/sicsToState.js'),
    abbrToFips = require('../../assets/react/components/utils/abbrToFips.json'),
    inc2007 = require('../../assets/react/utils/data/inc5000/inc5000_2007.json'),
	inc2008 = require('../../assets/react/utils/data/inc5000/inc5000_2008.json'),
	inc2009 = require('../../assets/react/utils/data/inc5000/inc5000_2009.json'),
	inc2010 = require('../../assets/react/utils/data/inc5000/inc5000_2010.json'),
	inc2011 = require('../../assets/react/utils/data/inc5000/inc5000_2011.json'),
	inc2012 = require('../../assets/react/utils/data/inc5000/inc5000_2012.json'),
	inc2013 = require('../../assets/react/utils/data/inc5000/inc5000_2013.json'),
	inc2014 = require('../../assets/react/utils/data/inc5000/inc5000_2014.json'),
	inc2015 = require('../../assets/react/utils/data/inc5000/inc5000_2015.json');

module.exports = {
    index: function (req, res) {
        res.view({ devEnv : (process.env.NODE_ENV === 'development') });
    },
    statesGeo: function(req ,res) {

    },
    msaGeo: function(req, res) {

    },
    getMsa:function(req,res) {
 		var msaId = req.param('msaId');

 		//data will be a json object
 		//with firm and employment data for each firm age/year combintion
	   	fileCache.checkCache({type:"msa",id:msaId},function(data){
 			if(data){
 				console.log('cache sucess');
 				console.time('send cache');
				res.json(data);
 				console.timeEnd('send cache');
 			}
 			else{
 				//If its not there, call function that will get it for you
	 			console.log('cache miss');
				msaData(msaId,function(data){
	 				console.time('send data');
					res.json(data);
	 				console.timeEnd('send data');
				})
 			}

	   	})
    },
    allMsa:function(req,res){

    	//full data will be array of objects, where key = msaId, and data = data from http request
	    //Check for aggregate file
	   	fileCache.checkCache({type:"aggregate",id:"all"},function(data){
 			if(data){
 				console.log('cache sucess');
 				console.time('send cache');
				res.json(data);
 				console.timeEnd('send cache');
 			}
 			else{
 				//If not there, call function to get it 
	 			console.log('cache miss');
 				aggregateMsa(function(data){
	 				console.time('send data');
					res.json(data);
	 				console.timeEnd('send data');	 					
 				})
 			}
	   	})
    },
    countyPop:function(req,res){
        fileCache.checkCache({type:"aggregate",id:"msaPop"},function(data){
        	if(data){
        		console.log('cache sucess');
        		console.time('send cache');
        		res.json(data);
        		console.timeEnd('send cache');
        	}
        	else{
        		//If not there, call function that makes/gets it
        		aggregateMsaPop(function(data){
        			console.time('send data');
        			res.json(data);
        			console.timeEnd('send data');
        		})
        	}
        })

    },
    equalOpp:function(req,res){
       	var match = 0;
        var curMatch = 1;
        var index = 0;
        var countyGains = {};

        fileCache.checkCache({type:"aggregate",id:"aggMsaOppData"},function(aggMsaOppData){
        	if(aggMsaOppData){
        		console.log('cache sucess');
        		console.time('send cache');
        		res.json(aggMsaOppData);
        		console.timeEnd('send cache');
        	}
        	else{
				fileCache.checkCache({type:"opportunity",id:"lowIncome"},function(lowOppData){
		        	if(lowOppData){
						fileCache.checkCache({type:"opportunity",id:"highIncome"},function(highOppData){
							if(highOppData){
								combineEqualOpp(lowOppData,highOppData,function(aggMsaOppData){
									res.json(aggMsaOppData);
								});
							}
							else{
								highIncomeOpp(function(highOppData){
									combineEqualOpp(lowOppData,highOppData,function(aggMsaOppData){
										res.json(aggMsaOppData);
									});
								});
							}
						})
		        	}
		        	else{
						lowIncomeOpp(function(lowOppData){
							fileCache.checkCache({type:"opportunity",id:"highIncome"},function(highOppData){
								if(highOppData){
									combineEqualOpp(lowOppData,highOppData,function(aggMsaOppData){
										res.json(aggMsaOppData);
									});
								}
								else{
									highIncomeOpp(function(highOppData){
										combineEqualOpp(lowOppData,highOppData,function(aggMsaOppData){
											res.json(aggMsaOppData);
										});
									});
								}
							})							
						});
		        	}
		        })
        	}
        })


                    


                       
            
    
    },
    migration:function(req,res){

    	var years = [];
    	for(var i = 1990; i<2015;i++){
    		years.push(i);
    	}

    	var migration1990data = migration1990();
    	var migration2000data = migration2000();
    	var migration2010data = migration2010();

    	var countyMigration = combineMigration(migration1990data,migration2000data,migration2010data);



    	var msaMigration = {};


    	fileCache.checkCache({type:"aggregate",id:"msaMigration"},function(data){
    		if(data){
        		console.log('cache sucess');
        		console.time('send cache');
        		res.json(data);
        		console.timeEnd('send cache');
    		}
    		else{
			    fileCache.checkCache({type:"aggregate",id:"msaCounties"},function(data){
			    	if(data){
			    		var msaCounties = data;

					    msatocounty.forEach(function(countyMap){

					        msaMigration[Object.keys(countyMap)] = {};

					    })

					    Object.keys(msaMigration).forEach(function(msaId){
					        var curMigration = 0;
					        msaCounties[msaId].forEach(function(county){

					            //console.log(countypopagg[county]);

					            if(countyMigration[county]){
					                years.forEach(function(year){
					                    if(!msaMigration[msaId][year]){
					                        msaMigration[msaId][year] = 0;
					                    }

					                    msaMigration[msaId][year] += countyMigration[county][year];
					                })                    
					            }
					        })
					    })


						fileCache.addData({type:"aggregate",id:"msaMigration"},msaMigration);
					    res.json(msaMigration);


			    	}
			    	else{
			    		//If not there, call function that makes/gets it
					    msatocounty.forEach(function(countyMap){

					        msaMigration[Object.keys(countyMap)] = {};
					        
					        if(!msaCounties[Object.keys(countyMap)]){
					            msaCounties[Object.keys(countyMap)] = [];    
					        }
					        
					        msaCounties[Object.keys(countyMap)].push(countyMap[Object.keys(countyMap)]);

					    })

			   			fileCache.addData({type:"aggregate",id:"msaCounties"},msaCounties);


					    Object.keys(msaMigration).forEach(function(msaId){
					        var curMigration = 0;
					        msaCounties[msaId].forEach(function(county){

					            //console.log(countypopagg[county]);

					            if(countyMigration[county]){
					                years.forEach(function(year){
					                    if(!msaMigration[msaId][year]){
					                        msaMigration[msaId][year] = 0;
					                    }

					                    msaMigration[msaId][year] += countyMigration[county][year];
					                })                    
					            }
					        })
					    })
						fileCache.addData({type:"aggregate",id:"msaMigration"},msaMigration);
					    res.json(msaMigration);
			    	}
			    })
    		}
    	})
    },
    shareImm:function(req,res){
    	//NEEDS TO BE BROKE DOWN INTO SEPARATE FUNCTIONS
    	//FOR CACHING
    	var years = [2009,2010,2011,2012,2013,2014];

    	var numImmCounties = {};
    	var msaCounties = {};

    	var msaImmPop = {}
        Object.keys(aggImmShare).forEach(function(countyFips){

            if(countyFips > 999){
            
                numImmCounties[countyFips] = {};
                years.forEach(function(year){
                    var numImm =(aggImmShare[countyFips][year])/100 * countypopagg[countyFips][year]
                    numImmCounties[countyFips][year] = numImm;
                })

            }


        })


	    msatocounty.forEach(function(countyMap){

	        msaImmPop[Object.keys(countyMap)] = {};
	        
	        if(!msaCounties[Object.keys(countyMap)]){
	            msaCounties[Object.keys(countyMap)] = [];    
	        }
	        
	        msaCounties[Object.keys(countyMap)].push(countyMap[Object.keys(countyMap)]);

	    })

		Object.keys(msaImmPop).forEach(function(msaId){
	        var curPop = 0;
	        var curImmPop = 0;
	        msaCounties[msaId].forEach(function(county){

	            //console.log(countypopagg[county]);

	            if(countypopagg[county]){
	                years.forEach(function(year){
	                    if(!msaImmPop[msaId][year]){
	                        msaImmPop[msaId][year] = {};
	                        msaImmPop[msaId][year]['imm']=0;
							msaImmPop[msaId][year]['tot']=0;
	                    }

	                    msaImmPop[msaId][year]['imm'] += numImmCounties[county][year];
	                    msaImmPop[msaId][year]['tot'] += countypopagg[county][year];
	                })                    
	            }
	        })
	    })

		var msaImmShare = {};

		Object.keys(msaImmPop).forEach(function(msaId){
			msaImmShare[msaId] = {};
			years.forEach(function(year){
				msaImmShare[msaId][year] = 0;
				if(msaImmPop[msaId][year] != undefined){
					msaImmShare[msaId][year] = msaImmPop[msaId][year]['imm'] / msaImmPop[msaId][year]['tot'];
				}	
			})
		})
        res.json(msaImmShare)
    },
    inc5000:function(req,res){

    	var curYear = 2007;
    	var dataArray = [inc2007,inc2008,inc2009,inc2010,inc2011,inc2012,inc2013,inc2014,inc2015];
        var match = 0;
        var total = 0;
        var curMatch = 0;
        var miss = 0;
        var missMetro = {};
        var metroFirms = {};
		fileCache.checkCache({type:"aggregate",id:"inc5000"},function(data){
			if(data){
        		console.log('cache sucess');
        		console.time('send cache');
        		res.json(data);
        		console.timeEnd('send cache');				
			}
			else{
		    	dataArray.forEach(function(year){

					Object.keys(year).forEach(function(firm){
		                total++;
		                Object.keys(msaIdToName).forEach(function(msaId){
		                    if(!metroFirms[msaId]){
		                        metroFirms[msaId] = {};
		                    }
		                    if(!metroFirms[msaId][curYear]){
		                        metroFirms[msaId][curYear]=0;
		                    }
		                    if(msaIdToName[msaId].substr(0,7) == year[firm].metro.substr(0,7)){
		                        
		                        //console.log(msaIdToName[msaId].substr(msaIdToName[msaId].length-2,2));
		                        //console.log(year[firm].state_s)
		                        if(msaIdToName[msaId].substr(msaIdToName[msaId].length-2,2) == year[firm].state_s){
		                            match++;
		                            curMatch++;
		                             metroFirms[msaId][curYear]++;
		                            //console.log("INC|",year[firm].metro,year[firm].state_s,"|DATABASE|",msaIdToName[msaId]);
		                        }
		                        else{
		                               
		                        
		                            if(msaIdToName[msaId].substr(msaIdToName[msaId].length-5,2) == year[firm].state_s){
		                                match++;
		                                curMatch++;
		                                 metroFirms[msaId][curYear]++;
		                                //console.log("INC|",year[firm].metro,year[firm].state_s,"|DATABASE|",msaIdToName[msaId]);
		                            }
		                            else{
		                                if(msaIdToName[msaId].substr(msaIdToName[msaId].length-8,2) == year[firm].state_s){
		                                    match++;
		                                    curMatch++;
		                                     metroFirms[msaId][curYear]++;
		                                    //console.log("INC|",year[firm].metro,year[firm].state_s,"|DATABASE|",msaIdToName[msaId]);
		                                }
		                                else{
		                                    if(msaIdToName[msaId].substr(msaIdToName[msaId].length-11,2) == year[firm].state_s){
		                                        match++;
		                                        curMatch++;
		                                         metroFirms[msaId][curYear]++;
		                                        //console.log("INC|",year[firm].metro,year[firm].state_s,"|DATABASE|",msaIdToName[msaId]);
		                                    }
		                                }
		                            }
		                        }
		                    }
		                })
		                if(curMatch == 0){
		                    Object.keys(msaIdToName).forEach(function(msaId){
		                        if(msaIdToName[msaId].substr(0,5) == year[firm].metro.substr(0,5)){
		                            if(msaIdToName[msaId].substr(msaIdToName[msaId].length-2,2) == year[firm].state_s){
		                                match++;
		                                curMatch++;
		                                 metroFirms[msaId][curYear]++;
		                                //console.log("INC|",year[firm].metro,year[firm].state_s,"|DATABASE|",msaIdToName[msaId]);
		                            }
		                            else{
		                                   
		                            
		                                if(msaIdToName[msaId].substr(msaIdToName[msaId].length-5,2) == year[firm].state_s){
		                                    match++;
		                                    curMatch++;
		                                     metroFirms[msaId][curYear]++;
		                                    //console.log("INC|",year[firm].metro,year[firm].state_s,"|DATABASE|",msaIdToName[msaId]);
		                                }
		                                else{
		                                    if(msaIdToName[msaId].substr(msaIdToName[msaId].length-8,2) == year[firm].state_s){
		                                        match++;
		                                        curMatch++;
		                                         metroFirms[msaId][curYear]++;
		                                        //console.log("INC|",year[firm].metro,year[firm].state_s,"|DATABASE|",msaIdToName[msaId]);
		                                    }
		                                    else{
		                                        if(msaIdToName[msaId].substr(msaIdToName[msaId].length-11,2) == year[firm].state_s){
		                                            match++;
		                                            curMatch++;
		                                             metroFirms[msaId][curYear]++;
		                                            //console.log("INC|",year[firm].metro,year[firm].state_s,"|DATABASE|",msaIdToName[msaId]);
		                                        }
		                                    }
		                                }
		                            }                        
		                        }
		                    })
		                    if(curMatch == 0){
		                        if(!missMetro[year[firm].metro]){
		                            missMetro[year[firm].metro] = 1;
		                        }
		                        else{
		                            missMetro[year[firm].metro]++;
		                        }
		                        
		                        miss++;                            
		                    }
		                    
		                                 
		                }
		                curMatch = 0;

		            })

		    		curYear++;
		    	})
				fileCache.addData({type:"aggregate",id:"inc5000"},metroFirms);
		    	res.json(metroFirms);				
			}
		})
    },

    detailMigration:function(req,res){

    	//1990 and 1991 are txt, individual states
    	//1992 to 1994 are csv, indivudual states, no US data
    		//'00' in 3rd column
    	//1995 to 2003 are csv, individual states, with US data
    		//'96' in 3rd column
    	//2004 to 2010 are DAT, aggregate
    		//'96' in 3rd column
    	//2011 and 20122 are CSV aggregate
    		//96 in 3rd
		//1990 and 1991 is space
		//1992 thru 2003 is CSV
		//2004 is space
		//2005 is CSV
		//2006 is space, n = in, t = out
		//2007 thru 2010 is CSV
		//2011 and 2012 is CSV

    	fileCache.checkCache({type:"aggregate",id:"msaFlowMigration"},function(data){
    		if(data){
        		console.log('cache sucess');
        		console.time('send cache');
        		res.json(data);
        		console.timeEnd('send cache');
    		}
    		else{
				//var fileContents = fs.readFileSync("assets/cache/countyMigration/1990to1991CountyMigration/C9091aki.txt");

	    		var directoryPath = 'assets/cache/countyMigration';
	    		var data = "";
	    		var year = "";

	    		var fileNames = ['9091aggregate.txt','9192aggregate.txt','9293aggregate.txt','9394aggregate.txt','9495aggregate.txt','9596aggregate.txt','9697aggregate.txt','9798aggregate.txt','9899aggregate.txt','9900aggregate.txt','0001aggregate.txt','0102aggregate.txt','0203aggregate.txt','0304aggregate.txt','0405aggregate.txt','0506aggregate.txt','0607aggregate.txt','0708aggregate.txt','0809aggregate.txt','0910aggregate.txt','1011aggregate.txt','1112aggregate.txt','1213aggregate.txt'];

	    		var years = ['90','91','92','93','94','95','96','97','98','99','00','01','02','03','04','05','06','07','08','09','10','11','12'];


	    		var countyMigration = {};
    			fileNames.forEach(function(name){
    				//inflow or outflow from filename
    				year = name.substr(0,2);
    				var filePath = directoryPath + '/'+ name;
    				console.log(filePath);

    				var curFlow = '';
    				var curFips = '';



					var fileContents = fs.readFileSync(filePath);
					var lines = fileContents.toString().split('\n');


					for(var i = 0; i<lines.length;i++){
	    				var curReturns = 0;
	    				var curExemptions = 0;

	    				if(year == '90' || year == '91' || year == '04' || year == '06' || year == '07'|| year == '08'|| year == '09'|| year == '10'){
							var curLine = lines[i].split(' ');
	    				}
	    				else{
	    					
	    					var curLine = lines[i].split(',');			
	    				}
    					


    					//This will switch the flow whenever we encounter a switch
    					if(curLine[0].substr(0,1) == 'i'|| curLine[0].substr(0,1) == 'n'){
							curFlow = 'inflow'
							//countyMigration[countyFips][year][inflow]
						}
						else if(curLine[0].substr(0,1) == 'o' || curLine[0].substr(0,1) == 'O' || curLine[0].substr(0,1) == 't' || curLine[0].substr(0,1) == 'u'){
    						curFlow = 'outflow'
    						//countyMigration[countyFips][year][inflow]    							
						}
    					else{
    						//If not on an i or o, we have data

    						var curState = "";
    						curState = curLine[0]

    						var curCounty = "";
    						curCounty = curLine[1];



    						if(curState && curState.length<2){
    							curState = "0" + curState;
    						}
    						if(curCounty && curCounty.length == 1){
    							curCounty = "00" + curCounty;
    						}
    						if(curCounty && curCounty.length == 2){
    							curCounty = "0" + curCounty;
    						}

    						curFips = curState + curCounty

    						if(!countyMigration[curFips]){
    							countyMigration[curFips] = {};
    						}
    						if(!countyMigration[curFips][year]){
    							countyMigration[curFips][year] = {};
    						}
    						if(!countyMigration[curFips][year][curFlow]){
    							countyMigration[curFips][year][curFlow] = {};
    						}

		    				if(year == '90' || year == '91'){
	    						///Go through the rest of the line. First number we hit = returns, 2nd = Exemptions
	    						for(var j=2;j<curLine.length;j++){
	    							if(!isNaN(curLine[j])){
	    								if(curReturns == 0){
	    									curReturns = curLine[j];
	    								}
	    								else{
	    									curExemptions = curLine[j];
	    								}
	    							}
	    						}
		    				}
		    				else if(year == '04' || year == '06' || year == '07'|| year == '08'|| year == '09'|| year == '10'){
	    						for(var j=4;j<curLine.length;j++){
	    							if(!isNaN(curLine[j])){
	    								if(curReturns == 0){
	    									curReturns = curLine[j];
	    								}
	    								else if(curExemptions == 0){
	    									curExemptions = curLine[j];
	    								}
	    								else{

	    								}
	    							}
	    						}	    					
		    				}
		    				else{
		    					curReturns = curLine[6];
		    					curExemptions = curLine[7];		
		    				}
    						countyMigration[curFips][year][curFlow]['households'] = curReturns;
    						countyMigration[curFips][year][curFlow]['individuals'] = curExemptions;
    					}
					}
    			})
				
				var msaMigration = {};
			    fileCache.checkCache({type:"aggregate",id:"msaCounties"},function(data){
			    	if(data){
			    		var msaCounties = data;

					    msatocounty.forEach(function(countyMap){

					        msaMigration[Object.keys(countyMap)] = {};

					    })

					    Object.keys(msaMigration).forEach(function(msaId){
					        var curMigration = 0;
					        if(msaCounties[msaId]){
						        msaCounties[msaId].forEach(function(county){

						            //console.log(countypopagg[county]);

						            if(countyMigration[county]){
						                years.forEach(function(year){
						                    if(!msaMigration[msaId][year]){
						                        msaMigration[msaId][year] = {};
						                        msaMigration[msaId][year]['inflow'] = {};
						                        msaMigration[msaId][year]['outflow'] = {};
						                        msaMigration[msaId][year]['inflow']['households'] = 0;
						                        msaMigration[msaId][year]['inflow']['individuals'] = 0;
						                    	msaMigration[msaId][year]['outflow']['households'] = 0;
						                        msaMigration[msaId][year]['outflow']['individuals'] = 0;
						                    }

						                    if(countyMigration[county][year]){

						                    	if(countyMigration[county][year]['inflow']){
								                 	msaMigration[msaId][year]['inflow']['households'] += +countyMigration[county][year]['inflow']['households'];
								                    msaMigration[msaId][year]['inflow']['individuals'] += +countyMigration[county][year]['inflow']['individuals'];						                    		
						                    	}
						                    	if(countyMigration[county][year]['outflow']){
								                    msaMigration[msaId][year]['outflow']['households'] += +countyMigration[county][year]['outflow']['households'];
								                    msaMigration[msaId][year]['outflow']['individuals'] += +countyMigration[county][year]['outflow']['individuals'];					                    		
						                    	}

					                    	
						                    }


						                })                    
						            }
						        })					        	
					        }

					    })


						fileCache.addData({type:"aggregate",id:"msaFlowMigration"},msaMigration);
				    	res.json(msaMigration);


			    	}
			    	else{
			    		//If not there, call function that makes/gets it
					    msatocounty.forEach(function(countyMap){

					        msaMigration[Object.keys(countyMap)] = {};
					        
					        if(!msaCounties[Object.keys(countyMap)]){
					            msaCounties[Object.keys(countyMap)] = [];    
					        }
					        
					        msaCounties[Object.keys(countyMap)].push(countyMap[Object.keys(countyMap)]);

					    })

			   			fileCache.addData({type:"aggregate",id:"msaCounties"},msaCounties);


					    Object.keys(msaMigration).forEach(function(msaId){
					        var curMigration = 0;
					        if(msaCounties[msaId]){
						        msaCounties[msaId].forEach(function(county){

						            //console.log(countypopagg[county]);

						            if(countyMigration[county]){
						                years.forEach(function(year){
						                    if(!msaMigration[msaId][year]){
						                        msaMigration[msaId][year] = {};
						                        msaMigration[msaId][year]['inflow'] = {};
						                        msaMigration[msaId][year]['outflow'] = {};
						                        msaMigration[msaId][year]['inflow']['households'] = 0;
						                        msaMigration[msaId][year]['inflow']['individuals'] = 0;
						                    	msaMigration[msaId][year]['outflow']['households'] = 0;
						                        msaMigration[msaId][year]['outflow']['individuals'] = 0;
						                    }

						                    if(countyMigration[county][year]){

						                    	if(countyMigration[county][year]['inflow']){
								                 	msaMigration[msaId][year]['inflow']['households'] += +countyMigration[county][year]['inflow']['households'];
								                    msaMigration[msaId][year]['inflow']['individuals'] += +countyMigration[county][year]['inflow']['individuals'];						                    		
						                    	}
						                    	if(countyMigration[county][year]['outflow']){
								                    msaMigration[msaId][year]['outflow']['households'] += +countyMigration[county][year]['outflow']['households'];
								                    msaMigration[msaId][year]['outflow']['individuals'] += +countyMigration[county][year]['outflow']['individuals'];					                    		
						                    	}

					                    	
						                    }


						                })                    
						            }
						        })					        	
					        }
					    })
						fileCache.addData({type:"aggregate",id:"msaFlowMigration"},msaMigration);
				    	res.json(msaMigration);
			    	}
			    })
    		}
    	})
    }
};

function combineEqualOpp(lowIncome,highIncome,cb){
// msaCounties[msaId].forEach(function(county)
    var msaGains ={};

    fileCache.checkCache({type:"aggregate",id:"msaPop"},function(msaPop){
    	if(msaPop){
    		fileCache.checkCache({type:"aggregate",id:"msaCounties"},function(data){
                if(data){
                    var msaCounties = data;

                    msatocounty.forEach(function(countyMap){

                        msaGains[Object.keys(countyMap)] = {};
                        msaGains[Object.keys(countyMap)]["lowIncome"] = 0;
                        msaGains[Object.keys(countyMap)]["highIncome"] = 0;

                    })

                    Object.keys(msaGains).forEach(function(msaId){
                    	if(msaCounties[msaId]){
	                    	msaCounties[msaId].forEach(function(county){

	                            if(countypopagg[county]){

	                                msaGains[msaId]["lowIncome"] += +lowIncome[county] * +countypopagg[county][2011]/+msaPop[msaId][2011];
	                                msaGains[msaId]["highIncome"] += +highIncome[county] * +countypopagg[county][2011]/+msaPop[msaId][2011];               
	                            }
	                    	})                    		
                    	}

                    })
       
        			fileCache.addData({type:"aggregate",id:"aggMsaOppData"},msaGains);
                    cb(msaGains);                   	
                }
                else{

                }
    		})
    	}
    	else{
			aggregateMsaPop(function(msaPop){
        		fileCache.checkCache({type:"aggregate",id:"msaCounties"},function(data){
                    if(data){
	                    var msaCounties = data;

	                    msatocounty.forEach(function(countyMap){

	                        msaGains[Object.keys(countyMap)] = {};
	                        msaGains[Object.keys(countyMap)]["lowIncome"] = 0;
	                        msaGains[Object.keys(countyMap)]["highIncome"] = 0;

	                    })

	                    Object.keys(msaGains).forEach(function(msaId){
	                    	if(msaCounties[msaId]){
		                    	msaCounties[msaId].forEach(function(county){
		                            if(countypopagg[county]){
		                                msaGains[msaId]["lowIncome"] += +lowIncome[county] * +countypopagg[county][2011]/+msaPop[msaId][2011];
		                                msaGains[msaId]["highIncome"] += +highIncome[county] * +countypopagg[county][2011]/+msaPop[msaId][2011];               
		                            }
		                    	})                    		
	                    	}
	                    })
	                    
	        			fileCache.addData({type:"aggregate",id:"aggMsaOppData"},msaGains);
	                    cb(msaGains);                     	
                    }
                    else{

                    }
        		})
			})
    	}
    })
}

function combineMigration(data1990,data2000,data2010){


		var combinedData = {};







		Object.keys(data1990).forEach(function(item){
			if(!combinedData[item]){
				combinedData[item] = {};	
			}
			Object.keys(data1990[item]).forEach(function(year){
				combinedData[item][year] = data1990[item][year];
			})
		})

		Object.keys(data2000).forEach(function(item){
			
			if(!combinedData[item]){
				combinedData[item] = {};	
			}
			Object.keys(data2000[item]).forEach(function(year){
				var yearName = year.substring(6);
				combinedData[item][yearName] = data2000[item][year];
			})
		})

		Object.keys(data2010).forEach(function(item){
			
			if(!combinedData[item]){
				combinedData[item] = {};	
			}
			Object.keys(data2010[item]).forEach(function(year){
				var yearName = year.substring(6);
				combinedData[item][yearName] = data2010[item][year];
			})
		})


		return combinedData;

}

//Given a reference json, county name and state name, will return 5 digit county fips
function countyNameToFips(countyNames,stateName,countyName){

	var curFips;
    var state;
    
    Object.keys(sicsToState).forEach(function(stateFips){
        if(sicsToState[stateFips] == stateName){
            state = stateFips;
        }
    })
    Object.keys(abbrToFips).forEach(function(stateAbbr){
        if(abbrToFips[stateAbbr] == state){
            state = stateAbbr;
        }
    })


    Object.keys(countyNames).forEach(function(countyFips){
    	if(countyName == countyNames[countyFips].countyName.substring(0,countyNames[countyFips].countyName.length-7)){
    		if(state == countyNames[countyFips].stateAbbr){
    			curFips = countyFips;
    		}
    	}
    })

	return curFips;			
}


function nationalCountyNames(cb){
	var fileContents = fs.readFileSync("assets/react/utils/data/national_county.csv");

	var lines = fileContents.toString().split('\n');

	var header = [];

	header =(lines[0].toString().split(','));

	var rows = [];


	var jsonData = {};

    for(i=1;i<lines.length;i++){
		rows.push(lines[i].toString().split(','));
	}

    rows.forEach(function(countyRow){
    	//state,fips,name,code
		var countyName = countyRow[2];
		var stateAbbr = countyRow[0];
		var countyFips = countyRow[1];


		if(!jsonData[countyFips]){
			jsonData[countyFips] = {};
		}
		jsonData[countyFips]['countyName'] = countyRow[2];
		jsonData[countyFips]['stateAbbr'] = countyRow[0];

	})	

	fileCache.addData({type:"misc",id:"countyNames"},jsonData);
	cb(jsonData);	
}

function lowIncomeOpp(cb){
	var fileContents = fs.readFileSync("assets/react/utils/data/opportunity/estimates_for_all_counties_low_income.csv");

	var lines = fileContents.toString().split('\n');

	var header = [];

	header =(lines[0].toString().split(','));

	var rows = [];

	var jsonData = {};



    fileCache.checkCache({type:"misc",id:"countyNames"},function(countyNames){
    	if(countyNames){

		    for(i=1;i<lines.length;i++){
				rows.push(lines[i].toString().split(','));
			}

		    rows.forEach(function(countyRow){

				var countyName = countyRow[0];
				var countyState = countyRow[1];

				var countyFips = countyNameToFips(countyNames,countyState,countyName);
				if(!jsonData[countyFips]){
					jsonData[countyFips] = 0;;
				}
				jsonData[countyFips] = countyRow[2]/100;

			})	

			fileCache.addData({type:"opportunity",id:"lowIncome"},jsonData);
			cb(jsonData);
    	}
    	else{
    		nationalCountyNames(function(countyNames){
			    for(i=1;i<lines.length;i++){
					rows.push(lines[i].toString().split(','));
				}

			    rows.forEach(function(countyRow){

					var countyName = countyRow[0];
					var countyState = countyRow[1];

					var countyFips = countyNameToFips(countyNames,countyState,countyName);
					if(!jsonData[countyFips]){
						jsonData[countyFips] = 0;;
					}
					jsonData[countyFips] = countyRow[2]/100;

				})	

				fileCache.addData({type:"opportunity",id:"lowIncome"},jsonData);
				cb(jsonData);
    		});
    	}
    })
}

function highIncomeOpp(){
	var fileContents = fs.readFileSync("assets/react/utils/data/opportunity/estimates_for_all_counties_high_income.csv");

	var lines = fileContents.toString().split('\n');

	var header = [];

	header =(lines[0].toString().split(','));

	var rows = [];

	var jsonData = {};

    fileCache.checkCache({type:"misc",id:"countyNames"},function(countyNames){
    	if(countyNames){

		    for(i=1;i<lines.length;i++){
				rows.push(lines[i].toString().split(','));
			}

		    rows.forEach(function(countyRow){

				var countyName = countyRow[0];
				var countyState = countyRow[1];

				var countyFips = countyNameToFips(countyNames,countyState,countyName);
				if(!jsonData[countyFips]){
					jsonData[countyFips] = 0;;
				}
				jsonData[countyFips] = countyRow[2]/100;

			})	

			fileCache.addData({type:"opportunity",id:"highIncome"},jsonData);
			return jsonData;
    	}
    	else{
    		nationalCountyNames(function(countyNames){
			    for(i=1;i<lines.length;i++){
					rows.push(lines[i].toString().split(','));
				}

			    rows.forEach(function(countyRow){

					var countyName = countyRow[0];
					var countyState = countyRow[1];

					var countyFips = countyNameToFips(countyNames,countyState,countyName);
					if(!jsonData[countyFips]){
						jsonData[countyFips] = 0;;
					}
					jsonData[countyFips] = countyRow[2]/100;
				})	

				fileCache.addData({type:"opportunity",id:"highIncome"},jsonData);
				return jsonData;
    		});
    	}
    })
}

function migration1990(){

		var fileContents = fs.readFileSync("assets/react/utils/data/ACS_Migration/migration19902000.csv");

    	var lines = fileContents.toString().split('\n');

    	var header = [];

    	header =(lines[0].toString().split('\t'));

    	var rows = [];


    	var jsonData = {};



    	for(i=1;i<lines.length;i++){
    		rows.push(lines[i].toString().split('\t'));
    	}


    	rows.forEach(function(countyRow){

    		var countyFips = countyRow[1];

    		if(countyFips < 10000){
    			countyFips = '0' + countyFips
    		}

    		if(!jsonData[countyFips]){
    			jsonData[countyFips] = {};

    			header.forEach(function(colName,i){
    				jsonData[countyFips][colName] = +countyRow[i];
    			})
    		}
    		else{

    			header.forEach(function(colName,i){
    				if(colName != 'fips'){
  						jsonData[countyFips][colName] += +countyRow[i];  					
    				}
    				
    			})				    			


    		}
    	})	


    	return jsonData;
}


function migration2000(){

	var fileContents = fs.readFileSync("assets/react/utils/data/ACS_Migration/migration2000_2009.csv");

	var lines = fileContents.toString().split('\n');

	var header = [];

	header =(lines[0].toString().split(','));


	var rows = [];


	var jsonData = {};



	for(i=1;i<lines.length;i++){
		rows.push(lines[i].toString().split(','));
	}


	rows.forEach(function(countyRow){
		var key = countyRow[3] + countyRow[4]
		jsonData[key] = {};

			header.forEach(function(colName,i){
			if(colName == "STATE" || colName == "COUNTY" || colName == "NETMIG2000" ||
			    			colName == "NETMIG2001" || colName == "NETMIG2002" || colName == "NETMIG2003" ||
			    			colName == "NETMIG2004" || colName == "NETMIG2005" || colName == "NETMIG2006" ||
			    			colName == "NETMIG2007" || colName == "NETMIG2008" || colName == "NETMIG2009"){
			    jsonData[key][colName] = +countyRow[i];
			}
		})
	})	


	return jsonData;
}

function migration2010(){

	var fileContents = fs.readFileSync("assets/react/utils/data/ACS_Migration/migration2010_2014.csv");

	var lines = fileContents.toString().split('\n');

	var header = [];

	header =(lines[0].toString().split(','));


	var rows = [];


	var jsonData = {};



	for(i=1;i<lines.length;i++){
		rows.push(lines[i].toString().split(','));
	}


	rows.forEach(function(countyRow){
		var key = countyRow[3] + countyRow[4]
		jsonData[key] = {};

			header.forEach(function(colName,i){
				if(colName == "STATE" || colName == "COUNTY" || colName == "NETMIG2010" ||
				colName == "NETMIG2011" || colName == "NETMIG2012" || colName == "NETMIG2013" ||
				colName == "NETMIG2014"){
				jsonData[key][colName] = +countyRow[i];
			}

		})
 	})


	return jsonData;
}


function aggregateMsaPop(cb){

    var years = [];
    
    for(var i = 1990;i<2015;i++){
    	years.push(i);
    }

    //console.log(msatocounty);

    var msaPop = {};
    var msaCounties = {};


    fileCache.checkCache({type:"aggregate",id:"msaCounties"},function(data){
    	if(data){
    		msaCounties = data;

		    msatocounty.forEach(function(countyMap){

		        msaPop[Object.keys(countyMap)] = {};

		    })

		    Object.keys(msaPop).forEach(function(msaId){
		        var curPop = 0;
		        msaCounties[msaId].forEach(function(county){

		            //console.log(countypopagg[county]);

		            if(countypopagg[county]){
		                years.forEach(function(year){
		                    if(!msaPop[msaId][year]){
		                        msaPop[msaId][year] = 0;
		                    }

		                    msaPop[msaId][year] += countypopagg[county][year];
		                })                    
		            }
		        })
		    })


			fileCache.addData({type:"aggregate",id:"msaPop"},msaPop);
		    cb(msaPop);


    	}
    	else{
    		//If not there, call function that makes/gets it
		    msatocounty.forEach(function(countyMap){

		        msaPop[Object.keys(countyMap)] = {};
		        
		        if(!msaCounties[Object.keys(countyMap)]){
		            msaCounties[Object.keys(countyMap)] = [];    
		        }
		        
		        msaCounties[Object.keys(countyMap)].push(countyMap[Object.keys(countyMap)]);

		    })

   			fileCache.addData({type:"aggregate",id:"msaCounties"},msaCounties);

    		Object.keys(msaPop).forEach(function(msaId){
		        var curPop = 0;
		        msaCounties[msaId].forEach(function(county){

		            //console.log(countypopagg[county]);

		            if(countypopagg[county]){
		                years.forEach(function(year){
		                    if(!msaPop[msaId][year]){
		                        msaPop[msaId][year] = 0;
		                    }

		                    msaPop[msaId][year] += countypopagg[county][year];
		                })                    
		            }
		        })
		    })


			fileCache.addData({type:"aggregate",id:"msaPop"},msaPop);

		    cb(msaPop);

    	}
    })

}






function msaData(msaId,cb){
	if(!msaId){
		return {status:"error",message:"msaId required"};
	}

	//Get the data for the one msaId
    var url = "bds.availabs.org",
        path = "/firm/age/msa" + msaId,
        fullData = "";


	var options = {
	  hostname: url,
	  path: path,
	  port:80,
	  method:"GET"
	};

	console.log(options.hostname+options.path);

	
	var req = http.request(options, function(response){
		response.setEncoding('utf8');

		response.on('data', function (chunk) {
	    	fullData = fullData + chunk;
		});				

		response.on('end', function () {
			var parsedData = JSON.parse(fullData);
			console.log('caching');
			fileCache.addData({type:"msa",id:msaId},parsedData);
			cb(parsedData);
		});
	});

	req.end();
}

function aggregateMsa(cb){



	//Get the data for all msa
    var url = "bds.availabs.org",
        path = "/firm/age/msa",
        fullData = "";


	var options = {
	  hostname: url,
	  path: path,
	  port:80,
	  method:"GET"
	};

	console.log(options.hostname+options.path);


	var req = http.request(options, function(response){
		response.setEncoding('utf8');

		response.on('data', function (chunk) {
	    	fullData = fullData + chunk;
		});				

		response.on('end', function () {
  			var parsedData = JSON.parse(fullData);
  			console.log('caching');
			fileCache.addData({type:"aggregate",id:"all"},parsedData);
			cb(parsedData);
		});

	});

	req.end();
			
		
}

var fileCache = {
	
	cache : {},

	checkCache : function(request,callback){
		console.log('------------checkCache----'+request.type+'---'+request.id+'----------------')
		var file = __dirname.substring(0,__dirname.length-15) + 'assets/cache/'+request.type+'/'+request.id+'.json';
		
		//console.log(file,callback);
		console.time('file Read')
		fs.readFile(file, 'utf8', function (err, data) {
		  if (err) {
		    console.log('Error: ' + err);
		    return callback(false);
		  }
		 		 
		  console.timeEnd('file Read');
		  data = JSON.parse(data);
		  return callback(data);
		
		});

	},

	addData : function(request,data){
		var dir = __dirname.substring(0,__dirname.length-15) + 'assets/cache/'+request.type+'/';

		ensureExists(dir, 0744, function(err) {
		    if (err){
		    	console.log('ensure exists error')
		    } // handle folder creation error
		    var file = dir+request.id+'.json';
		    
		    fs.writeFile(file,JSON.stringify(data), function(err) {
			    if(err) {
			        console.log('file write error',err);
			    } else {
			        console.log("The file was saved!",file);
			    }
			});
		
		});

	}


};

function ensureExists(path, mask, cb) {
    if (typeof mask == 'function') { // allow the `mask` parameter to be optional
        cb = mask;
        mask = 0777;
    }
    fs.mkdir(path, mask, function(err) {
        if (err) {
            if (err.code == 'EEXIST') cb(null); // ignore the error if the folder already exists
            else cb(err); // something else went wrong
        } else cb(null); // successfully created folder
    });
}