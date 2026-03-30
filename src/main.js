import Vue from 'vue'
import VueGoodTablePlugin from 'vue-good-table'
import 'vue-good-table/dist/vue-good-table.css'
import 'vue2-daterange-picker/dist/vue2-daterange-picker.css'
import App from './App.vue'
import './styles.css'

Vue.config.productionTip = false

Vue.use(VueGoodTablePlugin)

new Vue({
  render: function render(h) {
    return h(App)
  },
}).$mount('#app')
