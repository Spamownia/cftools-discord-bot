/**
 * Command Handler - Ultimate Debug Version (FINAL)
 */

const logger = require('@mirasaki/logger');
const { commands, contextMenus, emojis } = require('../client');
const { MS_IN_ONE_SECOND } = require('../constants');

const handleCommand = async (interaction) => {
  const commandName = interaction.commandName;
  logger.debug(`[INTERACTION] Otrzymano komendę: ${commandName}`);

  let clientCmd = commands.get(commandName) || contextMenus.get(commandName);

  // Alias support
  if (!clientCmd && commands.hasAlias?.(commandName)) {
    const aliasFor = commands.getAlias(commandName);
    clientCmd = commands.get(aliasFor);
    if (clientCmd) clientCmd.isAlias = true;
  }

  if (!clientCmd) {
    logger.syserr(`[INTERACTION] Komenda ${commandName} nie znaleziona`);
    return interaction.reply({ 
      content: `${emojis?.error || '❌'} Command not found.`, 
      ephemeral: true 
    }).catch(() => {});
  }

  logger.debug(`[INTERACTION] Znaleziono komendę: ${commandName} | Typ: ${clientCmd.constructor.name}`);

  // === DEFER OD RAZU ===
  if (!interaction.replied && !interaction.deferred) {
    logger.debug(`[INTERACTION] Deferuję odpowiedź dla ${commandName}`);
    await interaction.deferReply().catch(err => {
      logger.syserr(`Defer failed for ${commandName}: ${err.message}`);
    });
  }

  try {
    if (typeof clientCmd.execute === 'function') {
      logger.debug(`[INTERACTION] Wywołuję clientCmd.execute() dla ${commandName}`);
      await clientCmd.execute(interaction);
    } 
    else if (typeof clientCmd.run === 'function') {
      logger.debug(`[INTERACTION] Wywołuję clientCmd.run() dla ${commandName}`);
      await clientCmd.run(interaction.client, interaction);
    } 
    else {
      throw new Error(`Brak metody execute() lub run() w komendzie ${commandName}`);
    }
  } catch (error) {
    logger.syserr(`[INTERACTION] BŁĄD w komendzie ${commandName}`);
    console.error(error);   // Pełny stack trace w logach Rendera

    // Pokazujemy użytkownikowi dokładniejszy błąd (do 1800 znaków)
    const errorMsg = error.message || error.toString();

    await interaction.editReply({
      content: `${emojis?.error || '❌'} Wystąpił błąd:\n\`\`\`js\n${errorMsg.slice(0, 1800)}\n\`\`\``
    }).catch(() => {});
  }
};

// Eksport (pozostałe funkcje jako puste, żeby nie psuć importów w index.js)
module.exports = {
  handleCommand,
  clearApplicationCommandData: () => {},
  refreshSlashCommandData: () => {},
  isAppropriateCommandFilter: () => true,
  sortCommandsByCategory: () => []
};
