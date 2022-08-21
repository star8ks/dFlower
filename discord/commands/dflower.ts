import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, EmbedBuilder, MessageMentions, ModalBuilder, SlashCommandBuilder, TextInputBuilder, TextInputStyle, User } from 'discord.js'

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

// TODO handle re submit points
export const modalSubmitHandler = async function (interaction) {
  if (interaction.customId !== 'modal') return

  const points = interaction.fields.fields.map(field => {
    // TODO field.value must be integer
    const idParts = field.customId.split('-')
    const id = idParts[idParts.length - 1]
    console.log(idParts)

    return {
      id,
      point: field.value
    }
  })
  console.log(points)

  const pointsStr = points.reduce((str, current) => {
    return str + `<@${current.id}>` + `: ${current.point}\n`
  }, '')
  await interaction.reply({
    ephemeral: true,
    content: '您的评分已提交：\n' + pointsStr
  })
}

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

export const commandHandler = async function(interaction, users, client) {

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

  if (users.length > 5) {
    await interaction.reply({
      ephemeral: true,
      embeds: [new EmbedBuilder({
        title: '发起失败',
        description: '暂不支持超过5人的互评'
      })],
    })
    return
  }

  const actionRowComponent = new ActionRowBuilder<ButtonBuilder>().setComponents(
    new ButtonBuilder().setCustomId('cancel').setLabel('取消').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('confirm').setLabel('确定').setStyle(ButtonStyle.Primary)
  )
  // show preview
  await interaction.reply({
    ephemeral: true,
    embeds: [startEmbed(interaction.user.id, users)],
    components: [actionRowComponent],
    target: interaction.user
  })

  return
}

export const buttonHandler = async function (interaction, users) {
  if (interaction.customId === 'cancel') {
    // TODO can not cancel if it already started
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

    await interaction.reply({
      ephemeral: false,
      embeds: [startEmbed(interaction.user.id, users)],
      components: [{
        type: 1,
        components: [{
          style: ButtonStyle.Primary,
          label: '参与互评',
          custom_id: 'start',
          disabled: false,
          type: ComponentType.Button
        }]
      }],
    })
    return
  }

  // todo customId start with 'start' and followed by room id
  if (interaction.customId === 'start') {
    console.log(users.map(user => user.id), interaction.user.id)
    if (users.findIndex(user => user.id === interaction.user.id) < 0) {
      await interaction.reply({
        ephemeral: true,
        embeds: [new EmbedBuilder({
          'title': '您不在此次互评范围内',
        })]
      })
      return
    }

    const modal = new ModalBuilder()
      .setCustomId('modal')
      .setTitle('互评')

    for (const user of users) {
      modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder().setLabel(user.tag).setCustomId('point-' + user.id).setRequired(true).setStyle(TextInputStyle.Short)
      ))
    }

    console.log(modal.toJSON())
    await interaction.showModal(modal)
    return
  }
}


export default dflowerCommand