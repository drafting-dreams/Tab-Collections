import { DB_STORE_NAME } from './connect'
/**
 * @param {string} store_name
 * @param {string} mode either "readonly" or "readwrite"
 */
function getObjectStore(db, store_name, mode) {
  var tx = db.transaction(store_name, mode)
  return tx.objectStore(store_name)
}

export function add(db, entry) {
  const objStore = getObjectStore(db, DB_STORE_NAME, 'readwrite')
  return objStore.add(entry)
}

export function list(db) {
  const objStore = getObjectStore(db, DB_STORE_NAME)
  return objStore.getAll()
}
