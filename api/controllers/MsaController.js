var	fs = require('fs'),
	d3 = require('d3'),
	http = require('http');

module.exports = {
    index: function (req, res) {
        res.view({ devEnv : (process.env.NODE_ENV === 'development') });
    },
    statesGeo: function(req ,res) {

    },
    msaGeo: function(req, res) {

    },
    getMsa:function(req,res) {
 		var msaId = req.param('msaId'),
            url = "bds.availabs.org",
            path = "/firm/age/msa" + msaId,
            fullData = "";


		var options = {
		  hostname: url,
		  path: path,
		  port:80,
		  method:"GET"
		};

		console.log(options.hostname+options.path);

 		fileCache.checkCache({msa:msaId},function(data){
 			if(data){
 				console.log('cache sucess');
 				console.time('send cache');
 				res.json(data)
 				console.timeEnd('send cache');
 			}
 			else{ 	

 				var callback = function(response){
				  response.setEncoding('utf8');

 				  response.on('data', function (chunk) {
				    //console.log('body:\n' + chunk);
				    fullData = fullData + chunk;
				  });				

				  response.on('end', function () {
				    console.log(fullData);
		  			var parsedData = JSON.parse(fullData);
					console.time('send Data');
					res.json(parsedData);
					console.timeEnd('send Data');
					console.log('caching');
					fileCache.addData({msa:msaId},fullData);
				  });

 				}



				var req = http.request(options, callback);
				req.end();
			}
		});



    }
};

var fileCache = {
	
	cache : {},

	checkCache : function(request,callback){
		console.log('------------checkCache----'+request.msa+'----------------')
		var file = __dirname.substring(0,__dirname.length-15) + 'assets/cache/'+request.msa+'.json';
		
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
		var dir = __dirname.substring(0,__dirname.length-15) + 'assets/cache/';

		ensureExists(dir, 0744, function(err) {
		    if (err){
		    	console.log('ensure exists error')
		    } // handle folder creation error
		    var file = dir+request.msa+'.json';
		    
		    fs.writeFile(file,data, function(err) {
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