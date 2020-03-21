# go-admin-ui


![build](https://github.com/wenjianzhang/go-admin-ui/workflows/build/badge.svg?branch=master) ![MIT](https://img.shields.io/github/license/mashape/apistatus.svg)

## 简介

[goadmin-ui](https://github.com/wenjianzhang/go-admin-ui) 是一个后台基础模块的前端的实现，它基于 [vue-element-admin](https://panjiachen.github.io/vue-element-admin)实现。它实现了一套最基本的后台权限管理前端的基础模块。可以很快捷的开启自己的项目，不用考虑权限功能如何实现，操作页面如何设计，这里基本上已经满足了，希望能够为大家提供便利。

- [在线预览](http://www.zhangwj.com/#/login)

- [后端项目](https://github.com/wenjianzhang/go-admin)

- [前端项目](https://github.com/wenjianzhang/go-admin-ui)



## 功能

```
- 登录
- 退出

- 首页
- 系统管理
   - 用户管理
   - 菜单管理
   - 角色管理
   - 部门管理
   - 岗位管理
   - 字典管理
   - 参数设置
   - 日志管理
     - 登录日志

- 基础信息
   - Excel

- 系统工具
   - 系统接口
   - 日历

```

## 开发

```bash
# 克隆项目
git clone https://github.com/wenjianzhang/go-admin-ui.git

# 进入项目目录
cd go-admin-ui

# 安装依赖
npm install

# 建议不要直接使用 cnpm 安装依赖，会有各种诡异的 bug。可以通过如下操作解决 npm 下载速度慢的问题
npm install --registry=https://registry.npm.taobao.org

# 启动服务
npm run dev
```

浏览器访问 http://localhost:9527

## 发布

```bash
# 构建测试环境
npm run build:stage

# 构建生产环境
npm run build:prod
```

## 其它

```bash
# 预览发布环境效果
npm run preview

# 预览发布环境效果 + 静态资源分析
npm run preview -- --report

# 代码格式检查
npm run lint

# 代码格式检查并自动修复
npm run lint -- --fix
```


## 在线预览

[在线 Demo](http://www.zhangwj.com/#/login)


## License

[MIT](https://github.com/wenjianzhang/go-admin-ui/blob/master/LICENSE)

Copyright (c) 2020 wenjianzhang
