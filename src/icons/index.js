import SvgIcon from '@/components/SvgIcon'// svg component

const req = require.context('./svg', false, /\.svg$/)
const requireAll = requireContext => requireContext.keys().map(requireContext)
requireAll(req)

export default SvgIcon
