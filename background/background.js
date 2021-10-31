import { getDB } from './db/connect'
import * as query from './db/transactions'

import { initOnInstalled, reloadExtensionContent, registerTabUpdateEvent } from './utils'
import { getLocalStorage, setLocalStorage, getPinRegistry, setPinRegistry } from './utils/webStore'

initOnInstalled()
registerTabUpdateEvent()

chrome.action.onClicked.addListener(function (tab) {
  chrome.tabs.sendMessage(tab.id, {
    type: 'clickIcon',
  })
})

async function handleMessage(request, sender) {
  const TITLE_PLACEHOLDER = 'New Collections'
  let response
  const db = await getDB()

  const mapTabToCollection = tab => ({ url: tab.url, title: tab.title, favicon: tab.favIconUrl, host: tab.url.split('/')[2] })

  switch (request.type) {
    case 'ask if pinned': {
      response = { pinned: await getLocalStorage('pinned') }
      break
    }
    case 'pin': {
      setLocalStorage('pinned', true)
      const pin_registry = await getPinRegistry()
      if (sender.tab && !pin_registry.includes(sender.tab.id)) {
        pin_registry.push(sender.tab.id)
        setPinRegistry(pin_registry)
        chrome.tabs.sendMessage(sender.tab.id, {
          type: 'reload',
        })
      }
      break
    }
    // To remove the UI on the pinned tabs
    case 'unpin': {
      setLocalStorage('pinned', false)
      const pin_registry = await getPinRegistry()
      const remainTabs = pin_registry.filter(id => id !== sender.tab.id)
      remainTabs.forEach(id => {
        chrome.tabs.sendMessage(id, {
          type: 'unpin',
        })
      })
      setPinRegistry([])
      break
    }
    case 'inform route change': {
      const location = request.payload.route
      setLocalStorage('location', location)
      const pin_registry = await getPinRegistry()
      const remainTabs = pin_registry.filter(id => id !== sender.tab.id)
      remainTabs.forEach(id => {
        chrome.tabs.sendMessage(id, {
          type: 'route change',
          payload: {
            route: location,
          },
        })
      })

      break
    }
    case 'get current tab info': {
      response = sender.tab
      break
    }
    case 'get tabs info': {
      const options = { currentWindow: true }
      if (request.payload.unpinned) {
        options.pinned = false
      }
      response = await chrome.tabs.query(options)

      break
    }
    case 'add collection': {
      response = await query.add(db, request.payload)
      reloadExtensionContent({ selfId: sender.tab.id })
      break
    }
    case 'get collection': {
      response = query.get(db, request.payload.key)
      break
    }
    case 'get all': {
      response = (await query.list(db)).reverse()
      break
    }
    case 'update collection': {
      response = await query.put(db, request.payload)
      reloadExtensionContent({ selfId: sender.tab.id })
      break
    }
    case 'delete collection': {
      request.payload.keys.forEach(key => {
        query.remove(db, key)
        reloadExtensionContent({ selfId: sender.tab.id })
      })
      break
    }

    case 'create collection with surroundings': {
      if (sender.tab.pinned) {
        response = "Can't group a pinned tab"
      } else if (sender.tab.groupId >= 0) {
        response = 'Current tab is already in a group'
      } else {
        const allTabs = await chrome.tabs.query({ currentWindow: true })
        const senderTabIndex = allTabs.findIndex(tab => tab.id === sender.tab.id)

        let i, j
        i = j = senderTabIndex
        while (i >= 0 && !allTabs[i].pinned && allTabs[i].groupId < 0) {
          i--
        }
        while (j < allTabs.length && !allTabs[j].pinned && allTabs[j].groupId < 0) {
          j++
        }
        const toBeGrouped = allTabs.slice(i + 1, j)
        const title = request.payload.groupName || TITLE_PLACEHOLDER
        chrome.tabs.group({ tabIds: toBeGrouped.map(tab => tab.id) }).then(groupId => {
          chrome.tabGroups.update(groupId, { title })
        })
        await query.add(db, {
          title,
          list: toBeGrouped.map(mapTabToCollection),
        })
        reloadExtensionContent({ excludeSelf: false })
      }
      break
    }
    case 'create collection using a group': {
      const {
        payload: { groupId },
      } = request
      if (typeof groupId === 'number' && groupId >= 0) {
        const groupInfoPromise = chrome.tabGroups.get(groupId)
        const tabsInfoPromise = chrome.tabs.query({ currentWindow: true })
        Promise.all([groupInfoPromise, tabsInfoPromise]).then(([groupInfo, tabsInfo]) => {
          query
            .add(db, {
              title: groupInfo.title.trim() ? groupInfo.title : TITLE_PLACEHOLDER,
              list: tabsInfo.filter(tab => tab.groupId === groupId).map(mapTabToCollection),
            })
            .then(() => {
              reloadExtensionContent({ excludeSelf: false })
            })
        })
      } else {
        const tab = sender.tab
        query.add(db, { title: TITLE_PLACEHOLDER, list: [mapTabToCollection(tab)] }).then(() => {
          reloadExtensionContent({ excludeSelf: false })
        })
      }
      break
    }
    case 'open tabs in a group': {
      const collection = request.payload
      const openTabPromises = collection.list.map(({ url }) => chrome.tabs.create({ url }))
      Promise.all(openTabPromises).then(tabs => {
        chrome.tabs
          .group({
            tabIds: tabs.map(tab => tab.id),
          })
          .then(groupId => {
            chrome.tabGroups.update(groupId, { title: collection.title })
          })
      })
      break
    }
    case 'replace current group': {
      const {
        payload: { groupId, collection },
      } = request
      if (typeof groupId === 'number' && groupId >= 0) {
        const groupInfoPromise = chrome.tabGroups.get(groupId)
        const tabsInfoPromise = chrome.tabs.query({ currentWindow: true })
        const openTabPromises = Promise.all(collection.list.map(({ url }) => chrome.tabs.create({ url })))
        Promise.all([groupInfoPromise, tabsInfoPromise, openTabPromises]).then(([groupInfo, tabsInfo, openedTabs]) => {
          chrome.tabs.group({ groupId, tabIds: openedTabs.map(tab => tab.id) }).then(() => {
            chrome.tabGroups.update(groupId, { title: collection.title })
            chrome.tabs.remove(tabsInfo.filter(({ groupId: gId }) => gId === groupId).map(tab => tab.id))
          })
        })
      }
    }
  }

  return response
}
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  handleMessage(request, sender).then(res => {
    sendResponse(res)
  })

  // return true indicates that this event listener will response asynchronously
  return true
})
