import React, { useContext, useEffect, useState } from 'react'
import CloseSharpIcon from '@material-ui/icons/CloseOutlined'
import { unpin } from '../scripts'
import { RouteContext } from './Router.jsx'
import Paper from '@material-ui/core/Paper'
import Link from '@material-ui/core/Link'
import AddSharpIcon from '@material-ui/icons/AddSharp'

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
  const [collections, setCollections] = useState([])
  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'get all' }, response => {
      setCollections(response)
    })
  }, [])
  const { setLocation } = useContext(RouteContext)
  return (
    <div className="tab-collections-container">
      <div className="head">
        <CloseSharpIcon className="icon icon-close" onClick={unpin} />
        <h1 className="title">Collections</h1>
        <div>
          <Link
            className="icon-link-button"
            component="button"
            color="primary"
            onClick={() => {
              createCollection(setLocation)
            }}
          >
            <AddSharpIcon className="icon-add" />
            <span className="button-text">Create new Collections</span>
          </Link>
        </div>
      </div>
      <div className="body">
        {collections.map(c => (
          <Paper
            className="paper"
            variant="outlined"
            key={c.id}
            onClick={() => {
              setLocation(`/collection/${c.id}`)
            }}
          >
            <div className="title">{c.title}</div>
            <div className="desc">{c.list.length} pages</div>
          </Paper>
        ))}
      </div>
    </div>
  )
}

export default Home
