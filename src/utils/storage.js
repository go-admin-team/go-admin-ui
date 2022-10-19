// LocalStorage

/**
 * 存储LocalStorage
 * @param {string, Object} name 
 * @param {*} value 
 */
export const setLocalStorage = (name, value) => {
  if (!name) throw new Error('name must be specified');
  if (typeof value !== 'string') {
    value = JSON.stringify(value);
  }
  window.localStorage.setItem(name, value);
}

/**
 * 获取LocalStorage
 * @param {string, Object} name 
 * @returns 
 */
export const getLocalStorage = (name) => {
  if(!name) throw new Error('name must be specified');
  const value = window.localStorage.getItem(name);
  return JSON.parse(value);
}

/**
 * 移除指定name
 * @param {*} name 
 */
export const removeLocalStorage = (name) => {
  if (!name) throw new Error('name must be specified');
  window.localStorage.removeItem(name);
}

/**
 * 清空所有LocalStorage
 */
export const clearLocalStorage = () => {
  window.localStorage.clear();
}