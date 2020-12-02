import React, { useEffect, useState, useContext, useCallback, useRef } from 'react'
import { unpin } from '../scripts'
import { RouteContext } from './Router.jsx'
import { Paper, Menu, MenuItem, ListItemIcon, InputBase, Link, Divider, Tooltip } from '@material-ui/core'
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
import { makeStyles } from '@material-ui/core/styles'
import { copy } from '../../../utils'
const Z_INDEX = 2147483647

const useStyle = makeStyles({
  tooltip: {
    zIndex: Z_INDEX,
  },
  input: {
    flexShrink: 1,
    '& input': {
      fontSize: '24px !important',
      border: 'none !important',
      boxShadow: 'none !important',
      backgroundColor: 'transparent !important',
      textOverflow: 'ellipsis',
      '&:hover, &:focus': {
        backgroundColor: '#e7e7e7 !important',
      },
    },
  },
  listIconRoot: {
    minWidth: '30px',
  },
  listText: {
    fontSize: '14px',
  },
})

const getFavicon = function () {
  let favicon = undefined
  const nodeList = document.getElementsByTagName('link')
  for (let i = 0; i < nodeList.length; i++) {
    if (nodeList[i].getAttribute('rel') === 'icon' || nodeList[i].getAttribute('rel') === 'shortcut icon') {
      favicon = nodeList[i].getAttribute('href')
      if (favicon.startsWith('/')) {
        favicon = `${window.location.origin}${favicon}`
      }
      break
    }
  }
  return favicon
}

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
  const menuSelected = useRef()
  const [rightClickPosition, setRightClickPosition] = useState(null)
  const [moreClickPosition, setMoreClickPosition] = useState(null)

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

  const addCurrentPage = useCallback(() => {
    setList([...list, { url: window.location.href, host: window.location.host, title: document.title, favicon: getFavicon() }])
  }, [list, setList])
  useEffect(() => {
    updateCollection({ title, list, id: Number(id) })
  }, [list])

  const handleRightClick = useCallback(
    (index, event) => {
      event.preventDefault()
      menuSelected.current = index
      setRightClickPosition({ x: event.clientX, y: event.clientY })
    },
    [setRightClickPosition]
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
  })

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
            className={classes.input}
            value={title}
            onChange={handleChange}
            onBlur={() => {
              updateCollection({ title, list, id: Number(id) })
            }}
          />
        </h1>
        <div>
          <Link className="icon-link-button" component="button" color="primary" onClick={addCurrentPage}>
            <AddSharpIcon className="icon-add" />
            <span className="button-text">Add Current Tab</span>
          </Link>
        </div>
        <Tooltip title="Add all tabs" classes={{ popper: classes.tooltip }} enterDelay={400}>
          <AddBoxOutlinedIcon className="icon icon-add-all" onClick={addAllTabs()} />
        </Tooltip>
        <Tooltip title="More options" classes={{ popper: classes.tooltip }} enterDelay={400} onClick={openMoreOptionsMenu}>
          {/* <OpenInBrowserOutlinedIcon className="icon icon-open-all" onClick={openAllInNewTab} /> */}
          <MoreHorizOutlinedIcon className="icon icon-more" />
        </Tooltip>
        <Menu
          container={document.querySelector('.tab-collections-react-root')}
          autoFocus={false}
          anchorReference="anchorPosition"
          anchorPosition={moreClickPosition ? { left: moreClickPosition.x - 220, top: moreClickPosition.y } : undefined}
          keepMounted
          open={moreClickPosition !== null}
          onClose={() => {
            setMoreClickPosition(null)
          }}
        >
          <MenuItem classes={classes.listText} onClick={addAllTabs(true)}>
            <ListItemIcon className={classes.listIconRoot}>
              <LibraryAddOutlinedIcon fontSize="small" />
            </ListItemIcon>
            Add all unpinned tabs
          </MenuItem>
          <MenuItem classes={classes.listText} onClick={deleteAll}>
            <ListItemIcon className={classes.listIconRoot}>
              <DeleteOutlineOutlinedIcon fontSize="small" />
            </ListItemIcon>
            Delete all tabs
          </MenuItem>
          <Divider />
          <MenuItem classes={classes.listText} onClick={openAllInNewTab}>
            <ListItemIcon className={classes.listIconRoot}>
              <OpenInBrowserOutlinedIcon fontSize="small" />
            </ListItemIcon>
            Open all in new tabs
          </MenuItem>
        </Menu>
      </div>
      <div className="body">
        {list.map((item, idx) => (
          <Paper
            className="paper"
            variant="outlined"
            key={`${item.url}${idx}`}
            style={{ height: '75px' }}
            onClick={() => {
              window.location.href = item.url
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
          </Paper>
        ))}
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
          <MenuItem className={classes.listText} onClick={copyUrl}>
            <ListItemIcon className={classes.listIconRoot}>
              <LinkOutlinedIcon fontSize="small" />
            </ListItemIcon>
            Copy URL
          </MenuItem>
          <MenuItem className={classes.listText} onClick={deleteOne}>
            <ListItemIcon className={classes.listIconRoot}>
              <DeleteOutlineOutlinedIcon fontSize="small" />
            </ListItemIcon>
            Delete
          </MenuItem>
          <Divider />
          <MenuItem className={classes.listText} onClick={openOneInNewTab}>
            <ListItemIcon className={classes.listIconRoot}>
              <InsertDriveFileOutlinedIcon fontSize="small" />
            </ListItemIcon>
            Open in new Tab
          </MenuItem>
        </Menu>
      </div>
    </div>
  )
}

export default Collection
