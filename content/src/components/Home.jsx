import React from 'react'
import CloseOutlinedIcon from '@material-ui/icons/CloseOutlined'
import { unpin } from '../scripts'

function Home() {
  return (
    <div className="container">
      <div className="head">
        <CloseOutlinedIcon className="icon icon-close" onClick={unpin} />
        <h1 className="title">Collections</h1>
      </div>
      <div className="body"></div>
    </div>
  )
}

export default Home
