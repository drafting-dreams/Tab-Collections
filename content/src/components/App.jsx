import React, { useEffect, useState } from 'react'

import { Snackbar } from '@material-ui/core'
import Alert from '@material-ui/lab/Alert'
import Router from './Router.jsx'
import Switch from './Switch.jsx'

import AppContext from '../context'
import useToast from '../hooks/useToast.js'

import { alertStyles, toastStyles } from '../styles/madeStyles.js'

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

  const { toast, setToast, displayToast, handleToastClose, severity } = useToast()

  return (
    <div>
      <AppContext.Provider value={{ setToast }}>
        <Router>
          <Switch key={version} />
        </Router>
        <Snackbar
          open={displayToast}
          autoHideDuration={3000}
          classes={toastStyles}
          onClose={handleToastClose}
          anchorOrigin={{ horizontal: 'center', vertical: 'top' }}
        >
          <Alert classes={alertStyles} severity={severity} variant="filled">
            {toast}
          </Alert>
        </Snackbar>
      </AppContext.Provider>
    </div>
  )
}

export default App
