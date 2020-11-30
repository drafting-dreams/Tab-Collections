import React, { useEffect, useState } from 'react'
import CloseSharpIcon from '@material-ui/icons/CloseOutlined'
import { unpin } from '../scripts'

function Collection({ id }) {
  const [title, setTitle] = useState('')
  const [list, setList] = useState([])
  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'get collection', payload: { key: id } }, response => {
      console.log(response)
      setName(response.title)
    })
  }, [])
  return (
    <div className="container">
      <div className="head">
        <CloseSharpIcon className="icon icon-close" onClick={unpin} />
        <h1 className="title">{id}</h1>
        <div>
          <button>Create new Collections</button>
        </div>
      </div>
      <div className="body"></div>
    </div>
  )
}

export default Collection
