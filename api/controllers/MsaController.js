var	fs = require('fs'),
	d3 = require('d3'),
	http = require('http'),
    msaIdToName = require("../../assets/react/components/utils/msaIdToName.json");

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


		msaData(msaId,function(data){
			res.json(data);
		})
    },
    allMsa:function(req,res){
    	//Before responding, need all the data

    	//full data will be array of objects
		var msaList = Object.keys(msaIdToName).map(function(key){
				return {"key":key};				
		});

		//If data is empty, we need to call msaData with that key to get it
		console.time('fullMsa sent')
		msaList.forEach(function(metroArea){
			//console.log(metroArea);
			if(metroArea.data == null){
				//console.log(metroArea.key);
				msaData(metroArea.key,function(data){
					metroArea.data = data;
					sendFullData(metroArea.key);
				})
			}
		})


		function sendFullData(msaId){
			//We know this is the last msaId;
			if(msaId == '49740'){
				res.send(msaList);
				console.timeEnd('fullMsa sent');
			}
		}


		//Want to iterate through the msaList
		//Get the data for it
		//When done, send it.

		//console.log(msaList);
		//res.send(msaList);

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

 		fileCache.checkCache({type:"msa",id:msaId},function(data){
 			if(data){
 				console.log('cache sucess');
 				console.time('send cache');
				cb(data);
 				console.timeEnd('send cache');
 			}
 			else{ 	

				var req = http.request(options, function(response){
				  response.setEncoding('utf8');

 				  response.on('data', function (chunk) {
				    //console.log('body:\n' + chunk);
				    fullData = fullData + chunk;
				  });				

				  response.on('end', function () {
				    //console.log(fullData);
		  			var parsedData = JSON.parse(fullData);
					fileCache.addData({type:"msa",id:msaId},parsedData);
					cb(parsedData);
				  });

 				});

				req.end();
			}
		});

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