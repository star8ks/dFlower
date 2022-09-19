import '@/styles/App.css'
import { AppProps } from 'next/app'
import Layout from '../components/Layout'
import Snd from 'snd-lib'
import React, { useEffect } from 'react'
import { ApolloProvider } from '@apollo/client'
import apolloClient from '../lib/apollo'

function App({ Component, pageProps }: AppProps) {
  useEffect(function mount() {
    const snd = new Snd()
    snd.load(Snd.KITS.SND01)

    function play() {
      snd.play(Snd.SOUNDS.TAP)
    }

    snd.load(Snd.KITS.SND01).then(() => {
      window.addEventListener('click', play)
    })

    return function unMount() {
      window.removeEventListener('click', play)
    }
  }, [])

  return (
    <ApolloProvider client={apolloClient}>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </ApolloProvider>
  )
}

export default App
