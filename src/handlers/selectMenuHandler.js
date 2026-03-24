/**
 * Select Menu Handler - Stabilna wersja (naprawiony logger)
 */

const logger = require('@mirasaki/logger');
const { emojis, selectMenus } = require('../client');

const handleSelectMenu = async (interaction) => {
  if (!interaction.isStringSelectMenu()) return;

  const customId = interaction.customId;
  logger.debug(`[SELECT MENU] Otrzymano customId: "${customId}"`);

  let selectMenu = selectMenus.get(customId);

  if (!selectMenu) {
    const baseId = customId.split(/[:\-]/)[0];
    selectMenu = selectMenus.get(baseId);
  }

  if (!selectMenu && customId.includes('help')) {
    selectMenu = selectMenus.get('help');
  }

  if (!selectMenu) {
    logger.warn(`[SELECT MENU] Nie znaleziono handlera dla customId: ${customId}`);
    if (!interaction.replied && !interaction.deferred) {
      return interaction.reply({
        content: `${emojis?.error || '❌'} Ten wybór nie jest obsługiwany.`,
        ephemeral: true
      }).catch(() => {});
    }
    return;
  }

  if (!interaction.replied && !interaction.deferred) {
    await interaction.deferUpdate().catch(() => {});
  }

  try {
    if (typeof selectMenu.execute === 'function') {
      await selectMenu.execute(interaction);
    } else if (typeof selectMenu.run === 'function') {
      await selectMenu.run(interaction);
    } else {
      throw new Error(`Select menu "${customId}" nie posiada execute() ani run()`);
    }
  } catch (error) {
    logger.syserr(`[SELECT MENU] Błąd podczas wykonywania "${customId}"`);
    console.error(error);

    const errorMsg = (error.message || error.toString()).slice(0, 1500);

    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({
        content: `${emojis?.error || '❌'} Wystąpił błąd w select menu:\n\`\`\`js\n${errorMsg}\n\`\`\``
      }).catch(() => {});
    } else {
      await interaction.reply({
        content: `${emojis?.error || '❌'} Wystąpił błąd w select menu.`,
        ephemeral: true
      }).catch(() => {});
    }
  }
};

module.exports = { handleSelectMenu };
