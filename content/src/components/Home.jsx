import React, { useContext, useEffect, useState, useRef, useReducer } from 'react'
import { unpin } from '../scripts'
import { RouteContext } from './Router.jsx'
import {
  Paper,
  Link,
  Menu,
  MenuItem,
  ListItemIcon,
  Checkbox,
  Tooltip,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  TextField,
  Snackbar,
} from '@material-ui/core'
import Alert from '@material-ui/lab/Alert'
import {
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
  CheckBox as CheckBoxIcon,
  CloseOutlined as CloseSharpIcon,
  AddSharp as AddSharpIcon,
  DeleteOutlineOutlined as DeleteOutlineOutlinedIcon,
  OpenInBrowserOutlined as OpenInBrowserOutlinedIcon,
  FolderOpenOutlined as FolderOpenOutlinedIcon,
  MoreHorizOutlined as MoreHorizOutlinedIcon,
  PostAddOutlined as PostAddOutlinedIcon,
  SwapCalls as SwapCallsIcon,
  TransformOutlined as TransformOutlinedIcon,
} from '@material-ui/icons'

import useToast from '../hooks/useToast'
import { ENABLE_GROUP_TAB_FEATURE } from '../utils/featureToggles'

import { useDialogStyles, useDialogActionsStyles, useToastStyles, useAlertStyles } from '../styles/madeStyles'

const NEW_COLLECTIONS = 'New Collections'

const dialogInitialState = null
function dialogReducer(state, action) {
  const { type, groupName } = action
  switch (action.type) {
    case 'close':
      return null
    case 'create collection with surroundings':
      return { type, groupName: NEW_COLLECTIONS }
    case 'input':
      return { ...state, groupName }
    default:
      return null
  }
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

  const createCollection = () => {
    chrome.runtime.sendMessage(
      {
        type: 'add collection',
        payload: {
          title: NEW_COLLECTIONS,
          list: [],
        },
      },
      response => {
        setLocation(`/collection/${response}`)
      }
    )
  }

  // Toast
  const { toast, setToast, displayToast, handleToastClose } = useToast()

  // Dialog
  const dialogInputRef = useRef()
  const [dialogState, dialogDispatch] = useReducer(dialogReducer, dialogInitialState)
  const handleDialogClose = () => {
    dialogDispatch({ type: 'close' })
  }
  const handleDialogInput = e => {
    dialogDispatch({ type: 'input', groupName: e.currentTarget.value })
  }
  const handleSubmit = () => {
    if (dialogState?.type === 'create collection with surroundings') {
      chrome.runtime.sendMessage({ type: dialogState.type, payload: dialogState })
    }
    dialogDispatch({ type: 'close' })
  }

  // MoreOptionsMenu
  const openMoreOptionsMenu = event => {
    const position = event.currentTarget.getBoundingClientRect()
    setMoreClickPosition({ x: position.left, y: position.bottom })
  }
  const closeMoreOptionsMenu = () => {
    setMoreClickPosition(null)
  }
  const createCollectionWithSurroundings = () => {
    closeMoreOptionsMenu()
    chrome.runtime.sendMessage({ type: 'get current tab info' }, response => {
      if (response.pinned) {
        setToast("Can't group a pinned tab")
      } else if (response.groupId >= 0) {
        setToast('Current tab is already in a group')
      } else {
        dialogDispatch({ type: 'create collection with surroundings' })
      }
    })
  }
  const createCollectionWithGroup = () => {
    chrome.runtime.sendMessage({ type: 'get current tab info' }, response => {
      const { groupId } = response
      chrome.runtime.sendMessage({ type: 'create collection using a group', payload: { groupId } }, response => {
        setToast(response)
      })
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
  const replaceCurrentGroup = () => {
    chrome.runtime.sendMessage({ type: 'get current tab info' }, response => {
      const { groupId } = response
      if (typeof groupId === 'number' && groupId >= 0) {
        chrome.runtime.sendMessage({ type: 'replace current group', payload: { groupId, collection: collections[menuSelected.current] } })
        setRightClickPosition(null)
      } else {
        openTabsInAGroup()
      }
    })
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
    setRightClickPosition(null)
  }
  useEffect(() => {
    if (rightClickPosition === null) {
      menuSelected.current = undefined
    }
  }, [rightClickPosition])

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
              createCollection()
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
            onClose={closeMoreOptionsMenu}
          >
            <MenuItem className="list-text" onClick={createCollectionWithSurroundings}>
              <ListItemIcon className="list-icon-root">
                <TransformOutlinedIcon className="list-icon" />
              </ListItemIcon>
              Group surroundings into a collection
            </MenuItem>
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
                <Checkbox
                  color="primary"
                  checked={selected}
                  icon={<CheckBoxOutlineBlankIcon style={{ fontSize: 18 }} />}
                  checkedIcon={<CheckBoxIcon style={{ fontSize: 18 }} />}
                />
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
              ? window.innerWidth - rightClickPosition.x > (showOpenAllTabsMenuItem ? 245 : 105) // menu's width
                ? { top: rightClickPosition.y, left: rightClickPosition.x }
                : { top: rightClickPosition.y, left: rightClickPosition.x - (showOpenAllTabsMenuItem ? 245 : 105) }
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
          {showOpenInNewTabMenuItem && (
            <MenuItem className="list-text" onClick={replaceCurrentGroup}>
              <ListItemIcon className="list-icon-root">
                <SwapCallsIcon className="list-icon" />
              </ListItemIcon>
              Replace current group
            </MenuItem>
          )}
          {showOpenAllTabsMenuItem && <Divider />}
          <MenuItem className="list-text" onClick={deleteCollection}>
            <ListItemIcon className="list-icon-root">
              <DeleteOutlineOutlinedIcon className="list-icon" />
            </ListItemIcon>
            Delete
          </MenuItem>
        </Menu>
      </div>
      <Dialog classes={useDialogStyles()} open={!!dialogState} onClose={handleDialogClose}>
        <DialogTitle onClose={handleDialogClose}>Input Group Name</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            inputRef={dialogInputRef}
            value={dialogState?.groupName || ''}
            onChange={handleDialogInput}
            onFocus={() => {
              requestAnimationFrame(() => {
                dialogInputRef.current.select()
              })
            }}
          />
        </DialogContent>
        <DialogActions classes={useDialogActionsStyles()}>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleSubmit}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={displayToast}
        autoHideDuration={3000}
        classes={useToastStyles()}
        onClose={handleToastClose}
        anchorOrigin={{ horizontal: 'center', vertical: 'top' }}
      >
        <Alert classes={useAlertStyles()} severity="warning" variant="filled">
          {toast}
        </Alert>
      </Snackbar>
    </div>
  )
}

export default Home
