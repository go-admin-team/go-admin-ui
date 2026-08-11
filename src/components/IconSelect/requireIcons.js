// 收集 src/icons/svg 下所有图标名，供图标选择器使用
const modules = import.meta.glob('../../icons/svg/*.svg')

const icons = Object.keys(modules).map(filePath => {
  return filePath.match(/\/([^/]+)\.svg$/)[1]
})

export default icons
