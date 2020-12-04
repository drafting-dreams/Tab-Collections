import React, { useEffect, useState, useContext, useCallback, useRef } from 'react'
import { unpin } from '../scripts'
import { RouteContext } from './Router.jsx'
import { Paper, Menu, MenuItem, ListItemIcon, InputBase, Link, Divider, Tooltip, Checkbox } from '@material-ui/core'
import CloseSharpIcon from '@material-ui/icons/CloseOutlined'
import AddSharpIcon from '@material-ui/icons/AddSharp'
import ArrowBackIosOutlinedIcon from '@material-ui/icons/ArrowBackIosOutlined'
import InsertDriveFileOutlinedIcon from '@material-ui/icons/InsertDriveFileOutlined'
import DeleteOutlineOutlinedIcon from '@material-ui/icons/DeleteOutlineOutlined'
import AddBoxOutlinedIcon from '@material-ui/icons/AddBoxOutlined'
import OpenInBrowserOutlinedIcon from '@material-ui/icons/OpenInBrowserOutlined'
import MoreHorizOutlinedIcon from '@material-ui/icons/MoreHorizOutlined'
import LibraryAddOutlinedIcon from '@material-ui/icons/LibraryAddOutlined'
import LinkOutlinedIcon from '@material-ui/icons/LinkOutlined'
import { copy } from '../../../utils'

function goBack(setLocation) {
  setLocation('/')
}

function Collection(props) {
  const { id } = props

  const { setLocation } = useContext(RouteContext)
  const [title, setTitle] = useState('')
  const [catchedTitle, setCatchedTitle] = useState('')
  const [list, setList] = useState(null)
  const [selectedList, setSelectedList] = useState([])
  const menuSelected = useRef()
  const [rightClickPosition, setRightClickPosition] = useState(null)
  const [moreClickPosition, setMoreClickPosition] = useState(null)
  const inputRef = useRef()
  const prevList = useRef(null)
  const pending = useRef(true)

  useEffect(() => {
    pending.current = true
    chrome.runtime.sendMessage({ type: 'get collection', payload: { key: id } }, response => {
      setTitle(response.title)
      setList(response.list)
      pending.current = false
    })
  }, [id])

  const updateCollection = useCallback(
    payload => {
      if (!pending.current) chrome.runtime.sendMessage({ type: 'update collection', payload })
    },
    [list, title]
  )
  const handleChange = useCallback(
    event => {
      setTitle(event.target.value)
    },
    [setTitle]
  )
  const handleTitleSave = useCallback(() => {
    if (title.trim() === '') {
      setTitle(catchedTitle)
      return
    }
    updateCollection({ title, list, id: Number(id) })
  }, [title, catchedTitle, setTitle])

  const addCurrentPage = useCallback(() => {
    chrome.runtime.sendMessage({ type: 'get current tab info' }, response => {
      setList([...list, { url: window.location.href, host: window.location.host, title: document.title, favicon: response.favIconUrl }])
    })
  }, [list, setList])
  useEffect(() => {
    if (prevList.current !== null && list.length !== prevList.current.length) {
      updateCollection({ title, list, id: Number(id) })
    }
  }, [list])
  useEffect(() => {
    prevList.current = list
  })

  const handleRightClick = useCallback(
    (index, event) => {
      event.preventDefault()
      // block this function if there are selected items
      if (selectedList.length) {
        return
      }
      menuSelected.current = index
      setRightClickPosition({ x: event.clientX, y: event.clientY })
    },
    [selectedList, setRightClickPosition]
  )
  const handleMenuClose = useCallback(() => {
    menuSelected.current = undefined
    setRightClickPosition(null)
  }, [setRightClickPosition])

  const deleteOne = useCallback(() => {
    const deletedList = [...list]
    deletedList.splice(menuSelected.current, 1)
    setList(deletedList)

    setRightClickPosition(null)
  }, [menuSelected.current, setList, setRightClickPosition])
  const deleteAll = useCallback(() => {
    setList([])
    setMoreClickPosition(null)
  }, [setList, setMoreClickPosition])
  const deleteSelected = useCallback(() => {
    const temp = [...list]
    selectedList.forEach(i => {
      temp[i] = undefined
    })
    setList(temp.filter(item => item !== undefined))
    setSelectedList([])
  }, [list, selectedList, setList, setSelectedList])

  const openOneInNewTab = useCallback(() => {
    window.open(list[menuSelected.current].url)
    setRightClickPosition(null)
  }, [menuSelected.current, setRightClickPosition])
  const openAllInNewTab = useCallback(() => {
    list.forEach(item => {
      window.open(item.url)
    })
    setMoreClickPosition(null)
  }, [list, setMoreClickPosition])
  const openSelectedInNewTab = useCallback(() => {
    selectedList.forEach(i => {
      window.open(list[i].url)
    })
    setSelectedList([])
  }, [list, selectedList, setSelectedList])

  const openMoreOptionsMenu = useCallback(
    event => {
      const position = event.currentTarget.getBoundingClientRect()
      setMoreClickPosition({ x: position.left, y: position.bottom })
    },
    [setMoreClickPosition]
  )
  const addAllTabs = useCallback(
    unpinned => () => {
      chrome.runtime.sendMessage({ type: 'get tabs info', payload: { unpinned } }, function (response) {
        setList([
          ...list,
          ...response
            .filter(tab => /^(http|https)/.test(tab.url))
            .map(tab => ({ url: tab.url, title: tab.title, favicon: tab.favIconUrl, host: tab.url.split('/')[2] })),
        ])
        setMoreClickPosition(null)
      })
    },
    [list, setList, setMoreClickPosition]
  )

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

  const copyUrl = useCallback(() => {
    copy(list[menuSelected.current].url)
    setRightClickPosition(null)
  }, [menuSelected.current, setRightClickPosition])

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
            ref={inputRef}
            className="input"
            value={title}
            onChange={handleChange}
            onFocus={() => {
              inputRef.current.children[0].select()
              setCatchedTitle(title)
            }}
            onBlur={handleTitleSave}
            onKeyUp={event => {
              if (event.key === 'Enter' && inputRef && inputRef.current) {
                inputRef.current.children[0].blur()
              }
            }}
          />
        </h1>
        <div>
          <Link className="icon-link-button" component="button" color="primary" onClick={addCurrentPage}>
            <AddSharpIcon className="icon-add" />
            <span className="button-text">Add Current Tab</span>
          </Link>
        </div>
        <Tooltip title="Add all tabs" classes={{ popper: 'tab-collection-max-z-index' }} enterDelay={400}>
          <AddBoxOutlinedIcon className="icon icon-add-all" onClick={addAllTabs()} />
        </Tooltip>
        <Tooltip title="More options" classes={{ popper: 'tab-collection-max-z-index' }} enterDelay={400} onClick={openMoreOptionsMenu}>
          {/* <OpenInBrowserOutlinedIcon className="icon icon-open-all" onClick={openAllInNewTab} /> */}
          <MoreHorizOutlinedIcon className="icon icon-more" />
        </Tooltip>
        <Menu
          container={document.querySelector('.tab-collections-react-root')}
          autoFocus={false}
          anchorReference="anchorPosition"
          anchorPosition={moreClickPosition ? { left: moreClickPosition.x - 200, top: moreClickPosition.y } : undefined}
          keepMounted
          open={moreClickPosition !== null}
          onClose={() => {
            setMoreClickPosition(null)
          }}
        >
          <MenuItem className="list-text" onClick={addAllTabs(true)}>
            <ListItemIcon className="list-icon-root">
              <LibraryAddOutlinedIcon className="list-icon" />
            </ListItemIcon>
            Add all unpinned tabs
          </MenuItem>
          <MenuItem className="list-text" onClick={deleteAll}>
            <ListItemIcon className="list-icon-root">
              <DeleteOutlineOutlinedIcon className="list-icon" />
            </ListItemIcon>
            Delete all tabs
          </MenuItem>
          <Divider />
          <MenuItem className="list-text" onClick={openAllInNewTab}>
            <ListItemIcon className="list-icon-root">
              <OpenInBrowserOutlinedIcon className="list-icon" />
            </ListItemIcon>
            Open all in new tabs
          </MenuItem>
        </Menu>
        <Paper className="selected-tip" style={{ display: selectedList.length ? 'flex' : 'none' }}>
          <CloseSharpIcon
            className="tip-icon"
            onClick={() => {
              setSelectedList([])
            }}
          />
          <span style={{ flexGrow: 1, marginLeft: '2px' }}>{selectedList.length} tab selected</span>
          <Tooltip title="Open selected" classes={{ popper: 'tab-collection-max-z-index' }} enterDelay={400}>
            <OpenInBrowserOutlinedIcon className="tip-icon" onClick={openSelectedInNewTab} />
          </Tooltip>
          <Tooltip title="Delete selected" classes={{ popper: 'tab-collection-max-z-index' }} enterDelay={400}>
            <DeleteOutlineOutlinedIcon className="tip-icon" onClick={deleteSelected} />
          </Tooltip>
        </Paper>
      </div>
      <div className="body">
        {list &&
          list.map((item, idx) => {
            const selected = selectedList.includes(idx)
            return (
              <Paper
                className={`paper ${selected ? 'paper-selected' : ''}`}
                variant="outlined"
                key={`${item.url}${idx}`}
                style={{ height: '75px' }}
                onClick={() => {
                  if (selectedList.length) {
                    checkOn(idx)
                  } else {
                    window.location.href = item.url
                  }
                }}
                onContextMenu={event => {
                  handleRightClick(idx, event)
                }}
              >
                <div className="title">{item.title}</div>
                <div className="url">
                  {item.favicon ? <img className="favicon" src={item.favicon} alt="" /> : <InsertDriveFileOutlinedIcon className="favicon" />}
                  {item.host.split('.').slice(-2).join('.')}
                </div>
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
              ? window.innerWidth - rightClickPosition.x > 170 // 170 is the menu's width
                ? { top: rightClickPosition.y, left: rightClickPosition.x }
                : { top: rightClickPosition.y, left: rightClickPosition.x - 170 }
              : undefined
          }
        >
          <MenuItem className="list-text" onClick={copyUrl}>
            <ListItemIcon className="list-icon-root">
              <LinkOutlinedIcon className="list-icon" />
            </ListItemIcon>
            Copy URL
          </MenuItem>
          <MenuItem className="list-text" onClick={deleteOne}>
            <ListItemIcon className="list-icon-root">
              <DeleteOutlineOutlinedIcon className="list-icon" />
            </ListItemIcon>
            Delete
          </MenuItem>
          <Divider />
          <MenuItem className="list-text" onClick={openOneInNewTab}>
            <ListItemIcon className="list-icon-root">
              <InsertDriveFileOutlinedIcon className="list-icon" />
            </ListItemIcon>
            Open in new Tab
          </MenuItem>
        </Menu>
      </div>
    </div>
  )
}

export default Collection
