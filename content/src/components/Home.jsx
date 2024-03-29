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
} from '@material-ui/core'
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
  BackupOutlined as BackupOutlinedIcon,
  CloudDownloadOutlined as CloudDownloadOutlinedIcon,
  ArchiveOutlined as ArchiveOutlinedIcon,
} from '@material-ui/icons'

import AppContext from '../context'

import { ENABLE_GROUP_TAB_FEATURE, ENABLE_ARCHIVE } from '../utils/featureToggles'

import { dialogStyles, dialogActionsStyles } from '../styles/madeStyles'

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
  const { setToast } = useContext(AppContext)

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
      chrome.runtime.sendMessage({ type: dialogState.type, payload: dialogState }, response => {
        if (response) {
          setToast(response)
        }
      })
    }
    dialogDispatch({ type: 'close' })
  }

  // Deletion Confirm Dialog
  const isBatchDelete = useRef(false)
  const [displayDeleteDialog, setDisplayDeleteDialog] = useState(false)
  const handleDeleteDialogClose = () => {
    setDisplayDeleteDialog(false)
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
  const handleClickDeleteItem = () => {
    isBatchDelete.current = false
    setDisplayDeleteDialog(true)
    setRightClickPosition(null)
  }
  const deleteCollection = () => {
    chrome.runtime.sendMessage({ type: 'delete collection', payload: { keys: [collections[menuSelected.current].id] } })
    const temp = [...collections]
    temp.splice(menuSelected.current, 1)
    setCollections(temp)
    handleDeleteDialogClose()
  }
  const handleClickBatchDeleteIcon = () => {
    isBatchDelete.current = true
    setDisplayDeleteDialog(true)
  }
  const deleteSelected = () => {
    chrome.runtime.sendMessage({ type: 'delete collection', payload: { keys: selectedList.map(idx => collections[idx].id) } })
    const temp = [...collections]
    selectedList.forEach(i => {
      temp[i] = undefined
    })
    setCollections(temp.filter(c => c !== undefined))
    setSelectedList([])
    handleDeleteDialogClose()
  }
  const handleMenuClose = () => {
    setRightClickPosition(null)
  }

  const checkOn = idx => {
    const filtered = selectedList.filter(i => i !== idx)
    if (filtered.length === selectedList.length) {
      filtered.push(idx)
    }
    setSelectedList(filtered)
  }

  const backup = () => {
    setMoreClickPosition(null)
    chrome.runtime.sendMessage({ type: 'get token' }, token => {
      if (!token) {
        setToast('Authenticate failed')
        return
      }
      chrome.runtime.sendMessage({ type: 'get all' }, response => {
        const createBackupFile = () => {
          response.forEach(collection => {
            delete collection.id
          })
          const metadata = new Blob([JSON.stringify({ name: 'TabCollections.backup' })], { type: 'application/json' })
          const file = new Blob([JSON.stringify(response)], { type: 'application/json' })
          const form = new FormData()
          form.append('metadata', metadata)
          form.append('myfile', file)
          const xhr = new XMLHttpRequest()
          xhr.open('POST', 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart')
          xhr.setRequestHeader('Authorization', 'Bearer ' + token)
          xhr.responseType = 'json'
          xhr.onload = () => {
            if (xhr.response.id) {
              chrome.runtime.sendMessage({ type: 'set sync', payload: { key: 'backup_file_id', value: xhr.response.id } })
              setToast("Succeessfully backed up in 'TabCollections.backup'", 'success')
            } else {
              setToast(xhr.response === 'string' ? xhr.response : "Couldn't create backup file", 'error')
            }
          }
          xhr.onerror = () => {
            setToast('Network error', 'error')
          }
          xhr.send(form)
        }
        chrome.runtime.sendMessage({ type: 'get sync', payload: 'backup_file_id' }, backupFileId => {
          if (backupFileId) {
            const deleteFile = new XMLHttpRequest()
            deleteFile.open('DELETE', `https://www.googleapis.com/drive/v3/files/${backupFileId}`)
            deleteFile.onerror = () => {
              setToast('Network error', 'error')
            }
            deleteFile.onload = () => {
              createBackupFile()
            }
            deleteFile.setRequestHeader('Authorization', 'Bearer ' + token)
            deleteFile.send()
          } else {
            createBackupFile()
          }
        })
      })
    })
  }
  const restore = () => {
    setMoreClickPosition(null)
    chrome.runtime.sendMessage({ type: 'get token' }, token => {
      if (!token) {
        setToast('Authenticate failed')
        return
      }
      chrome.runtime.sendMessage({ type: 'get sync', payload: 'backup_file_id' }, backupFileId => {
        if (backupFileId) {
          const readFile = new XMLHttpRequest()
          readFile.open('GET', `https://www.googleapis.com/drive/v3/files/${backupFileId}?alt=media`)
          readFile.setRequestHeader('Authorization', 'Bearer ' + token)
          readFile.onload = async () => {
            let collections
            try {
              collections = JSON.parse(readFile.response)
              if (!Array.isArray(collections)) {
                throw Error()
              }
              chrome.runtime.sendMessage({ type: 'add collections', payload: collections }, () => {
                setToast('Successfully imported', 'success')
              })
            } catch {
              setToast('Backup file damaged', 'error')
            }
          }
          readFile.onerror = () => {
            setToast('Network error', 'error')
          }
          readFile.send()
        } else {
          setToast('No backup file found')
        }
      })
    })
  }
  const archive = (batch = false) => {
    let archivingList
    if (batch) {
      archivingList = selectedList.map(idx => collections[idx])
    } else {
      archivingList = [collections[menuSelected.current]]
    }
    const folderMimeType = 'application/vnd.google-apps.folder'
    const folderName = 'TabCollections-Archives'
    setRightClickPosition(null)
    setSelectedList([])
    chrome.runtime.sendMessage({ type: 'get token' }, token => {
      if (!token) {
        setToast('Authenticate failed')
        return
      }
      chrome.runtime.sendMessage({ type: 'get sync', payload: 'archive_folder_id' }, folderId => {
        const createArchiveFile = folder => {
          Promise.all(
            archivingList.map(
              collection =>
                new Promise((resolve, reject) => {
                  const form = new FormData()
                  const metadata = new Blob([JSON.stringify({ name: collection.title, parents: [folder] })], { type: 'application/json' })
                  const file = new Blob(
                    [collection.list.reduce((prev, cur, index) => `${prev}${index + 1}. ${cur.title}\r\n    ${cur.url}\r\n`, '')],
                    {
                      type: 'text/plain',
                    }
                  )
                  form.append('metadat', metadata)
                  form.append('myfile', file)
                  const xhr = new XMLHttpRequest()
                  xhr.open('POST', 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart')
                  xhr.setRequestHeader('Authorization', 'Bearer ' + token)
                  xhr.onload = () => {
                    try {
                      if (JSON.parse(xhr.response).id) {
                        resolve()
                      } else {
                        reject()
                      }
                    } catch {
                      reject()
                    }
                  }
                  xhr.onerror = () => {
                    reject()
                  }
                  xhr.send(form)
                })
            )
          )
            .then(() => {
              setToast("Successfully archived in folder 'TabCollections-Archives'", 'success')
            })
            .catch(() => {
              setToast('Failed to archive')
            })
        }
        if (folderId) {
          createArchiveFile(folderId)
        } else {
          const createFolder = new XMLHttpRequest()
          createFolder.open('POST', 'https://www.googleapis.com/drive/v3/files')
          createFolder.setRequestHeader('Content-Type', 'application/json')
          createFolder.setRequestHeader('Authorization', 'Bearer ' + token)
          createFolder.onload = () => {
            try {
              folderId = JSON.parse(createFolder.response).id
              chrome.runtime.sendMessage({ type: 'set sync', payload: { key: 'archive_folder_id', value: folderId } })
              createArchiveFile(folderId)
            } catch {
              setToast('Invalid Response')
            }
          }
          createFolder.onerror = () => {
            setToast('Network error', 'error')
          }
          createFolder.send(JSON.stringify({ name: folderName, mimeType: folderMimeType }))
        }
      })
    })
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
        {(ENABLE_GROUP_TAB_FEATURE || ENABLE_ARCHIVE) && (
          <Menu
            container={document.querySelector('.tab-collections-react-root')}
            autoFocus={false}
            anchorReference="anchorPosition"
            anchorPosition={moreClickPosition ? { left: moreClickPosition.x - 300, top: moreClickPosition.y } : undefined}
            keepMounted
            open={moreClickPosition !== null}
            onClose={closeMoreOptionsMenu}
          >
            {ENABLE_GROUP_TAB_FEATURE && (
              <MenuItem className="list-text" onClick={createCollectionWithSurroundings}>
                <ListItemIcon className="list-icon-root">
                  <TransformOutlinedIcon className="list-icon" />
                </ListItemIcon>
                Group surroundings into a collection
              </MenuItem>
            )}
            {ENABLE_GROUP_TAB_FEATURE && (
              <MenuItem className="list-text" onClick={createCollectionWithGroup}>
                <ListItemIcon className="list-icon-root">
                  <PostAddOutlinedIcon className="list-icon" />
                </ListItemIcon>
                Create collection with current tab group
              </MenuItem>
            )}
            {ENABLE_ARCHIVE && ENABLE_GROUP_TAB_FEATURE && <Divider />}
            {ENABLE_ARCHIVE && (
              <MenuItem className="list-text" onClick={backup}>
                <ListItemIcon className="list-icon-root">
                  <BackupOutlinedIcon className="list-icon" />
                </ListItemIcon>
                Backup
              </MenuItem>
            )}
            {ENABLE_ARCHIVE && (
              <MenuItem className="list-text" onClick={restore}>
                <ListItemIcon className="list-icon-root">
                  <CloudDownloadOutlinedIcon className="list-icon" />
                </ListItemIcon>
                Import from backup
              </MenuItem>
            )}
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
          <Tooltip title="Archive selected" classes={{ popper: 'tab-collection-max-z-index' }} enterDelay={400}>
            <ArchiveOutlinedIcon
              className="tip-icon"
              onClick={() => {
                archive(true)
              }}
            />
          </Tooltip>
          <Tooltip title="Delete selected" classes={{ popper: 'tab-collection-max-z-index' }} enterDelay={400}>
            <DeleteOutlineOutlinedIcon className="tip-icon" onClick={handleClickBatchDeleteIcon} />
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
          {ENABLE_ARCHIVE && (
            <MenuItem
              className="list-text"
              onClick={() => {
                archive()
              }}
            >
              <ListItemIcon className="list-icon-root">
                <ArchiveOutlinedIcon className="list-icon" />
              </ListItemIcon>
              Archive
            </MenuItem>
          )}
          {ENABLE_ARCHIVE && <Divider />}
          <MenuItem className="list-text" onClick={handleClickDeleteItem}>
            <ListItemIcon className="list-icon-root">
              <DeleteOutlineOutlinedIcon className="list-icon" />
            </ListItemIcon>
            Delete
          </MenuItem>
        </Menu>
      </div>
      <Dialog classes={dialogStyles} open={!!dialogState} onClose={handleDialogClose}>
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
            onKeyUp={event => {
              if (event.key === 'Enter') {
                handleSubmit()
              }
            }}
            style={{ width: '400px' }}
          />
        </DialogContent>
        <DialogActions classes={dialogActionsStyles}>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleSubmit}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog classes={dialogStyles} open={displayDeleteDialog} onClose={handleDeleteDialogClose}>
        <DialogTitle onClose={handleDeleteDialogClose}>Delete Collection</DialogTitle>
        <DialogContent>{`Are you sure you want to delete the selected collection(s)?`}</DialogContent>
        <DialogActions classes={dialogActionsStyles}>
          <Button onClick={handleDeleteDialogClose}>Cancel</Button>
          <Button onClick={isBatchDelete.current ? deleteSelected : deleteCollection} className="alert-color">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

export default Home
