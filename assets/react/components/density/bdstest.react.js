"use strict"
var React = require("react"),
    d3 = require("d3"),
    metroPop20002009 = require("../utils/metroAreaPop2000_2009.json");

    //Share of employement in new and young firms
    //new firms = firms of age 0, 1, 2, 3
    //Start in 180 

    //Make a dropdown for MSA
    //Make it in HOME
    //This changes the PROPS


    //SECOND
    //population from ACS by MSA
    //https://www.census.gov/popest/data/historical/

    //Eventually compare across all MSA

var Bdstest = React.createClass({

    getInitialState:function(){
        return {data:{}}
    },
    getDefaultProps:function(){
        return {"msa":"10580"};
    },
    componentWillReceiveProps:function(nextProps){
        var scope = this;

        console.log("bdstest",nextProps);
        scope.getData(nextProps.msa,function(data){
            scope.setState({data:scope.processData(data)});
        })
    },
    componentDidMount:function(){
        var scope = this;

        scope.getData(scope.props.msa,function(data){
            scope.setState({data:scope.processData(data)});
        })
    },
    getData:function(msaId,cb){
        var scope = this,
            url = "http://bds.availabs.org",
            path = "/firm/age/msa";

        d3.json(url+path+msaId,function(err,data){
            //console.log(url+path+scope.props.msa);
            console.log(data);
            return cb(data);            
        })
    },
    processData:function(data){
        var scope = this,
            tableRow = "",
            yearAgeTable = {};


        Object.keys(data).forEach(function(item){
            data[item][scope.props.msa].map(function(row){

                if( yearAgeTable[row["year2"]] === undefined ){
                    yearAgeTable[row["year2"]] = {};                        
                }
                //Emp = jobs for (firms of this age) in this year
                yearAgeTable[row["year2"]][item] = row["emp"]; 
            })      

        })
      
      return yearAgeTable;

    },
    renderTable:function(){
        var scope = this,
            ages = d3.range(12),
            totalEmploySum = 0,
            newFirmSum = 0,
            totalPop = "n/a",
            maxShare = 0,
            maxShareYear = 1977;

        var percFormat = d3.format(".3%"),
            commaFormat = d3.format(",");

        var curClass;

        var ageHead = ages.map(function(age){
            if(age == 0){
                return(<th>Employment in Firms age <br/>{age} year(s)</th>)               
            }
            else{
                return(<th>{age}</th>)
            }

        })

        if(Object.keys(scope.state.data).length === 0){
            return (<span>Loading</span>);
        }

        //Takes care of the data portion for the table
        //Does it one year at a time
        var allRows = Object.keys(scope.state.data).map(function(year){
            totalEmploySum = 0;
            newFirmSum = 0;


            //Returns the raw employment data by age of firm, for that year
            //Also keeps track of employment in "new" firms
            var row = ages.map(function(age){
                if(scope.state.data[year][age]){
                    totalEmploySum = totalEmploySum + scope.state.data[year][age];                   
                }
                if(scope.state.data[year][age] && (age == 0 || age == 1 || age == 2)){
                    newFirmSum = newFirmSum + scope.state.data[year][age];
                }

                //Broke into proper if-else 
                //In order to use number formatting and not display "NaN"
                if(scope.state.data[year][age]){
                    return (<td className="col-md-1">{commaFormat(scope.state.data[year][age])}</td>);                    
                }
                else{
                    return (<td className="col-md-1"></td>);                     
                }

            })

            //Right now, only have population data by metro area
            //For years 2000 thru 2009
            if(year >= 2000 && year <=2009){
                totalPop = metroPop20002009[scope.props.msa][year];
            }

            if(newFirmSum/totalEmploySum > maxShare){
                maxShare = newFirmSum/totalEmploySum;
                maxShareYear = year;
            }
            //Returns the row for that year
            //Year - Share of employment in new firms - Total Metro Population - Raw Employment totaled in new firms - Raw employment by age of firm
            return(<tr className="" id={year}><td>{year}</td><td className="col-md-1">{percFormat(newFirmSum/totalEmploySum)}</td><td>{totalPop}</td><td className="col-md-1">{commaFormat(totalEmploySum)}</td><td>{commaFormat(newFirmSum)}</td>{row}</tr>)

        })

    //Iterate through all of the rows to find the one that has the best new employment share
    Object.keys(allRows).forEach(function(row){

        //There is proably a better way to do this
        //But if the id (which is the year) is the max year, we found it, set it to info
        if(allRows[row]["props"]["id"] == maxShareYear){
            var newRow = React.cloneElement(allRows[row],{className:"info"});
            console.log("newRow",newRow);
            allRows[row] = newRow;           
        }

    })

        //Full table
        var table = (
                    <table className="table table-hover">
                        <thead>
                            <tr>
                                <th>
                                Year
                                </th>
                                <th>
                                Share of Employment in new Firms (two years of age or younger)
                                </th>
                                <th>
                                Total Metro Population 
                                </th>
                                <th>
                                Total Employment
                                </th>
                                <th>
                                Employment in new firms 
                                </th>
                                {ageHead}
                                
                            </tr>
                        </thead>
                        <tbody>
                            {allRows}
                        </tbody>
                    </table>
                    )

        return table;
    },
    render:function() {
        var scope = this;

        var table = scope.renderTable();
        return (
                <div>
                    {table}
                </div>
        );
    }
});

module.exports = Bdstest;
