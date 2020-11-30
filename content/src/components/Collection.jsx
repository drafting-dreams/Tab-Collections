import React, { useEffect, useState, useContext, useCallback } from 'react'
import CloseSharpIcon from '@material-ui/icons/CloseOutlined'
import { unpin } from '../scripts'
import { RouteContext } from './Router.jsx'
import InputBase from '@material-ui/core/InputBase'
import Link from '@material-ui/core/Link'
import AddSharpIcon from '@material-ui/icons/AddSharp'
import ArrowBackIosOutlinedIcon from '@material-ui/icons/ArrowBackIosOutlined'
import { makeStyles } from '@material-ui/core/styles'

const useStyle = makeStyles({
  input: {
    '& input': {
      fontSize: '24px !important',
      border: 'none !important',
      boxShadow: 'none !important',
      backgroundColor: 'transparent !important',
      '&:hover, &:focus': {
        backgroundColor: '#f7f7f7 !important',
      },
    },
  },
})

function goBack(setLocation) {
  setLocation('/')
}

function updateCollection(payload) {
  chrome.runtime.sendMessage({ type: 'update collection', payload })
}

function Collection({ id }) {
  const classes = useStyle()

  const { setLocation } = useContext(RouteContext)
  const [title, setTitle] = useState('')
  const [list, setList] = useState([])
  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'get collection', payload: { key: id } }, response => {
      setTitle(response.title)
      setList(response.list)
    })
  }, [])
  const handleChange = useCallback(
    event => {
      setTitle(event.target.value)
    },
    [setTitle]
  )
  return (
    <div className="tab-collections-container">
      <div className="head">
        <CloseSharpIcon className="icon icon-close" onClick={unpin} />
        <h1 className="title">
          <ArrowBackIosOutlinedIcon
            className="icon icon-back"
            onClick={() => {
              goBack(setLocation)
            }}
          />
          <InputBase
            className={classes.input}
            value={title}
            onChange={handleChange}
            onBlur={() => {
              updateCollection({ title, list, id: Number(id) })
            }}
          />
        </h1>
        <div>
          <Link className="icon-link-button" component="button" color="primary">
            <AddSharpIcon />
            <span className="button-text">Add Current Page</span>
          </Link>
        </div>
      </div>
      <div className="body"></div>
    </div>
  )
}

export default Collection
