const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const logger = require('@mirasaki/logger');
const { emojis } = require('../../client');
const {
  requiredServerConfigCommandOption,
  getServerConfigCommandOptionValue,
  changeGameWeather
} = require('../../modules/cftClient');

const execute = async (interaction) => {
  try {
    await interaction.deferReply();
    const serverCfg = getServerConfigCommandOptionValue(interaction);
    await changeGameWeather(serverCfg.CFTOOLS_SERVER_API_ID, 'storm');

    const embed = new EmbedBuilder()
      .setColor(0x00aaff)
      .setTitle('⛈️ Pogoda ustawiona na Stormy')
      .setFooter({ text: `Serwer: ${serverCfg.NAME}` });

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    logger.syserr(`[SET-WEATHER-STORMY] Błąd: ${error.message}`);
    console.error(error);
    if (interaction.deferred && !interaction.replied) {
      await interaction.editReply({ content: `${emojis.error || '❌'} Nie udało się ustawić pogody.` });
    }
  }
};

execute.load = (filePath, collection) => {
  const data = new SlashCommandBuilder()
    .setName('set-weather-stormy')
    .setDescription('Ustawia pogodę na burzową')
    .setDMPermission(false)
    .addStringOption(option => {
      option
        .setName(requiredServerConfigCommandOption.name)
        .setDescription(requiredServerConfigCommandOption.description)
        .setRequired(requiredServerConfigCommandOption.required)
        .setChoices(...requiredServerConfigCommandOption.choices);
      return option;
    });

  collection.set('set-weather-stormy', { data, execute, category: 'admin', aliases: [] });
};

execute.loadAliases = () => [];
module.exports = execute;
