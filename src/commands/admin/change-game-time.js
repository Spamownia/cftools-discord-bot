const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const logger = require('@mirasaki/logger');
const { emojis } = require('../../client');
const {
  requiredServerConfigCommandOption,
  getServerConfigCommandOptionValue,
  changeGameTime   // zakładam, że funkcja istnieje w cftClient
} = require('../../modules/cftClient');

const execute = async (interaction) => {
  try {
    await interaction.deferReply();
    const serverCfg = getServerConfigCommandOptionValue(interaction);
    const time = interaction.options.getString('time');

    await changeGameTime(serverCfg.CFTOOLS_SERVER_API_ID, time);

    const embed = new EmbedBuilder()
      .setColor(0x00ff88)
      .setTitle('⏰ Czas zmieniony')
      .setDescription(`Nowy czas: **${time}**`)
      .setFooter({ text: `Serwer: ${serverCfg.NAME}` });

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    logger.syserr(`[CHANGE-GAME-TIME] Błąd: ${error.message}`);
    console.error(error);
    if (interaction.deferred && !interaction.replied) {
      await interaction.editReply({ content: `${emojis.error || '❌'} Nie udało się zmienić czasu.` });
    }
  }
};

execute.load = (filePath, collection) => {
  const data = new SlashCommandBuilder()
    .setName('change-game-time')
    .setDescription('Zmienia czas w grze')
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
      option.setName('time')
        .setDescription('Nowy czas (HH:MM)')
        .setRequired(true)
    );

  collection.set('change-game-time', { data, execute, category: 'admin', aliases: [] });
};

execute.loadAliases = () => [];
module.exports = execute;
