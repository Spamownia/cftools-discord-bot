/**
 * Select Menu Handler - Poprawiona wersja
 */

const logger = require('@mirasaki/logger');
const { emojis, selectMenus } = require('../client');

const handleSelectMenu = async (interaction) => {
  const customId = interaction.customId;

  logger.debug(`[SELECT MENU] Otrzymano: ${customId}`);

  // Poprawne pobieranie select menu
  let selectMenu = selectMenus.get(customId);

  // Obsługa customId z dodatkowymi parametrami (np. "help:category:1")
  if (!selectMenu && customId.includes(':')) {
    const baseId = customId.split(':')[0];
    selectMenu = selectMenus.get(baseId);
  }

  if (!selectMenu) {
    logger.debug(`[SELECT MENU] Nie znaleziono: ${customId}`);
    if (!interaction.replied && !interaction.deferred) {
      return interaction.reply({
        content: `${emojis?.error || '❌'} Ten select menu nie jest obsługiwany.`,
        ephemeral: true
      }).catch(() => {});
    }
    return;
  }

  // Defer update (bezpiecznie)
  if (!interaction.replied && !interaction.deferred) {
    await interaction.deferUpdate().catch(() => {});
  }

  try {
    if (typeof selectMenu.execute === 'function') {
      await selectMenu.execute(interaction);
    } else if (typeof selectMenu.run === 'function') {
      await selectMenu.run(interaction);
    } else {
      throw new Error(`Select menu ${customId} nie ma execute() ani run()`);
    }
  } catch (error) {
    logger.syserr(`[SELECT MENU] Błąd w ${customId}`);
    console.error(error);

    const errorMsg = (error.message || error.toString()).slice(0, 1500);

    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({
        content: `${emojis?.error || '❌'} Wystąpił błąd w select menu:\n\`\`\`js\n${errorMsg}\n\`\`\``
      }).catch(() => {});
    }
  }
};

module.exports = { handleSelectMenu };
