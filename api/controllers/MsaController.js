var	fs = require('fs'),
	d3 = require('d3'),
	http = require('http'),
    msaIdToName = require("../../assets/react/components/utils/msaIdToName.json"),
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

    	//console.log(countypopagg);

        // d3.csv("../../assets/cache/countyPop/countypop2000.csv",function(err,data2000){


	       //  d3.csv("../../assets/cache/countyPop/countypop2010.csv",function(err,data2010){

	       //  	var agg = {};

	       //  	CountyPop1990.forEach(function(county,i){
	       //  		agg[county.fips] = {};

	       //  		if(!(CountyPop1990[i].fips == data2000[i].fips && data2000[i].fips == data2010[i].fips)){
	       //  			console.log(CountyPop1990[i].fips,data2000[i].fips,data2010[i].fips);
	       //  		}

	       //  		if(once){
	       //  			console.log(county,data2000[i],data2010[i]);
	       //  			once = 0;
	       //  		}

	       //  		Object.keys(county).forEach(function(year){
	       //  			agg[county.fips][year] = county[year];
	       //  		})

	       //  		Object.keys(data2000[i]).forEach(function(year){
	       //  			agg[county.fips][year] = data2000[i][year];
	       //  		})

	       //  		Object.keys(data2010[i]).forEach(function(year){
	       //  			agg[county.fips][year] = data2010[i][year];
	       //  		})

	        		


	       //  	})

	       //  })

        // })


//res.json(agg);

    }
    
};

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