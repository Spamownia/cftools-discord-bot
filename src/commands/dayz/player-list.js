/**
 * Komenda /player-list - Stabilna wersja z poprawnym deferReply
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const logger = require('@mirasaki/logger');
const { emojis } = require('../../client');

const execute = async (interaction) => {
  try {
    // ZAWSZE deferujemy jako pierwsze!
    await interaction.deferReply();

    logger.debug(`[PLAYER-LIST] Wywołano przez ${interaction.user.tag}`);

    // === TUTAJ WSTAWIASZ SWOJĄ LOGIKĘ POBIERANIA GRACZY Z CFTOOLS ===
    // Na razie placeholder – później zastąpisz prawdziwym kodem
    const embed = new EmbedBuilder()
      .setColor(0x00ff88)
      .setTitle('👥 Lista graczy online')
      .setDescription('Pobieranie listy graczy z CFTools API...\n\n`Ładowanie...`')
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });

  } catch (error) {
    logger.syserr(`[PLAYER-LIST] Błąd krytyczny: ${error.message}`);
    console.error(error);

    const errorEmbed = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle('❌ Błąd')
      .setDescription('Wystąpił błąd podczas pobierania listy graczy.');

    if (interaction.deferred) {
      await interaction.editReply({ embeds: [errorEmbed] });
    } else if (!interaction.replied) {
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  }
};

execute.load = (filePath, collection) => {
  const data = new SlashCommandBuilder()
    .setName('player-list')
    .setDescription('Wyświetla aktualną listę graczy na serwerze')
    .setDMPermission(false);

  collection.set('player-list', {
    data,
    execute,
    category: 'dayz',
    aliases: []
  });
};

execute.loadAliases = () => {
  return [];
};

module.exports = execute;
