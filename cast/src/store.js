import level from 'level'

let db = null

export async function initStore(path, options) {
  if (path == null)
    throw new TypeError(`Parameter 'path' is 'null'.`)
  const defaultOptions = {
    keyEncoding  : 'utf8',
    valueEncoding: 'json',
  }
  db = level(path, Object.assign(defaultOptions, options))
  return db
}

export async function getStore(key, defaultValue) {
  if (db == null)
    throw new Error(`Store is not initiated. Call 'initStore' first.`)
  if (key == null)
    throw new TypeError(`Parameter 'key' is 'null'.`)
  try {
    return await db.get(`Store:${key}`)
  }
  catch (err) {
    if (err.name === 'NotFoundError')
      return defaultValue
    throw err
  }
}

export async function putStore(key, value) {
  if (db == null)
    throw new Error(`Store is not initiated. Call 'initStore' first.`)
  if (key == null)
    throw new TypeError(`Parameter 'key' is 'null'.`)
  if (value == null)
    throw new TypeError(`Parameter 'value' is 'null'.`)
  return await db.put(`Store:${key}`, value)
}