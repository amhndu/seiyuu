import React from "react"
import { Switch, Route } from "react-router-dom";

import Layout from "../components/layout"
import { Search } from "../components/search"
import { Seiyuu } from "../components/seiyuu"

const IndexPage = () => (
    <Layout>
        <Switch>
            <Route exact path="/" component={Search} />
            {/* <Route path="/search/:name" component={Search} /> */}
            <Route exact path="/seiyuu/:id" component={Seiyuu} />
        </Switch>
    </Layout>
);

export default IndexPage
