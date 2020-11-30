import React, { useContext } from 'react'
import { RouteContext } from './Router.jsx'
import Home from './Home.jsx'
import Collection from './Collection.jsx'
import NotFound from './404.jsx'

function Switch() {
  const { location } = useContext(RouteContext)
  if (location === '/') {
    return <Home />
  } else if (location.startsWith('/collection')) {
    return <Collection id={location.split('/')[2]} />
  }
  return <NotFound />
}

export default Switch
