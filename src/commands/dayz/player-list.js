/**
 * Komenda /player-list - Naprawiona wersja (brak podwójnego reply)
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const logger = require('@mirasaki/logger');
const { emojis } = require('../../client');

const execute = async (interaction) => {
  try {
    // NATYCHMIASTOWE defer – najważniejsze!
    await interaction.deferReply();

    logger.debug(`[PLAYER-LIST] Wywołano przez ${interaction.user.tag}`);

    // Tutaj wstaw swój właściwy kod pobierania listy graczy z CFTools
    // Na razie placeholder – zastąp prawdziwą logiką
    const embed = new EmbedBuilder()
      .setColor(0x00ff88)
      .setTitle('👥 Lista graczy na serwerze')
      .setDescription('Ładowanie listy graczy z CFTools...')
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });

  } catch (error) {
    logger.syserr(`[PLAYER-LIST] Błąd: ${error.message}`);
    console.error(error);

    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: `${emojis?.error || '❌'} Wystąpił błąd podczas pobierania listy graczy.`,
        ephemeral: true
      }).catch(() => {});
    } else if (interaction.deferred) {
      await interaction.editReply({
        content: `${emojis?.error || '❌'} Wystąpił błąd podczas pobierania listy graczy.`
      }).catch(() => {});
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
