/**
 * Help Select Menu - Poprawiona wersja (bez getCommandSelectMenu)
 */

const logger = require('@mirasaki/logger');
const { emojis, selectMenus, commands } = require('../../client');

const execute = async (interaction) => {
  const customId = interaction.customId;
  const value = interaction.values[0];

  logger.debug(`[HELP SELECT] Wybrano kategorię: ${value} (customId: ${customId})`);

  try {
    await interaction.deferUpdate();

    let replyContent = '📋 **Lista komend**\n\n';

    if (value === 'all') {
      replyContent += Array.from(commands.values())
        .map(cmd => `**/${cmd.data.name}** — ${cmd.data.description || 'brak opisu'}`)
        .join('\n');
    } else {
      replyContent += `**Kategoria: ${value}**\n\nNie znaleziono komend w tej kategorii (na razie).`;
    }

    await interaction.editReply({
      content: replyContent,
      components: [] // usuwa menu po wyborze
    });

  } catch (error) {
    logger.syserr(`[HELP SELECT] Błąd: ${error.message}`);
    console.error(error);

    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: `${emojis?.error || '❌'} Wystąpił błąd przy wyświetlaniu pomocy.`,
        ephemeral: true
      }).catch(() => {});
    }
  }
};

// Wymagane przez Twój system ładowania
execute.load = (filePath, collection) => {
  collection.set('help', execute);        // nazwa "help" – taka sama jak w selectMenus
};

module.exports = execute;
