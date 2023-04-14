import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import ArcoVue from '@arco-design/web-vue';
import { Message, Modal, Notification } from '@arco-design/web-vue';
import '@arco-design/web-vue/dist/arco.css';
import router from './router/';
import { parseTime } from '@/utils/parseTime';

// Directive
import permission from '@/directive/permission/permission';

// 引入 Arco 图标库
import * as ArcoIconModules from '@arco-design/web-vue/es/icon';

console.log(import.meta.env);

// Initialize the Pinia instance
const pinia = createPinia();
const app = createApp(App);

app.directive('has', permission.checkPermission);

// 挂载全局变量
app.config.globalProperties.message = Message;
app.config.globalProperties.modal = Modal;
app.config.globalProperties.notification = Notification;
app.config.globalProperties.parseTime = parseTime;

// 挂载全局图标
for(const name in ArcoIconModules){
  app.component(name,ArcoIconModules[name])
}

app.use(ArcoVue);
app.use(router);
app.use(pinia);
app.mount('#app');

