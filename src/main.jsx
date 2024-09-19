import { createRoot } from 'react-dom/client'
import { Provider } from "react-redux"
import App from './App.jsx'
import './index.css'
import store from "./store/store.js"
// import ReactDom from "react-dom/client"

createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <App />
  </Provider>,
)