import { Client, Constants, GatewayIntentBits, EmbedBuilder, EmbedType, ButtonStyle, ComponentType, Routes, ApplicationCommandOptionType, ChatInputCommandInteraction, ButtonInteraction, CommandInteraction, MessageMentions, User, SlashCommandBuilder, Channel, TextChannel, ChannelType, ThreadAutoArchiveDuration } from 'discord.js'
import { REST } from '@discordjs/rest'
import { config } from 'dotenv'
import { createRoom } from './poppy'

import { ProxyAgent } from 'undici'

function getUsersFromMention(mention: string) {
  // The id is the first and only match found by the RegEx.
  const pattern = new RegExp(MessageMentions.UsersPattern, 'g')
  const matches = mention.matchAll(pattern)

  // If supplied variable was not a mention, matches will be null instead of an array.
  if (!matches) return

  // The first element in the matches array will be the entire mention, not just the ID,
  // so use index 1.
  // const id = matches[1]

  return matches
}

config()
const CLIENT_ID = process.env.CLIENT_ID

const client = new Client({ intents: [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.MessageContent
]})


const rest = new REST({ version: '10' }).setToken(process.env.TOKEN)

if (process.env.env === 'dev') {
  const agent = new ProxyAgent({
    uri: 'http://127.0.0.1:1087',
  })

  client.rest.setAgent(agent)
  rest.setAgent(agent)
}



const dflowerCommand = new SlashCommandBuilder()
  .setName('dflower')
  .setDescription('Start a peer review session')
  .setDescriptionLocalizations({
    'zh-CN': '开启一次小红花互评',
    'zh-TW': '開啟一次小紅花互評'
  })
  .addStringOption(option =>
    option.setName('members')
      .setDescription('metion all members participating in the session')
      .setDescriptionLocalizations({
        'zh-CN': '@所有参与互评的成员',
        'zh-TW': '@所有參與互評的成員'
      })
      .setRequired(true)
  )



client.on('ready', () => {
  console.log(`Logged in as ${client?.user?.tag}!`)
})

client.on('messageCreate', async (msg) => {
  console.log(msg.content, msg.author.id, msg.guildId, msg.mentions)
  if (msg.author.id === client.user.id) return

  if (msg.content === '🏓️') {
    msg.reply('🏓️')
    return
  }
  if (msg.content.startsWith('poppy')) {
    const members = msg.mentions.users.map(user => `<@${user.id}>`).join('\n')
    const embed = new EmbedBuilder({
      'title': '发起互评',
      'description': `发起人：<@${msg.author.id}>\n互评时间：2小时\n\n**成员**\n` + members,
      'color': 0x00FFFF
    })
    msg.reply({
      embeds: [embed],
    })



    // await msg.startThread({
    //   name: 'poppy thread'
    // })
  }
})


const startEmbed = (startUserID: string, users: User[]) => {
  let members = ''
  for (const user of users) {
    members += `<@${user.id}> `
  }
  return new EmbedBuilder({
    'title': '发起互评',
    'description': `发起人：<@${startUserID}>\n互评时间：2小时\n\n**成员**\n` + members,
    'color': 0x00FFFF
  })
}

// TODO save room and roomID => users to db
const users: User[] = []

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton() && !interaction.isChatInputCommand()) return

  if (interaction.isChatInputCommand() && interaction.commandName === dflowerCommand.name) {
    console.log(interaction.options.data, interaction.options.getString('members'))
    const mention = interaction.options.getString('members')

    const matches = getUsersFromMention(mention)

    for (const match of matches) {
      console.log(match)
      const id = match[1]
      users.push(client.users.cache.get(id))
    }

    if (users.length < 3) {
      await interaction.reply({
        ephemeral: true,
        embeds: [new EmbedBuilder({
          title: '发起失败',
          description: '参与互评的总人数最低为3位'
        })],
      })
      return
    }

    // show preview
    await interaction.reply({
      ephemeral: true,
      embeds: [startEmbed(interaction.user.id, users)],
      components: [{
        type: 1,
        components: [{
          style: ButtonStyle.Danger,
          label: '取消',
          custom_id: 'cancel',
          disabled: false,
          type: ComponentType.Button
        }, {
          style: ButtonStyle.Primary,
          label: '确定',
          custom_id: 'confirm',
          disabled: false,
          type: ComponentType.Button
        }]
      }],
      target: interaction.user
    })

    return
  }

  if (interaction.customId === 'cancel') {
    await interaction.reply({
      ephemeral: true,
      embeds: [new EmbedBuilder({
        'title': '互评已关闭',
        // 'description': ''
      })]
    })
  }

  if (interaction.customId === 'confirm') {
    console.log('started a new review session', interaction.id)

    const channel:Channel = client.channels.cache.get(interaction.channelId)
    console.log('channel type', channel.type, ChannelType.GuildText, channel.isThread())
    if ((channel.type !== ChannelType.GuildText) || channel.isThread() ) {
      await interaction.reply({
        ephemeral: true,
        embeds: [new EmbedBuilder({
          title: '发起失败',
          description: '请在文字类频道发起'
        })],
      })
      return
    }

    const thread = await channel.threads.create({
      name: 'd-flower-' + 'uid()',
      autoArchiveDuration: ThreadAutoArchiveDuration.OneHour,
      type: ChannelType.GuildPrivateThread
    })
    for (const user of users) {
      await thread.members.add(user)
    }

    await interaction.reply({
      ephemeral: false,
      embeds: [startEmbed(interaction.user.id, users)]
    })
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
