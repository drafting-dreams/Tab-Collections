import React, { useContext, useEffect, useState, useRef } from 'react'
import { unpin } from '../scripts'
import { RouteContext } from './Router.jsx'
import { Paper, Link, Menu, MenuItem, ListItemIcon, Checkbox, Tooltip } from '@material-ui/core'
import CloseSharpIcon from '@material-ui/icons/CloseOutlined'
import AddSharpIcon from '@material-ui/icons/AddSharp'
import DeleteOutlineOutlined from '@material-ui/icons/DeleteOutlineOutlined'
import OpenInBrowserOutlinedIcon from '@material-ui/icons/OpenInBrowserOutlined'
import FolderOpenOutlinedIcon from '@material-ui/icons/FolderOpenOutlined'
import DeleteOutlineOutlinedIcon from '@material-ui/icons/DeleteOutlineOutlined'
import MoreHorizOutlinedIcon from '@material-ui/icons/MoreHorizOutlined'
import PostAddOutlinedIcon from '@material-ui/icons/PostAddOutlined'

// Edge Browser also has this chrome info in its useragent,
// So here I only use the Chrome version.
// Note: chrome.tabGroups API is only available with Chrome89+ and Manifest V3+
const CHROME_VERSION = /Chrome\/(\d+)/.exec(navigator.userAgent) ? Number(/Chrome\/(\d+)/.exec(navigator.userAgent)[1]) : 0
const ENABLE_GROUP_TAB_FEATURE = CHROME_VERSION >= 89

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

  const [moreClickPosition, setMoreClickPosition] = useState(null)

  const menuSelected = useRef()
  const [selectedList, setSelectedList] = useState([])
  const [rightClickPosition, setRightClickPosition] = useState(null)

  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'get all' }, response => {
      setCollections(response)
    })
  }, [])

  const openMoreOptionsMenu = event => {
    const position = event.currentTarget.getBoundingClientRect()
    setMoreClickPosition({ x: position.left, y: position.bottom })
  }
  const createCollectionWithGroup = () => {
    chrome.runtime.sendMessage({ type: 'get current tab info' }, response => {
      const { groupId } = response
      chrome.runtime.sendMessage({ type: 'create collection using a group', payload: { groupId } })
    })
  }

  const handleRightClick = (index, event) => {
    event.preventDefault()
    menuSelected.current = index
    setRightClickPosition({ x: event.clientX, y: event.clientY })
  }
  const openTabs = () => {
    collections[menuSelected.current].list.forEach(item => {
      window.open(item.url)
    })
    setRightClickPosition(null)
  }
  const openTabsInAGroup = () => {
    chrome.runtime.sendMessage({ type: 'open tabs in a group', payload: collections[menuSelected.current] })
    setRightClickPosition(null)
  }
  const deleteCollection = () => {
    chrome.runtime.sendMessage({ type: 'delete collection', payload: { keys: [collections[menuSelected.current].id] } })
    const temp = [...collections]
    temp.splice(menuSelected.current, 1)
    setCollections(temp)
    setRightClickPosition(null)
  }
  const deleteSelected = () => {
    chrome.runtime.sendMessage({ type: 'delete collection', payload: { keys: selectedList.map(idx => collections[idx].id) } })
    const temp = [...collections]
    selectedList.forEach(i => {
      temp[i] = undefined
    })
    setCollections(temp.filter(c => c !== undefined))
    setSelectedList([])
  }
  const handleMenuClose = () => {
    menuSelected.current = undefined
    setRightClickPosition(null)
  }

  const checkOn = idx => {
    const filtered = selectedList.filter(i => i !== idx)
    if (filtered.length === selectedList.length) {
      filtered.push(idx)
    }
    setSelectedList(filtered)
  }

  const showOpenAllTabsMenuItem = menuSelected.current !== undefined && collections[menuSelected.current]?.list.length > 0
  const showOpenInNewTabMenuItem = showOpenAllTabsMenuItem && ENABLE_GROUP_TAB_FEATURE

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
        {ENABLE_GROUP_TAB_FEATURE && (
          <Tooltip title="More options" classes={{ popper: 'tab-collection-max-z-index' }} enterDelay={400} onClick={openMoreOptionsMenu}>
            <MoreHorizOutlinedIcon className="icon icon-more" />
          </Tooltip>
        )}
        {ENABLE_GROUP_TAB_FEATURE && (
          <Menu
            container={document.querySelector('.tab-collections-react-root')}
            autoFocus={false}
            anchorReference="anchorPosition"
            anchorPosition={moreClickPosition ? { left: moreClickPosition.x - 300, top: moreClickPosition.y } : undefined}
            keepMounted
            open={moreClickPosition !== null}
            onClose={() => {
              setMoreClickPosition(null)
            }}
          >
            <MenuItem className="list-text" onClick={createCollectionWithGroup}>
              <ListItemIcon className="list-icon-root">
                <PostAddOutlinedIcon className="list-icon" />
              </ListItemIcon>
              Create collection with current tab group
            </MenuItem>
          </Menu>
        )}
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
          container={document.querySelector('.tab-collections-react-root')}
          autoFocus={false}
          keepMounted
          open={rightClickPosition !== null}
          onClose={handleMenuClose}
          anchorReference="anchorPosition"
          anchorPosition={
            rightClickPosition
              ? window.innerWidth - rightClickPosition.x > 245 // 1245 is the menu's width
                ? { top: rightClickPosition.y, left: rightClickPosition.x }
                : { top: rightClickPosition.y, left: rightClickPosition.x - 245 }
              : undefined
          }
        >
          {showOpenAllTabsMenuItem && (
            <MenuItem className="list-text" onClick={openTabs}>
              <ListItemIcon className="list-icon-root">
                <OpenInBrowserOutlinedIcon className="list-icon" />
              </ListItemIcon>
              Open all tabs
            </MenuItem>
          )}
          {showOpenInNewTabMenuItem && (
            <MenuItem className="list-text" onClick={openTabsInAGroup}>
              <ListItemIcon className="list-icon-root">
                <FolderOpenOutlinedIcon className="list-icon" />
              </ListItemIcon>
              Open all tabs in a new group
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
