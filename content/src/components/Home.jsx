import React, { useCallback, useContext, useEffect, useState, useRef } from 'react'
import { unpin } from '../scripts'
import { RouteContext } from './Router.jsx'
import { Paper, Link, Menu, MenuItem, ListItemIcon, Checkbox, Tooltip } from '@material-ui/core'
import CloseSharpIcon from '@material-ui/icons/CloseOutlined'
import AddSharpIcon from '@material-ui/icons/AddSharp'
import DeleteOutlineOutlined from '@material-ui/icons/DeleteOutlineOutlined'
import OpenInBrowserOutlinedIcon from '@material-ui/icons/OpenInBrowserOutlined'
import DeleteOutlineOutlinedIcon from '@material-ui/icons/DeleteOutlineOutlined'

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

function Home(props) {
  const { setLocation } = useContext(RouteContext)
  const [collections, setCollections] = useState([])

  const menuSelected = useRef()
  const [selectedList, setSelectedList] = useState([])
  const [rightClickPosition, setRightClickPosition] = useState(null)

  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'get all' }, response => {
      setCollections(response)
    })
  }, [])

  const handleRightClick = useCallback(
    (index, event) => {
      event.preventDefault()
      menuSelected.current = index
      setRightClickPosition({ x: event.clientX, y: event.clientY })
    },
    [menuSelected.current, setRightClickPosition]
  )
  const openTabs = useCallback(() => {
    collections[menuSelected.current].list.forEach(item => {
      window.open(item.url)
    })
    setRightClickPosition(null)
  }, [collections, menuSelected.current, setRightClickPosition])
  const deleteCollection = useCallback(() => {
    chrome.runtime.sendMessage({ type: 'delete collection', payload: { keys: [collections[menuSelected.current].id] } })
    const temp = [...collections]
    temp.splice(menuSelected.current, 1)
    setCollections(temp)
    setRightClickPosition(null)
  }, [menuSelected.current, collections, setRightClickPosition])
  const deleteSelected = useCallback(() => {
    chrome.runtime.sendMessage({ type: 'delete collection', payload: { keys: selectedList.map(idx => collections[idx].id) } })
    const temp = [...collections]
    selectedList.forEach(i => {
      temp[i] = undefined
    })
    setCollections(temp.filter(c => c !== undefined))
    setSelectedList([])
  }, [collections, selectedList, setCollections])
  const handleMenuClose = useCallback(() => {
    menuSelected.current = undefined
    setRightClickPosition(null)
  }, [setRightClickPosition])

  const checkOn = useCallback(
    idx => {
      const filtered = selectedList.filter(i => i !== idx)
      if (filtered.length === selectedList.length) {
        filtered.push(idx)
      }
      setSelectedList(filtered)
    },
    [selectedList]
  )

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
        <Paper className="selected-tip" style={{ display: selectedList.length ? 'flex' : 'none' }}>
          <CloseSharpIcon
            className="tip-icon"
            onClick={() => {
              setSelectedList([])
            }}
          />
          <span style={{ flexGrow: 1, marginLeft: '2px' }}>{selectedList.length} collections selected</span>
          <Tooltip title="Delete selected" classes={{ popper: 'tab-collection-max-z-index' }} enterDelay={400}>
            <DeleteOutlineOutlinedIcon className="tip-icon" onClick={deleteSelected} />
          </Tooltip>
        </Paper>
      </div>
      <div className="body">
        {collections.map((c, idx) => {
          const selected = selectedList.includes(idx)
          return (
            <Paper
              className={`paper ${selected ? 'paper-selected' : ''}`}
              variant="outlined"
              key={c.id}
              onClick={() => {
                if (selectedList.length) {
                  checkOn(idx)
                } else {
                  setLocation(`/collection/${c.id}`)
                }
              }}
              onContextMenu={event => {
                handleRightClick(idx, event)
              }}
            >
              <div className="title">{c.title}</div>
              <div className="desc">{c.list.length} pages</div>
              <div
                className="checkbox"
                style={{ display: selected ? 'block' : '' }}
                onClick={event => {
                  event.stopPropagation()
                  checkOn(idx)
                }}
              >
                <Checkbox color="primary" checked={selected} />
              </div>
            </Paper>
          )
        })}
        <Menu
          classes={{ paper: 'home-menu' }}
          container={document.querySelector('.tab-collections-react-root')}
          autoFocus={false}
          keepMounted
          open={rightClickPosition !== null}
          onClose={handleMenuClose}
          anchorReference="anchorPosition"
          anchorPosition={
            rightClickPosition
              ? window.innerWidth - rightClickPosition.x > 147 // 170 is the menu's width
                ? { top: rightClickPosition.y, left: rightClickPosition.x }
                : { top: rightClickPosition.y, left: rightClickPosition.x - 147 }
              : undefined
          }
        >
          {menuSelected.current !== undefined && collections[menuSelected.current].list.length > 0 && (
            <MenuItem className="list-text" onClick={openTabs}>
              <ListItemIcon className="list-icon-root">
                <OpenInBrowserOutlinedIcon className="list-icon" />
              </ListItemIcon>
              Open all tabs
            </MenuItem>
          )}
          <MenuItem className="list-text" onClick={deleteCollection}>
            <ListItemIcon className="list-icon-root">
              <DeleteOutlineOutlined className="list-icon" />
            </ListItemIcon>
            Delete
          </MenuItem>
        </Menu>
      </div>
    </div>
  )
}

export default Home
