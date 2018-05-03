// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'

import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'

import Vuetify from 'vuetify'
import 'vuetify/dist/vuetify.min.css'

import 'material-design-icons-iconfont/dist/material-design-icons.css'

import Axios from 'axios'
//window.SERVER_URL = 'http://' + window.location.hostname + ':9077'
window.SERVER_URL = 'http://192.168.0.29:9077'
 //Axios.defaults.baseURL = 'http://192.168.0.29:9077'
Axios.defaults.baseURL = window.SERVER_URL

import VueTimers from '@/helpers/VueTimers'
Vue.mixin(VueTimers)

import './styles/UI.css'
import './styles/Grid.css'

Vue.use(ElementUI)
Vue.use(Vuetify)

Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  el: '#app',
  components: { App },
  template: '<App/>'
})
