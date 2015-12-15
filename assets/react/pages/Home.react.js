"use strict"
var React = require("react"),
    Bdstest = require("../components/density/bdstest.react"),
    msaIdToName = require("../components/utils/msaIdToName.json");

var Home = React.createClass({

    getInitialState:function(){
        return {"msa":"10580"};
    },

    getMsa:function(){
        var scope = this;

        var msaList = Object.keys(msaIdToName).map(function(msaId){
            return (<li><a href="#" id={msaId} onClick={scope.msaClick}>{msaId} - {msaIdToName[msaId]}</a></li>);
        })



        return (                
                <div className="dropdown">
                  <button className="btn btn-primary dropdown-toggle" type="button" data-toggle="dropdown">Metro Area Select
                  <span className="caret"></span></button>
                  <ul className="dropdown-menu">
                    {msaList}
                  </ul>
                </div>
                )
    },
    msaClick:function(e){
        var scope = this;
        scope.setState({"msa":e.currentTarget.id});
    },
   
    render:function() {
        var scope = this;
        var msaDrop = scope.getMsa();

        console.log("home.react", scope.state.msa);
        return (
            <div className="container main">
                <h1>Simple Project</h1>

                <div className="row">
                    <p style={{fontWeight:'bold'}}>Current Selection: {scope.state.msa}, {msaIdToName[scope.state.msa]}</p> {msaDrop} 
                    <div className="col-md-12">
                       <Bdstest msa={scope.state.msa}/>
                    </div>
                </div>

            </div>
                
        );
    }
});

module.exports = Home;
