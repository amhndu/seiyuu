import React from "react"
import {
  HashRouter as Router, Switch, Route
} from "react-router-dom";

import Layout from "../components/layout"
import { Search } from "../components/search"
import { Seiyuu } from "../components/seiyuu"

const IndexPage = () => (
    <Router>
        <Switch>
            <Layout>
                <Route exact path="/" component={Search} />
                {/* <Route path="/search/:name" component={Search} /> */}
                <Route exact path="/seiyuu/:id" component={Seiyuu} />
            </Layout>
        </Switch>
    </Router>
);

export default IndexPage
