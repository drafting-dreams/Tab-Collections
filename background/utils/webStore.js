export const localStorage = chrome.storage.local
const syncStorage = chrome.storage.sync

export function getLocalStorage(key) {
  return new Promise(resolve => {
    localStorage.get([key], re => {
      resolve(re[key])
    })
  })
}
export function setLocalStorage(key, value) {
  localStorage.set({ [key]: value })
}

export function getPinRegistry() {
  return getLocalStorage('pin_registry').then(pin_registry => pin_registry.split(',').map(id => Number(id)))
}
export function setPinRegistry(ids) {
  setLocalStorage('pin_registry', ids.join(','))
}

export function getSyncStorage(key) {
  console.log(syncStorage)
  return new Promise(resolve => {
    syncStorage.get([key], re => {
      console.log(re)
      resolve(re[key])
    })
  })
}

export function setSyncStorage(key, value) {
  syncStorage.set({ [key]: value })
}
