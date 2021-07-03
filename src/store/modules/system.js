import { getSetting } from '@/api/login'
import storage from '@/utils/storage'
const state = {
  info: storage.get('app_info')
}

const mutations = {
  SET_INFO: (state, data) => {
    state.info = data
    storage.set('app_info', data)
  }
}

const actions = {
  settingDetail({ commit }) {
    return new Promise((resolve, reject) => {
      getSetting().then(response => {
        const { data } = response
        commit('SET_INFO', data)
        resolve(data)
      }).catch(error => {
        reject(error)
      })
    })
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
