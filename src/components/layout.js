import React from "react"
import PropTypes from "prop-types"
import { Helmet } from "react-helmet"
import { HashRouter as Router, Link } from "react-router-dom"

import Header from "./header"
import "./layout.css"
import { APP_NAME } from "../common"

const Layout = ({ children }) => {
  return (
    <>
      <Helmet>
        <title>Seiyuu App</title>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />
      </Helmet>
      <Router>
        <div style={{
            display: 'flex',
            flexDirection:'column',
            minHeight: '100vh',
          }}
        >
          <Header siteTitle={APP_NAME} />
          <main style={{ margin: '1em', }}>
            {children}
          </main>
          <footer style={{
            padding: '1em 0.5em',
            marginTop: 'auto',
            textAlign: 'center',
            color: 'white'
          }}>
            All anime/seiyuu data provided by <a href="https://anilist.co">anilist</a>. <br/>
            A better seiyuu page.<br/>
            <Link to="/">Home</Link><br/>
          </footer>
        </div>
      </Router>
    </>
  )
}

Layout.propTypes = {
  children: PropTypes.node.isRequired,
}

export default Layout
