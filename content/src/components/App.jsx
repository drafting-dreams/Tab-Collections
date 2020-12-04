import React, { useEffect, useState } from 'react'
import Router from './Router.jsx'
import Switch from './Switch.jsx'
let counter = 0
function App() {
  const [version, setVersion] = useState(counter)
  useEffect(() => {
    chrome.runtime.onMessage.addListener(function (request) {
      if (request.type === 'reload') {
        setVersion(++counter)
      }
    })
  }, [])
  return (
    <Router>
      <Switch key={version} />
    </Router>
  )
}

export default App
