import React, { useContext } from 'react'
import CloseSharpIcon from '@material-ui/icons/CloseOutlined'
import { unpin } from '../scripts'
import { RouteContext } from './Router.jsx'

function createCollection(setLocation) {
  chrome.runtime.sendMessage(
    {
      type: 'add collection',
      payload: {
        title: 'New Collections',
        list: [],
      },
    },
    response => {
      setLocation(`/collection/${response}`)
    }
  )
}

function Home() {
  const { setLocation } = useContext(RouteContext)
  return (
    <div className="container">
      <div className="head">
        <CloseSharpIcon className="icon icon-close" onClick={unpin} />
        <h1 className="title">Collections</h1>
        <div>
          <button
            onClick={() => {
              createCollection(setLocation)
            }}
          >
            Create new Collections
          </button>
        </div>
      </div>
      <div className="body"></div>
    </div>
  )
}

export default Home
