export const DB_STORE_NAME = 'Collections'
let db

export function connectDB(cb) {
  // In the following line, you should include the prefixes of implementations you want to test.
  if (!self.indexedDB) {
    self.indexedDB = self.mozIndexedDB || self.webkitIndexedDB || self.msIndexedDB
  }
  // DON'T use "var indexedDB = ..." if you're not in a function.
  // Moreover, you may need references to some window.IDB* objects:
  // window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction || { READ_WRITE: 'readwrite' } // This line should only be needed if it is needed to support the object's constants for older browsers
  // window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange
  // (Mozilla has never prefixed these objects, so we don't need window.mozIDB*)
  if (!self.indexedDB) {
    throw new Error("Your browser doesn't support a stable version of IndexedDB. Such and such feature will not be available.")
  }

  const openRequest = self.indexedDB.open('TabsCollectionIDB', 2)

  openRequest.onsuccess = function (event) {
    db = openRequest.result
    cb(db)
    console.log('Connected to DB.')
  }

  openRequest.onerror = function () {
    console.error(openRequest.errorCode)
  }

  openRequest.onupgradeneeded = function (event) {
    db = event.target.result
    db.createObjectStore(DB_STORE_NAME, { keyPath: 'id', autoIncrement: true })
    cb(db)
    console.log('Object store created.')
  }
}

export function getDB() {
  if (!db) {
    throw Error('DB not opened yet.')
  }
  return db
}
