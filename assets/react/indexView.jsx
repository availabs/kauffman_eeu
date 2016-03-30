"use strict";

// Libraries
var React = require("react"),
    Router = require("react-router"),
    Route = Router.Route,
    Routes = Router.Routes,
    Redirect = Router.Redirect,
    DefaultRoute = Router.DefaultRoute,

    //SailsWebApi = require("./utils/api/SailsWebApi.react"),
    // Layout
	App = require("./pages/layout.react"),
    // Components
    //DemoOne =   require("./pages/DemoOne.react"),
    Home =  require("./pages/Home.react"),
    MapPage = require("./pages/mapPage.react"),
    GraphPage = require("./pages/graphPage.react");



// <Route name="demo1" path="/demo1" handler={DemoOne} />
       
var routes = (
	<Route name="app" path="/" handler={App}>
        <Route name="home" path="/" handler={Home} />
        <Route name="graph" path="/graphs" handler={GraphPage} />
        <Route name="map" path="/map" handler={MapPage} />
		<DefaultRoute handler={Home} />
	</Route>
);

Router.run(routes, (Handler) => {
	React.render(<Handler/>, document.getElementById("route-wrapper"));
});
