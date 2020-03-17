import React from "react"
import PropTypes from "prop-types"
import { Helmet } from "react-helmet"
import { HashRouter as Router } from "react-router-dom"

import Header from "./header"
import "./layout.css"

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
          <Header siteTitle="Seiyuu" />
          <main style={{ margin: '1em', }}>
            {children}
          </main>
          <footer style={{
            padding: '1em 0.5em',
            marginTop: 'auto',
            background: 'rebeccapurple',
            textAlign: 'center',
            color: 'white'
          }}>
            All anime/seiyuu data provided by anilist.
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
