const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const logger = require('@mirasaki/logger');
const { emojis } = require('../../client');
const {
  requiredServerConfigCommandOption,
  getServerConfigCommandOptionValue
} = require('../../modules/cftClient');
const cftSDK = require('cftools-sdk');

const execute = async (interaction) => {
  try {
    await interaction.deferReply();
    const serverCfg = getServerConfigCommandOptionValue(interaction);
    // Przykład: pobieranie flagged players (dostosuj do Twojego SDK jeśli masz dedykowaną metodę)
    const flagged = []; // Tutaj wstaw logikę flagged players z cftSDK lub GameLabs

    const embed = new EmbedBuilder()
      .setColor(0xffaa00)
      .setTitle(`🚩 Flagged Players – ${serverCfg.NAME}`)
      .setDescription(flagged.length ? flagged.map(p => `• ${p.name}`).join('\n') : 'Brak flagged graczy.')
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    logger.syserr(`[FLAGGED-PLAYER-LIST] Błąd: ${error.message}`);
    console.error(error);
    if (interaction.deferred && !interaction.replied) {
      await interaction.editReply({ content: `${emojis.error || '❌'} Nie udało się pobrać listy flagged graczy.` });
    }
  }
};

execute.load = (filePath, collection) => {
  const data = new SlashCommandBuilder()
    .setName('flagged-player-list')
    .setDescription('Pokazuje listę flagged graczy')
    .setDMPermission(false)
    .addStringOption(option => {
      option
        .setName(requiredServerConfigCommandOption.name)
        .setDescription(requiredServerConfigCommandOption.description)
        .setRequired(requiredServerConfigCommandOption.required)
        .setChoices(...requiredServerConfigCommandOption.choices);
      return option;
    });

  collection.set('flagged-player-list', { data, execute, category: 'admin', aliases: [] });
};

execute.loadAliases = () => [];
module.exports = execute;
