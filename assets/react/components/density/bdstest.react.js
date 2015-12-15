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

                yearAgeTable[row["year2"]][item] = row["estabs"]; 
            })      

        })
      
      return yearAgeTable;

    },
    renderTable:function(){
        var scope = this,
            ages = d3.range(12);


        var ageHead = ages.map(function(age){
            return(<th>{age}</th>)
        })

        if(Object.keys(scope.state.data).length === 0){
            return (<span>Loading</span>);
        }

        var allRows = Object.keys(scope.state.data).map(function(year){

            var row = ages.map(function(age){
                return (<td>{scope.state.data[year][age] || ""}</td>);
            })

            return(<tr><td>{year}</td>{row}</tr>)

        })

        var table = (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Year
                                {ageHead}
                                </th>
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
                    <h3>First Component</h3>
                    {table}
                </div>
        );
    }
});

module.exports = Bdstest;
