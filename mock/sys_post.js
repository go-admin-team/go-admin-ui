import Mock from 'mockjs'

const mock = {
  'list|10': [
    {
      'roleId|+1': 1,
      'roleName|1': [
        '系统管理员',
        '福州系统运维',
        '产品管理',
        '前端开发',
        '后端开发'
      ],
      'roleKey': 'admin',
      'roleSort|+1': 0,
      'status|0-1': 0,
      'createAt': `${Mock.Random.date()} ${Mock.Random.time()}`
    }
  ],
}

const login = {
  url: '/api/admin/post',
  method: 'get',
  timeout: 500,
  statusCode: 200,
  response: {
    code: 200,
    message: '登陆成功',
    data: Mock.toJSONSchema(mock).template
  }
}

export default [
  login,
]