import '../styles/App.css'
import Layout from '../components/Layout'
import Snd from 'snd-lib'
import React from 'react'
import { ApolloProvider } from '@apollo/client'
import apolloClient from '../lib/apollo'


const snd = new Snd()
snd.load(Snd.KITS.SND01)

snd.load(Snd.KITS.SND01).then(() => {
  // Listen click event of all anchor elements.
  // for (let i=0; i<links.length; i++) {
  // 	links[i].addEventListener('click', onClick)
  // }
  document.body.addEventListener('click', () => snd.play(Snd.SOUNDS.TAP))
})

// interface Props {
//   Component: React.ComponentType
//   pageProps: React.ComponentProps<any>
// }

function App({ Component, pageProps }) {
  return (
    <ApolloProvider client={apolloClient}>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </ApolloProvider>
  )
}

export default App
