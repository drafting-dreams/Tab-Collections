import React, { useState } from 'react'
export const RouteContext = React.createContext({})
function Router(props) {
  const [location, setLocation] = useState('/')
  return <RouteContext.Provider value={{ location, setLocation }}>{props.children}</RouteContext.Provider>
}

export default Router
