import { ApolloServer } from 'apollo-server-micro'
import resolvers from '../../graphql/resolvers'
import schema from '../../graphql/schema'
import Cors from 'micro-cors'
import { createContext } from '../../graphql/context'
import {
  ApolloServerPluginLandingPageGraphQLPlayground
} from 'apollo-server-core'

const cors = Cors()

const apolloServer = new ApolloServer({
  schema,

  plugins: [
    ApolloServerPluginLandingPageGraphQLPlayground(),
  ],
  context: createContext
})

const startServer = apolloServer.start()


export default cors(async function handler(req, res) {

  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader(
    'Access-Control-Allow-Origin',
    '*'
  )
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Methods, Access-Control-Allow-Origin, Access-Control-Allow-Credentials, Access-Control-Allow-Headers'
  )
  res.setHeader(
    'Access-Control-Allow-Methods',
    'POST, GET, PUT, PATCH, DELETE, OPTIONS, HEAD'
  )

  if (res.method === 'OPTION') {
    res.end()
    return false
  }

  await startServer
  return await apolloServer.createHandler({
    path: '/api/graphql',
    // cors: false
  })(req, res)
})

export const config = {
  api: {
    bodyParser: false
  }
}

