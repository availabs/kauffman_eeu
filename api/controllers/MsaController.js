var	fs = require('fs'),
	d3 = require('d3'),
	http = require('http'),
    msaIdToName = require("../../assets/react/components/utils/msaIdToName.json"),
    msatocounty = require("../../assets/react/utils/data/msatocounty.js"),
	aggImmShare = require('../../assets/react/utils/data/ACS_5_Year_Immigration_Percentage/aggImmShare.json'),    
    countypopagg = require("../../assets/cache/countyPop/countypopagg.json");




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
    migration:function(req,res){

    	
    	var migration1990data = migration1990();
    	var migration2000data = migration2000();



    	res.json(migration2000data);


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

       
    }
    
};


function migration1990(){

		var fileContents = fs.readFileSync("assets/react/utils/data/ACS_Migration/migration19902000.csv");

    	var lines = fileContents.toString().split('\n');

    	var header = [];

    	header =(lines[0].toString().split('\t'));

    	header.shift();

    	var rows = [];


    	var jsonData = {};



    	for(i=1;i<lines.length;i++){
    		rows.push(lines[i].toString().split('\t'));
    	}


    	rows.forEach(function(countyRow){

    		if(!jsonData[countyRow[1]]){
    			jsonData[countyRow[1]] = {};

    			header.forEach(function(colName,i){
    				jsonData[countyRow[1]][colName] = +countyRow[i];
    			})
    		}
    		else{

    			header.forEach(function(colName,i){
    				if(colName != 'fips'){
  						jsonData[countyRow[1]][colName] += +countyRow[i];  					
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


    	smallHeader = [];

    	header.forEach(function(colName){
    		if(colName == "STATE" || colName == "COUNTY" || colName == "NETMIG2000" ||
    			colName == "NETMIG2001" || colName == "NETMIG2002" || colName == "NETMIG2003" ||
    			colName == "NETMIG2004" || colName == "NETMIG2005" || colName == "NETMIG2006" ||
    			colName == "NETMIG2007" || colName == "NETMIG2008" || colName == "NETMIG2009"){
    			smallHeader.push(colName);
    		}
    	})




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