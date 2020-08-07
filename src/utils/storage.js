const storage = {
  set(key, value) {
    if (typeof value === 'object') {
      value = JSON.stringify(value)
    }
    localStorage.setItem(key, value)
  },
  get(key) {
    let value = localStorage.getItem(key)
    if (value && value.indexOf('{') !== -1) {
      value = JSON.parse(value)
    }
    return value
  },
  remove(key) {
    localStorage.removeItem(key)
  },
  clear() {
    localStorage.clear()
  }
}

export default storage
