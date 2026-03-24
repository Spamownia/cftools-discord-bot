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
    const weather = interaction.options.getString('weather');

    await changeGameWeather(serverCfg.CFTOOLS_SERVER_API_ID, weather);

    const embed = new EmbedBuilder()
      .setColor(0x00ff88)
      .setTitle('🌤️ Pogoda zmieniona')
      .setDescription(`Nowa pogoda: **${weather}**`)
      .setFooter({ text: `Serwer: ${serverCfg.NAME}` });

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    logger.syserr(`[CHANGE-GAME-WEATHER] Błąd: ${error.message}`);
    console.error(error);
    if (interaction.deferred && !interaction.replied) {
      await interaction.editReply({ content: `${emojis.error || '❌'} Nie udało się zmienić pogody.` });
    }
  }
};

execute.load = (filePath, collection) => {
  const data = new SlashCommandBuilder()
    .setName('change-game-weather')
    .setDescription('Zmienia pogodę na serwerze')
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
      option.setName('weather')
        .setDescription('Typ pogody')
        .setRequired(true)
        .addChoices(
          { name: 'Clear', value: 'clear' },
          { name: 'Cloudy', value: 'cloudy' },
          { name: 'Rain', value: 'rain' },
          { name: 'Storm', value: 'storm' }
        )
    );

  collection.set('change-game-weather', { data, execute, category: 'admin', aliases: [] });
};

execute.loadAliases = () => [];
module.exports = execute;
