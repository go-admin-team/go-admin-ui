// LocalStorage

export const storage = {
  getKeys() {
    const keys = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      keys.push(window.localStorage.key(i));
    }

    return keys;
  },
  setItem(key, val) {
    if (typeof key !== 'string') {
      key = key.toString();
    }

    if (key === undefined || key.trim().length === 0) throw new Error('key 参数不能为空或者undefined');

    window.localStorage.setItem(key, JSON.stringify(val));
  },
  getItem(key) {
    const val = window.localStorage.getItem(key);
    return JSON.parse(val);
  },
  clearAllKeys() {
    window.localStorage.clear();
  },
  removeItem(key) {
    window.localStorage.removeItem(key);
  }
}