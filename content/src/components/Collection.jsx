import React, { useEffect, useState, useContext, useRef } from 'react'
import { unpin } from '../scripts'
import { RouteContext } from './Router.jsx'
import {
  Paper,
  Menu,
  MenuItem,
  ListItemIcon,
  InputBase,
  Link,
  Divider,
  Tooltip,
  Checkbox,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@material-ui/core'
import {
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
  CheckBox as CheckBoxIcon,
  CloseOutlined as CloseSharpIcon,
  AddSharp as AddSharpIcon,
  ArrowBackIosOutlined as ArrowBackIosOutlinedIcon,
  InsertDriveFileOutlined as InsertDriveFileOutlinedIcon,
  DeleteOutlineOutlined as DeleteOutlineOutlinedIcon,
  AddCircleOutlineOutlined as AddCircleOutlineOutlinedIcon,
  AddBoxOutlined as AddBoxOutlinedIcon,
  FormatIndentIncreaseOutlined as FormatIndentIncreaseOutlinedIcon,
  FormatIndentDecreaseOutlined as FormatIndentDecreaseOutlinedIcon,
  PostAddOutlined as PostAddOutlinedIcon,
  OpenInBrowserOutlined as OpenInBrowserOutlinedIcon,
  MoreHorizOutlined as MoreHorizOutlinedIcon,
  LibraryAddOutlined as LibraryAddOutlinedIcon,
  LinkOutlined as LinkOutlinedIcon,
  FolderOpenOutlined as FolderOpenOutlinedIcon,
  SwapCalls as SwapCallsIcon,
} from '@material-ui/icons'

import AppContext from '../context'

import { ENABLE_GROUP_TAB_FEATURE } from '../utils/featureToggles'

import { copy, mapTabToCollection } from '../utils'

import { dialogStyles, dialogActionsStyles } from '../styles/madeStyles'

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

  const { setToast } = useContext(AppContext)

  const updateCollection = payload => {
    if (!pending.current) chrome.runtime.sendMessage({ type: 'update collection', payload })
  }
  const handleChange = event => {
    setTitle(event.target.value)
  }
  const handleTitleSave = () => {
    if (title.trim() === '') {
      setTitle(catchedTitle)
      return
    }
    updateCollection({ title, list, id: Number(id) })
  }

  const addCurrentPage = () => {
    chrome.runtime.sendMessage({ type: 'get current tab info' }, response => {
      setList([...list, { url: window.location.href, host: window.location.host, title: document.title, favicon: response.favIconUrl }])
    })
  }
  useEffect(() => {
    if (prevList.current !== null && list.length !== prevList.current.length) {
      let toastMessage = ''
      const chromeFilteredOutList = list.filter(tab => {
        return !tab.url.startsWith('chrome://')
      })
      if (chromeFilteredOutList.length !== list.length) {
        toastMessage = "Internal chrome tabs can't be added"
      }

      const urlSet = new Set()
      const deDuplicatedList = chromeFilteredOutList.filter(tab => {
        if (urlSet.has(tab.url)) {
          return false
        }
        urlSet.add(tab.url)
        return true
      })
      if (deDuplicatedList.length !== chromeFilteredOutList.length) {
        toastMessage = "Tabs with duplicated urls won't be added to the collection"
      }

      if (toastMessage) {
        setToast(toastMessage)
        setList(deDuplicatedList)
      } else {
        updateCollection({ title, list, id: Number(id) })
      }
    }
  }, [list])
  useEffect(() => {
    prevList.current = list
  })

  const handleRightClick = (index, event) => {
    event.preventDefault()
    // block this function if there are selected items
    if (selectedList.length) {
      return
    }
    menuSelected.current = index
    setRightClickPosition({ x: event.clientX, y: event.clientY })
  }
  const handleMenuClose = () => {
    menuSelected.current = undefined
    setRightClickPosition(null)
  }

  const deleteType = useRef('one') // 'one', 'selected', 'all'
  const [displayDeleteDialog, setDisplayDeleteDialog] = useState(false)
  const handleDeleteDialogClose = () => {
    setDisplayDeleteDialog(false)
  }
  const openDeleteOne = () => {
    deleteType.current = 'one'
    setDisplayDeleteDialog(true)
    setRightClickPosition(null)
  }
  const openDeleteSelected = () => {
    deleteType.current = 'selected'
    setDisplayDeleteDialog(true)
  }
  const openDeleteAll = () => {
    deleteType.current = 'all'
    setDisplayDeleteDialog(true)
    setMoreClickPosition(null)
  }
  const deleteOne = () => {
    const deletedList = [...list]
    deletedList.splice(menuSelected.current, 1)
    setList(deletedList)
    handleDeleteDialogClose()
  }
  const deleteAll = () => {
    setList([])
    handleDeleteDialogClose()
  }
  const deleteSelected = () => {
    const temp = [...list]
    selectedList.forEach(i => {
      temp[i] = undefined
    })
    setList(temp.filter(item => item !== undefined))
    setSelectedList([])
    handleDeleteDialogClose()
  }
  const confirmDelete = () => {
    switch (deleteType.current) {
      case 'one':
        deleteOne()
        break
      case 'selected':
        deleteSelected()
        break
      case 'all':
        deleteAll()
    }
  }

  const openOneInCurrentTab = () => {
    window.location.href = list[menuSelected.current].url
    setRightClickPosition(null)
  }
  const openTabsInAGroup = () => {
    chrome.runtime.sendMessage({ type: 'open tabs in a group', payload: { title, list } })
    setMoreClickPosition(null)
  }
  const replaceCurrentGroup = () => {
    chrome.runtime.sendMessage({ type: 'get current tab info' }, response => {
      const { groupId } = response
      if (typeof groupId === 'number' && groupId >= 0) {
        chrome.runtime.sendMessage({ type: 'replace current group', payload: { groupId, collection: { title, list } } })
        setMoreClickPosition(null)
      } else {
        openTabsInAGroup()
      }
    })
  }
  const openAllInNewTab = () => {
    list.forEach(item => {
      window.open(item.url)
    })
    setMoreClickPosition(null)
  }
  const openSelectedInNewTab = () => {
    selectedList.forEach(i => {
      window.open(list[i].url)
    })
    setSelectedList([])
  }
  const openSelectedInAGroup = () => {
    chrome.runtime.sendMessage({ type: 'open tabs in a group', payload: { title, list: selectedList.map(idx => list[idx]) } })
    setSelectedList([])
  }

  const openMoreOptionsMenu = event => {
    const position = event.currentTarget.getBoundingClientRect()
    setMoreClickPosition({ x: position.left, y: position.bottom })
  }
  const addAllTabs = unpinned => () => {
    chrome.runtime.sendMessage({ type: 'get tabs info', payload: { unpinned } }, function (response) {
      setList([...list, ...response.map(mapTabToCollection)])
      setMoreClickPosition(null)
    })
  }
  const addStandaloneTabs = () => {
    chrome.runtime.sendMessage({ type: 'get tabs info', payload: { unpinned: true } }, response => {
      setList([...list, ...response.filter(tab => tab.groupId < 0).map(mapTabToCollection)])
      setMoreClickPosition(null)
    })
  }
  const addWithDirection = right => {
    chrome.runtime.sendMessage({ type: 'get tabs info', payload: { unpinned: true } }, response => {
      chrome.runtime.sendMessage({ type: 'get current tab info' }, currentTab => {
        const tabsOnTheDirection = []
        let currentTabIndex
        for (let i = right ? 0 : response.length - 1; i >= 0 && i < response.length; i += right ? 1 : -1) {
          if (response[i].id === currentTab.id) {
            currentTabIndex = i
            if (currentTab.groupId < 0) tabsOnTheDirection.push(response[i])
            continue
          } else if (currentTabIndex === undefined || (currentTab.groupId > -1 && response[i].groupId === currentTab.groupId)) {
            continue
          }

          if (response[i].groupId > -1) {
            break
          }
          tabsOnTheDirection.push(response[i])
        }
        if (!right) {
          tabsOnTheDirection.reverse()
        }
        setList([...list, ...tabsOnTheDirection.map(mapTabToCollection)])
        setMoreClickPosition(null)
      })
    })
  }
  const addTabsInTheSameGroup = () => {
    chrome.runtime.sendMessage({ type: 'get current tab info' }, currentTab => {
      if (currentTab.groupId < 0) {
        setList([...list, mapTabToCollection(currentTab)])
      } else {
        chrome.runtime.sendMessage({ type: 'get tabs info' }, response => {
          setList([...list, ...response.filter(tab => tab.groupId === currentTab.groupId).map(mapTabToCollection)])
        })
      }
      setMoreClickPosition(null)
    })
  }

  const checkOn = idx => {
    const filtered = selectedList.filter(i => i !== idx)
    if (filtered.length === selectedList.length) {
      filtered.push(idx)
    }
    setSelectedList(filtered)
  }

  const copyUrl = () => {
    try {
      setRightClickPosition(null)
      copy(list[menuSelected.current].url)
      setToast('Successfully copied to clipboard', 'success')
    } catch (err) {
      setToast("Couldn't copy to clipboard")
    }
  }

  const showGroupTabFeatures = ENABLE_GROUP_TAB_FEATURE && !!list?.length

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
        <Tooltip title="More options" classes={{ popper: 'tab-collection-max-z-index' }} enterDelay={400} onClick={openMoreOptionsMenu}>
          {/* <OpenInBrowserOutlinedIcon className="icon icon-open-all" onClick={openAllInNewTab} /> */}
          <MoreHorizOutlinedIcon className="icon icon-more" />
        </Tooltip>
        <Menu
          container={document.querySelector('.tab-collections-react-root')}
          autoFocus={false}
          anchorReference="anchorPosition"
          anchorPosition={
            moreClickPosition ? { left: moreClickPosition.x - (showGroupTabFeatures ? 240 : 190), top: moreClickPosition.y } : undefined
          }
          keepMounted
          open={moreClickPosition !== null}
          onClose={() => {
            setMoreClickPosition(null)
          }}
        >
          <MenuItem className="list-text" onClick={addStandaloneTabs}>
            <ListItemIcon className="list-icon-root">
              <AddCircleOutlineOutlinedIcon className="list-icon" />
            </ListItemIcon>
            Add all standalone tabs
          </MenuItem>
          <MenuItem
            className="list-text"
            onClick={() => {
              addWithDirection(true)
            }}
          >
            <ListItemIcon className="list-icon-root">
              <FormatIndentIncreaseOutlinedIcon className="list-icon" />
            </ListItemIcon>
            Add standalones on the right
          </MenuItem>
          <MenuItem
            className="list-text"
            onClick={() => {
              addWithDirection()
            }}
          >
            <ListItemIcon className="list-icon-root">
              <FormatIndentDecreaseOutlinedIcon className="list-icon" />
            </ListItemIcon>
            Add standalones on the left
          </MenuItem>
          <MenuItem className="list-text" onClick={addTabsInTheSameGroup}>
            <ListItemIcon className="list-icon-root">
              <PostAddOutlinedIcon className="list-icon" />
            </ListItemIcon>
            Add tabs in the same group
          </MenuItem>
          <MenuItem className="list-text" onClick={addAllTabs(true)}>
            <ListItemIcon className="list-icon-root">
              <LibraryAddOutlinedIcon className="list-icon" />
            </ListItemIcon>
            Add all unpinned tabs
          </MenuItem>
          <MenuItem className="list-text" onClick={addAllTabs()}>
            <ListItemIcon className="list-icon-root">
              <AddBoxOutlinedIcon className="list-icon" />
            </ListItemIcon>
            Add all tabs
          </MenuItem>
          <Divider />
          {showGroupTabFeatures && (
            <MenuItem className="list-text" onClick={openTabsInAGroup}>
              <ListItemIcon className="list-icon-root">
                <FolderOpenOutlinedIcon className="list-icon" />
              </ListItemIcon>
              Open all tabs in a new group
            </MenuItem>
          )}
          {showGroupTabFeatures && (
            <MenuItem className="list-text" onClick={replaceCurrentGroup}>
              <ListItemIcon className="list-icon-root">
                <SwapCallsIcon className="list-icon" />
              </ListItemIcon>
              Replace current group
            </MenuItem>
          )}
          <MenuItem className="list-text" onClick={openAllInNewTab}>
            <ListItemIcon className="list-icon-root">
              <OpenInBrowserOutlinedIcon className="list-icon" />
            </ListItemIcon>
            Open all tabs
          </MenuItem>
          <Divider />
          <MenuItem className="list-text" onClick={openDeleteAll}>
            <ListItemIcon className="list-icon-root">
              <DeleteOutlineOutlinedIcon className="list-icon" />
            </ListItemIcon>
            Delete all tabs
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
          <Tooltip title="Open selected in a new group" classes={{ popper: 'tab-collection-max-z-index' }} enterDelay={400}>
            <FolderOpenOutlinedIcon className="tip-icon" onClick={openSelectedInAGroup} />
          </Tooltip>
          <Tooltip title="Open selected" classes={{ popper: 'tab-collection-max-z-index' }} enterDelay={400}>
            <OpenInBrowserOutlinedIcon className="tip-icon" onClick={openSelectedInNewTab} />
          </Tooltip>
          <Tooltip title="Delete selected" classes={{ popper: 'tab-collection-max-z-index' }} enterDelay={400}>
            <DeleteOutlineOutlinedIcon className="tip-icon" onClick={openDeleteSelected} />
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
                    window.open(item.url)
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
              ? window.innerWidth - rightClickPosition.x > 185 // 185 is the menu's width
                ? { top: rightClickPosition.y, left: rightClickPosition.x }
                : { top: rightClickPosition.y, left: rightClickPosition.x - 185 }
              : undefined
          }
        >
          <MenuItem className="list-text" onClick={copyUrl}>
            <ListItemIcon className="list-icon-root">
              <LinkOutlinedIcon className="list-icon" />
            </ListItemIcon>
            Copy URL
          </MenuItem>
          <MenuItem className="list-text" onClick={openDeleteOne}>
            <ListItemIcon className="list-icon-root">
              <DeleteOutlineOutlinedIcon className="list-icon" />
            </ListItemIcon>
            Delete
          </MenuItem>
          <Divider />
          <MenuItem className="list-text" onClick={openOneInCurrentTab}>
            <ListItemIcon className="list-icon-root">
              <InsertDriveFileOutlinedIcon className="list-icon" />
            </ListItemIcon>
            Open in current tab
          </MenuItem>
        </Menu>
      </div>
      <Dialog classes={dialogStyles} open={displayDeleteDialog} onClose={handleDeleteDialogClose}>
        <DialogTitle onClose={handleDeleteDialogClose}>Delete Tab</DialogTitle>
        <DialogContent>{`Are you sure you want to delete the selected tab(s)?`}</DialogContent>
        <DialogActions classes={dialogActionsStyles}>
          <Button onClick={handleDeleteDialogClose}>Cancel</Button>
          <Button onClick={confirmDelete} className="alert-color">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

export default Collection
