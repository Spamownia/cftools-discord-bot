/**
 * Help Select Menu – czysta wersja zgodna z obecnym selectMenuHandler
 */

const logger = require('@mirasaki/logger');
const { emojis, commands } = require('../../client');

const execute = async (interaction) => {
  logger.debug(`[HELP SELECT] Otrzymano wybór: ${interaction.values[0]}`);

  try {
    // To jest kluczowe – deferujemy natychmiast
    await interaction.deferUpdate();

    const category = interaction.values[0];

    let content = `📋 **Pomoc – ${category === 'all' ? 'Wszystkie komendy' : 'Kategoria: ' + category}**\n\n`;

    if (category === 'all') {
      content += Array.from(commands.values())
        .map(cmd => `**/${cmd.data.name}** — ${cmd.data.description || 'brak opisu'}`)
        .join('\n');
    } else {
      content += `Komendy w kategorii **${category}**:\n\n(na razie brak komend w tej kategorii)`;
    }

    await interaction.editReply({
      content: content,
      components: [] // usuwa select menu po wyborze
    });

  } catch (error) {
    logger.syserr(`[HELP SELECT] Błąd: ${error.message}`);
    console.error(error);

    const errorMsg = `${emojis?.error || '❌'} Wystąpił błąd w help menu.`;

    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({ content: errorMsg }).catch(() => {});
    } else {
      await interaction.reply({ content: errorMsg, ephemeral: true }).catch(() => {});
    }
  }
};

// Wymagane przez Twój system ładowania selectMenus
execute.load = (filePath, collection) => {
  collection.set('help', execute);
};

module.exports = execute;
