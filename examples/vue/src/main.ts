import { createApp } from 'vue'
import App from './App.vue'
import 'virtual:windi-base.css'
import 'virtual:windi-components.css'
import 'virtual:windi-utilities.css'
import 'virtual:windi-devtools'
import './main.css'
import '../excluded/included.css'

createApp(App).mount('#app')
