"use strict"
var React = require("react"),
    d3 = require("d3");

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
            newFirmSum = 0;

        var format = d3.format(".3%");

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

        var allRows = Object.keys(scope.state.data).map(function(year){
            totalEmploySum = 0;
            newFirmSum = 0;
            //Row = 
            //Year - Share of total - Total - Age breakdown
            var row = ages.map(function(age){
                if(scope.state.data[year][age]){
                    totalEmploySum = totalEmploySum + scope.state.data[year][age];                   
                }
                if(scope.state.data[year][age] && (age == 0 || age == 1 || age == 2)){
                    newFirmSum = newFirmSum + scope.state.data[year][age];
                }

                return (<td className="col-md-1">{scope.state.data[year][age] || ""}</td>);
            })
            return(<tr><td>{year}</td><td>{newFirmSum}</td><td className="col-md-1">{format(newFirmSum/totalEmploySum)}</td><td className="col-md-1">{totalEmploySum}</td>{row}</tr>)

        })

        var table = (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>
                                Year
                                </th>
                                <th>
                                Employment in new firms (two years of age or younger)
                                </th>
                                <th>
                                Share of Employment in new Firms 
                                </th>
                                <th>
                                Total Employment
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
