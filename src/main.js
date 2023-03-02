import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import ArcoVue from '@arco-design/web-vue';
import { Message, Modal, Notification } from '@arco-design/web-vue';
import '@arco-design/web-vue/dist/arco.css';
import router from './router/';
import { parseTime } from '@/utils/parseTime';
import SvgRaw from '@/components/SvgRaw';

// Directive
import permission from '@/directive/permission/permission';

// 引入 Arco 图标库
import * as ArcoIconModules from '@arco-design/web-vue/es/icon';
// Initialize the Pinia instance
const pinia = createPinia();
const app = createApp(App);

app.directive('has', permission.checkPermission);

// 挂载全局变量
app.config.globalProperties.message = Message;
app.config.globalProperties.modal = Modal;
app.config.globalProperties.notification = Notification;
app.config.globalProperties.parseTime = parseTime;
app.config.globalProperties.CDNDomain = '//localhost'; //头像所在的CDN域名

// 挂载全局图标
for(const name in ArcoIconModules){
  app.component(name,ArcoIconModules[name])
}
app.component('SvgRaw', SvgRaw);

app.use(ArcoVue);
app.use(router);
app.use(pinia);
app.mount('#app');

