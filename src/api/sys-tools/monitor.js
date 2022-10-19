import request from '../../utils/request'

const url = '/api/v1/server-monitor';

export function getServerMonitor() {
  return request({
    url,
    method: 'GET',
  })
}