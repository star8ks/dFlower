import { Client, GatewayIntentBits, EmbedBuilder, ButtonStyle, ComponentType, Routes, MessageMentions, User, InteractionType, ActionRowBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js'
import { REST } from '@discordjs/rest'
import { config } from 'dotenv'

import { ProxyAgent } from 'undici'
import dflowerCommand, { buttonHandler, commandHandler, modalSubmitHandler } from './commands/dflower'


config()
const CLIENT_ID = process.env.CLIENT_ID

const client = new Client({ intents: [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMessages
]})


const rest = new REST({ version: '10' }).setToken(process.env.TOKEN)

if (process.env.env === 'dev') {
  const agent = new ProxyAgent({
    uri: 'http://127.0.0.1:1087',
  })

  client.rest.setAgent(agent)
  rest.setAgent(agent)
}

client.on('ready', () => {
  console.log(`Logged in as ${client?.user?.tag}!`)
})

// TODO save room and roomID => users to db
const users: User[] = []

client.on('interactionCreate', async (interaction) => {
  if (interaction.type === InteractionType.ModalSubmit) {
    return modalSubmitHandler(interaction)
  }

  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === dflowerCommand.name) {
      return commandHandler(interaction, users, client)
    }
  }

  if (interaction.isButton()) {
    return buttonHandler(interaction, users)
  }
})


async function main() {
  try {
    await rest.put(Routes.applicationCommands(CLIENT_ID), {
      body: [dflowerCommand.toJSON()]
    })
    console.log('Successfully reloaded application (/) commands.')
  } catch (e) {
    console.error(e)
  }
}
main()
console.log('token:', process.env.TOKEN.slice(65, 72))
client.login(process.env.TOKEN).catch(console.error)
