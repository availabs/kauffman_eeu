var React = require("react"),
    d3 = require("d3"),
    metroPop20002009 = require("../utils/metroAreaPop2000_2009.json"),
    colorbrewer = require('colorbrewer'),
    msaIdToName = require('../utils/msaIdToName.json'),
    abbrToFips = require('../utils/abbrToFips.json');

var RankTable = React.createClass({
    getInitialState: function() {

    	return {
    		sortYear:2002
    		}

    },
    getDefaultProps:function(){
    	return{
    		metric:"newFirms",
    		data:[]
    	}
    },
    sortTable:function(e){
    	var scope = this;
    	console.log("sortTable",e.target.id);
    	if(!e.target.id){
    		if(scope.props.metric == "share"){
    			scope.setState({sortYear:"1977"})    			
    		}
    		if(scope.props.metric == "newFirms"){
    		    scope.setState({sortYear:"2000"})	
    		}
    	}
    	else{
    		scope.setState({sortYear:e.target.id})    		
    	}

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

        	if(scope.props.metric == "composite"){
	        	if(aValue > bValue){
	        		return 1;
	        	}
	        	if(bValue > aValue){
	        		return -1;
	        	}
        	}
        	else{
	        	if(aValue > bValue){
	        		return -1;
	        	}
	        	if(bValue > aValue){
	        		return 1;
	        	}        		
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




		console.log(compositeCityRanks);
		return compositeCityRanks;
	},
    renderTable:function(){

		var scope = this,
            color = d3.scale.category20(),
            newFirmYears = d3.range(2000,2010),
            shareYears = d3.range(1977,2013),
            commaFormat = d3.format(",");

        var newFirmCities = scope.props.data["newFirms"],
        	shareCities = scope.props.data["share"];

        var currentCities,
        	currentYears,
        	currentFormat;

        if(scope.props.metric == "newFirms"){
        	currentCities = scope.rankNewFirm(newFirmCities);
        	currentYears = newFirmYears;
        	currentFormat = d3.round;
        }
        else if(scope.props.metric == "share"){
        	currentCities = scope.rankShare(shareCities);
        	currentYears = shareYears;
        	currentFormat = d3.format(".3%");
        }
        else{
        	currentCities = scope.rankComposite();
        	currentYears = newFirmYears;
        	currentFormat = d3.format("");
        }

        //Sort by year given by state
        var sortYear = scope.state.sortYear;
        currentCities.sort(scope.sortCities(sortYear));

        var rankStyle = {
        	fontWeight:'bold'
        }
        var nameStyle ={
        	minWidth:'150px'
        }
        var dataStyle={
        	minWidth:'150px',
        	height:'80px'
        }
        var headStyle ={
            minWidth:'150px',
            height:'60px'            
        }
        var valueClass = "col-md-1";

        var bodyRows = currentCities.map(function(city){

        	//Need a cell with (rank,value) for each year

        	var yearCells = city.values.map(function(curYear){
        		if(curYear.x == scope.state.sortYear){
        			valueClass = "col-md-1 active"
        		}
        		else{
        			valueClass = "col-md-1";
        		}
        		return (<td className={valueClass}style={dataStyle}><p style={rankStyle}>Year Rank: {curYear.rank}</p>Value: {currentFormat(curYear.y)}</td>)
        	})        		
        	


        	//Row needs color - name - yearCells

        	return(<tr>{yearCells}</tr>)


        })

        var nameColumns = currentCities.map(function(city){

            var colorStyle = {
                background:city.color,
                minWidth:150,
                height:80
            }        	

            var nameClass = "col-md-1";

			return(<tr><td className={nameClass} style={colorStyle}></td><td className={nameClass} style={nameStyle}>{city.name}</td></tr>)
        })



        var headRow = currentYears.map(function(year){
    	    if(year == scope.state.sortYear){
    			valueClass = "col-md-1 active"
    		}
    		else{
    			valueClass = "col-md-1";
    		}


            if((scope.props.metric == "newFirms" && year == 2000) || (scope.props.metric == "share" && year == 1977)){
                return(<th style={headStyle} className={valueClass}><a onClick={scope.sortTable} id={year}>Year: <br/>{year}</a></th>);               
            }
            else{
                return(<th style={headStyle} className={valueClass}><a onClick={scope.sortTable} id={year}>{year}</a></th>);
            }          		
        	
      	
        })

        var nameHead = (<tbody>
            <th style={nameStyle}>Color</th><th style={nameStyle}>Name</th>
            </tbody>);

        var name = (<tbody>{nameColumns}</tbody>)
        var body = (<tbody>{bodyRows}</tbody>);
        var head = (<tbody><tr>{headRow}</tr></tbody>);


        var tableComponents = {head:head,body:body,name:name,nameHead:nameHead};





        return tableComponents;
    },
    render: function(){
    	var scope = this,
    		tables;


        var headStyle = {
        	width:window.innerWidth
        }
        var tableHeadStyle = {
        	margin:'0'
        }
        var tableBodyHeadStyle = {
            display:'inline-block' ,
            width:window.innerWidth*.8,
            overflowX:'scroll',
            overflowY:'hidden'     
        }


        var bodyStyle = {
            height:window.innerHeight*.8,
            width:window.innerWidth,
            overflow:'auto'
        }
        var tableBodyStyle = {
        	display:'inline-block' ,
        	width:window.innerWidth*.8 - 10,
            overflow:'auto'
        }
        var nameStyle = {
        	width:window.innerWidth*.05,
        	display:'inline-block',
        	float:'left',
        	paddingRight:'300px',
        }

       	tables = scope.renderTable();
         $('#tableHead').on('scroll', function () {
            $('#tableBody').scrollLeft($(this).scrollLeft());
        });

        $('#tableBody').on('scroll', function () {
            $('#tableHead').scrollLeft($(this).scrollLeft());
        });  

        $('#tableName').on('scroll', function () {
            $('#tableBody').scrollTop($(this).scrollTop());
        });

        $('#tableBody').on('scroll', function () {
            $('#tableName').scrollTop($(this).scrollTop());
        });         
        console.log("table",scope)
        return (
				<div id="table">
					<div style={headStyle}>
                        <div style={nameStyle}>
                            <table style = {tableHeadStyle}className="table table-hover" fixed-header>{tables.nameHead}</table>
                        </div>
						<div style={tableBodyHeadStyle}  id="tableHead">
                            <table style = {tableHeadStyle}className="table table-hover" fixed-header>{tables.head}</table>
                        </div>
					</div>
					<div style={bodyStyle}>
						<div style={nameStyle} id ="tableName">
                            <table className="table table-hover" >{tables.name}</table>
                        </div>
						<div style={tableBodyStyle} id="tableBody">
                            <table  className="table table-hover" >{tables.body}</table>
                        </div>
					</div>
				</div>
        )
    }
})

module.exports = RankTable;