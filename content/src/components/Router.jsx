import React, { useEffect, useState, useRef } from 'react'
export const RouteContext = React.createContext({})
function Router(props) {
  const [location, setLocation] = useState('/')
  const locationRef = useRef('/')
  const locationChangedByOthers = useRef(true)
  useEffect(() => {
    const listener = request => {
      if (request.type === 'route change') {
        if (request.payload.route !== locationRef.current) {
          locationChangedByOthers.current = true
          setLocation(request.payload.route)
        }
      }
    }
    chrome.runtime.onMessage.addListener(listener)
    return () => {
      chrome.runtime.onMessage.removeListener(listener)
    }
  }, [])
  // locationChangedByOthers was initialized to true, because effect below would execute when mounted,
  // and we don't want to inform route change when mounted
  useEffect(() => {
    // if the location is not changed by other tabs, then send message to inform others
    if (locationChangedByOthers.current) {
      locationChangedByOthers.current = false
    } else {
      chrome.runtime.sendMessage({ type: 'inform route change', payload: { route: location } })
    }
    locationRef.current = location
  }, [location])
  return <RouteContext.Provider value={{ location, setLocation }}>{props.children}</RouteContext.Provider>
}

export default Router
