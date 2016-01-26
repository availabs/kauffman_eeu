var React = require("react"),
	d3 = require("d3");

var RankingsGraph = React.createClass({
    getInitialState:function(){
        return {
            data:[],
            loading:true,
            group:"msa"
        }
    },
    getDefaultProps:function(){
        return({
            data:[],
            color:"population",
            group:"msa"
        })
    },
    componentWillMount:function(){
        var scope = this;
        console.log("mount",scope);
        scope.setState({data:scope.processData(scope.props.data),loading:false,group:scope.props.group});
    },
    componentWillReceiveProps:function(nextProps){
        var scope = this;
        console.log("recieving props",nextProps);
        scope.setState({data:scope.processData(scope.props.data),loading:false,group:nextProps.group});
    },
    processData:function(data){
        var scope = this;

        //Extract only the fields we need from the dataset
        var metroAreaData = scope.trimData(data);
        //Data Now arranged by MSAID -> Year -> Firm Age
        console.log(metroAreaData);

        //Want an array with one object PER metro area
        //Object will look like: {values:[{x:1977,y:val}, {x:1978,y:val}....],key=msa,}
        //Convert the trimmed data into a set of (x,y) coordinates for the chart

        // if(scope.state.group == "msa"){
        //     var chartData = scope.chartMsaData(metroAreaData);           
        // }
        // if(scope.state.group == "state"){
        //     var chartData = scope.chartStateData(metroAreaData);           
        // }        
        // //console.log("chartdata",chartData);


        // //Add indexes to the objects themselves
        // var finalData = scope.addIndex(chartData);

        return metroAreaData;
    },
    trimData:function(data){
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
	shareRank:function(){

	},
	newFirmRank:function(){

	},
	render:function() {
		console.log("RANKINGS GRAPH")
		d3.selectAll("svg").remove();



		return (
			<div>
				<h3>Rankings</h3>
			</div>
			
		);
	}
});

module.exports = RankingsGraph;