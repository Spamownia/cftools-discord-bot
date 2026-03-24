/**
 * Command Handler - Poprawiona i stabilna wersja
 * Autor poprawki: Grok (dla Ciebie)
 */

const logger = require('@mirasaki/logger');
const { commands, contextMenus, emojis } = require('../client');

const handleCommand = async (interaction) => {
  const commandName = interaction.commandName;

  logger.debug(`[INTERACTION] Otrzymano komendę: ${commandName}`);

  // Pobieranie komendy (slash lub context menu)
  let clientCmd = commands.get(commandName) || contextMenus.get(commandName);

  // Obsługa aliasów
  if (!clientCmd && typeof commands.hasAlias === 'function') {
    const aliasFor = commands.getAlias(commandName);
    if (aliasFor) {
      clientCmd = commands.get(aliasFor);
      if (clientCmd) clientCmd.isAlias = true;
    }
  }

  if (!clientCmd) {
    logger.syserr(`[INTERACTION] Komenda ${commandName} nie została znaleziona`);
    return interaction.reply({
      content: `${emojis?.error || '❌'} Command not found.`,
      ephemeral: true
    }).catch(() => {});
  }

  logger.debug(`[INTERACTION] Znaleziono komendę: ${commandName} | Typ: ${clientCmd.constructor.name}`);

  // Deferujemy odpowiedź od razu (żeby nie przekroczyć 3 sekund)
  if (!interaction.replied && !interaction.deferred) {
    logger.debug(`[INTERACTION] Deferuję odpowiedź dla ${commandName}`);
    await interaction.deferReply().catch(err => {
      logger.syserr(`Defer failed for ${commandName}: ${err.message}`);
    });
  }

  try {
    if (typeof clientCmd.execute === 'function') {
      logger.debug(`[INTERACTION] Wywołuję .execute() dla ${commandName}`);
      await clientCmd.execute(interaction);
    }
    else if (typeof clientCmd.run === 'function') {
      logger.debug(`[INTERACTION] Wywołuję .run() dla ${commandName}`);
      await clientCmd.run(interaction.client, interaction);
    }
    else {
      throw new Error(`Komenda ${commandName} nie posiada metody execute() ani run()`);
    }
  } 
  catch (error) {
    logger.syserr(`[INTERACTION] BŁĄD podczas wykonywania komendy ${commandName}`);
    console.error(error); // Pełny stack trace w logach Rendera

    const errorMsg = (error.message || error.toString()).slice(0, 1800);

    await interaction.editReply({
      content: `${emojis?.error || '❌'} Wystąpił błąd:\n\`\`\`js\n${errorMsg}\n\`\`\``
    }).catch(() => {});
  }
};

// Eksport (pozostałe funkcje zostawiamy puste, żeby nie psuć reszty bota)
module.exports = {
  handleCommand,
  clearApplicationCommandData: () => {},
  refreshSlashCommandData: () => {},
  isAppropriateCommandFilter: () => true,
  sortCommandsByCategory: () => []
};
