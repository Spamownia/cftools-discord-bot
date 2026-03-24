const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const logger = require('@mirasaki/logger');
const { emojis } = require('../../client');
const { getServerConfigCommandOptionValue } = require('../../modules/cftClient');
const cftSDK = require('cftools-sdk');

const execute = async (interaction) => {
  try {
    await interaction.deferReply();
    logger.debug(`[PLAYER-LIST] Wywołano przez ${interaction.user.tag}`);

    const serverCfg = getServerConfigCommandOptionValue(interaction);
    const sessions = await cftSDK.listGameSessions({ serverApiId: cftSDK.ServerApiId.of(serverCfg.CFTOOLS_SERVER_API_ID) });

    const embed = new EmbedBuilder()
      .setColor(0x00ff88)
      .setTitle(`👥 Gracze online – ${serverCfg.NAME}`)
      .setDescription(sessions.length ? sessions.map(s => `• **${s.playerName}** (${s.id})`).join('\n') : 'Brak graczy online.')
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    logger.syserr(`[PLAYER-LIST] Błąd krytyczny: ${error.message}`);
    console.error(error);
    const errorEmbed = new EmbedBuilder().setColor(0xff0000).setTitle('Błąd').setDescription('Nie udało się pobrać listy graczy.');
    if (interaction.deferred) await interaction.editReply({ embeds: [errorEmbed] });
  }
};

execute.load = (filePath, collection) => {
  const data = new SlashCommandBuilder()
    .setName('player-list')
    .setDescription('Wyświetla aktualną listę graczy na serwerze')
    .setDMPermission(false)
    .addStringOption(option => option.setName('server').setDescription('Serwer').setRequired(false).addChoices(/* choices z cftClient */));

  collection.set('player-list', { data, execute, category: 'dayz', aliases: [] });
};

execute.loadAliases = () => [];
module.exports = execute;
