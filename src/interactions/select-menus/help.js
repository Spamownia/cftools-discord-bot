/**
 * Help Select Menu
 */

const logger = require('@mirasaki/logger');
const { emojis, commands } = require('../../client');   // dostosuj ścieżkę jeśli potrzeba

const handleHelpSelectMenu = async (interaction) => {
  const customId = interaction.customId;
  const selected = interaction.values[0];

  logger.debug(`[HELP SELECT] Wybrano: ${selected} | customId: ${customId}`);

  try {
    await interaction.deferUpdate();

    // Tutaj logika wyświetlania kategorii helpa
    // Przykład – możesz dostosować do swojego systemu kategorii
    let content = '';

    if (selected === 'all' || selected === 'general') {
      content = '📋 **Wszystkie komendy**\n\n' + 
                Array.from(commands.values())
                  .map(cmd => `**/${cmd.data.name}** - ${cmd.data.description || 'brak opisu'}`)
                  .join('\n');
    } else {
      content = `📂 **Kategoria: ${selected}**\n\nBrak komend w tej kategorii (jeszcze).`;
    }

    await interaction.editReply({
      content: content,
      components: []   // usuwa select menu po wyborze (opcjonalnie)
    });

  } catch (error) {
    logger.syserr(`[HELP SELECT] Błąd: ${error.message}`);
    console.error(error);

    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: `${emojis?.error || '❌'} Wystąpił błąd w help select menu.`,
        ephemeral: true
      }).catch(() => {});
    }
  }
};

// Ładowanie (zgodne z Twoim systemem .load())
handleHelpSelectMenu.load = (filePath, collection) => {
  collection.set('help', handleHelpSelectMenu);   // lub 'help-select' – dostosuj nazwę
};

module.exports = handleHelpSelectMenu;
