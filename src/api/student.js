
               import request from '@/utils/request'

               // 查询Student列表
               export function listStudent(query) {
                   return request({
                       url: '/api/v1/student',
                       method: 'get',
                       params: query
                   })
               }
               
               // 查询Student详细
               export function getStudent (ID) {
                   return request({
                       url: '/api/v1/student/' + ID,
                       method: 'get'
                   })
               }
               
               
               // 新增Student
               export function addStudent(data) {
                   return request({
                       url: '/api/v1/student',
                       method: 'post',
                       data: data
                   })
               }
               
               // 修改Student
               export function updateStudent(data) {
                   return request({
                       url: '/api/v1/student/'+data.ID,
                       method: 'put',
                       data: data
                   })
               }
               
               // 删除Student
               export function delStudent(data) {
                   return request({
                       url: '/api/v1/student',
                       method: 'delete',
                       data: data
                   })
               }