import { DB_STORE_NAME } from './connect'
/**
 * @param {string} store_name
 * @param {string} mode either "readonly" or "readwrite"
 */
function getObjectStore(db, store_name, mode = 'readonly') {
  var tx = db.transaction(store_name, mode)
  return tx.objectStore(store_name)
}

export function add(db, entry) {
  return new Promise(resolve => {
    const objStore = getObjectStore(db, DB_STORE_NAME, 'readwrite')
    objStore.add(entry).onsuccess = event => {
      resolve(event.target.result)
    }
  })
}

export function list(db) {
  return new Promise(resolve => {
    const objStore = getObjectStore(db, DB_STORE_NAME)
    objStore.getAll().onsuccess = event => {
      resolve(event.target.result)
    }
  })
}

export function get(db, key) {
  return new Promise(resolve => {
    const objStore = getObjectStore(db, DB_STORE_NAME)
    objStore.get(Number(key)).onsuccess = event => {
      resolve(event.target.result)
    }
  })
}

export function put(db, entry) {
  return new Promise(resolve => {
    const objStore = getObjectStore(db, DB_STORE_NAME, 'readwrite')
    objStore.put(entry).onsuccess = event => {
      resolve(event.target.result)
    }
  })
}

export function remove(db, key) {
  return new Promise(resolve => {
    const objStore = getObjectStore(db, DB_STORE_NAME, 'readwrite')
    objStore.delete(key).onsuccess = event => {
      resolve(event.target.result)
    }
  })
}
