const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const logger = require('@mirasaki/logger');
const { emojis } = require('../../client');
const {
  requiredServerConfigCommandOption,
  getServerConfigCommandOptionValue,
  getPlayerSessionOptionValue,
  sendDirectMessage
} = require('../../modules/cftClient');

const execute = async (interaction) => {
  try {
    await interaction.deferReply();
    const serverCfg = getServerConfigCommandOptionValue(interaction);
    const player = getPlayerSessionOptionValue(interaction);
    const message = interaction.options.getString('message');

    await sendDirectMessage(serverCfg.CFTOOLS_SERVER_API_ID, player.id, message);

    const embed = new EmbedBuilder()
      .setColor(0x00ff88)
      .setTitle('📨 Wiadomość wysłana')
      .setDescription(`Do: **${player.name}**\n\`\`\`${message}\`\`\``)
      .setFooter({ text: `Serwer: ${serverCfg.NAME}` });

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    logger.syserr(`[DM-SURVIVOR] Błąd: ${error.message}`);
    console.error(error);
    if (interaction.deferred && !interaction.replied) {
      await interaction.editReply({ content: `${emojis.error || '❌'} Nie udało się wysłać wiadomości.` });
    }
  }
};

execute.load = (filePath, collection) => {
  const data = new SlashCommandBuilder()
    .setName('dm-survivor')
    .setDescription('Wyślij prywatną wiadomość do gracza')
    .setDMPermission(false)
    .addStringOption(option => {
      option
        .setName(requiredServerConfigCommandOption.name)
        .setDescription(requiredServerConfigCommandOption.description)
        .setRequired(requiredServerConfigCommandOption.required)
        .setChoices(...requiredServerConfigCommandOption.choices);
      return option;
    })
    .addStringOption(option =>
      option.setName('player')
        .setDescription('Nazwa gracza lub CFID')
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addStringOption(option =>
      option.setName('message')
        .setDescription('Treść wiadomości')
        .setRequired(true)
    );

  collection.set('dm-survivor', { data, execute, category: 'admin', aliases: [] });
};

execute.loadAliases = () => [];
module.exports = execute;
