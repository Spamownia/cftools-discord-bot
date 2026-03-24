/**
 * Select Menu Handler
 */

const logger = require('@mirasaki/logger');
const { emojis, selectMenus } = require('../client');

const handleSelectMenu = async (interaction) => {
  const customId = interaction.customId;

  logger.debug(`[SELECT MENU] Otrzymano select menu: ${customId}`);

  // Poprawna obsługa select menu (to była główna przyczyna błędu)
  let selectMenu = selectMenus.get(customId);

  // Obsługa select menu z dodatkowymi danymi (np. help:category:1)
  if (!selectMenu && customId.includes(':')) {
    const baseId = customId.split(':')[0];
    selectMenu = selectMenus.get(baseId);
  }

  if (!selectMenu) {
    logger.syserr(`[SELECT MENU] Nie znaleziono select menu o ID: ${customId}`);
    return interaction.reply({
      content: `${emojis?.error || '❌'} Select menu not found.`,
      ephemeral: true
    }).catch(() => {});
  }

  // Defer jeśli nie jest jeszcze deferred/replied
  if (!interaction.replied && !interaction.deferred) {
    await interaction.deferUpdate().catch(() => {});
  }

  try {
    if (typeof selectMenu.execute === 'function') {
      await selectMenu.execute(interaction);
    } else if (typeof selectMenu.run === 'function') {
      await selectMenu.run(interaction);
    } else {
      throw new Error(`Select menu ${customId} nie posiada metody execute() ani run()`);
    }
  } catch (error) {
    logger.syserr(`[SELECT MENU] BŁĄD w select menu ${customId}`);
    console.error(error);

    const errorMsg = (error.message || error.toString()).slice(0, 1800);

    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({
        content: `${emojis?.error || '❌'} Wystąpił błąd:\n\`\`\`js\n${errorMsg}\n\`\`\``
      }).catch(() => {});
    } else {
      await interaction.reply({
        content: `${emojis?.error || '❌'} Wystąpił błąd:\n\`\`\`js\n${errorMsg}\n\`\`\``,
        ephemeral: true
      }).catch(() => {});
    }
  }
};

module.exports = {
  handleSelectMenu
};
