import request from '@/utils/request'

export function GetCalendarList(query) {
  return request({
    url: '/api/v1/calendar',
    method: 'get',
    params: query
  })
}
export function CreateCalendar(value) {
  return request({
    url: '/api/v1/calendar',
    method: 'post',
    data: value
  })
}
export function UpdateCalendar(id, value) {
  return request({
    url: '/api/v1/calendar/' + id,
    method: 'put',
    data: value
  })
}
export function DeleteCalendar(id) {
  return request({
    url: '/api/v1/calendar/' + id,
    method: 'delete'
  })
}
