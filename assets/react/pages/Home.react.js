"use strict"
var React = require("react");

var Home = React.createClass({
   
    render() {
        console.log(this.state);
        return (
            <div className="container main">
                <h1>Simple Project</h1>
                <div className="row">
                    <div className="col-md-12">
                       
                    </div>
                </div>
                
        );
    }
});

module.exports = Home;
