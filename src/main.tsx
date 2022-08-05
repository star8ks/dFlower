import React from 'react'
import ReactDOM from 'react-dom/client'
import Snd from 'snd-lib'
import App from './App'
import './index.css'

const snd = new Snd()
snd.load(Snd.KITS.SND01)

snd.load(Snd.KITS.SND01).then(() => {
  // Listen click event of all anchor elements.
  // for (let i=0; i<links.length; i++) {
  // 	links[i].addEventListener('click', onClick)
  // }
  document.body.addEventListener('click', () => snd.play(Snd.SOUNDS.TAP))
})

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
    <footer><a href="https://discord.gg/wCs4zpVQzU">🚑 DDAO</a></footer>
  </React.StrictMode>
)
