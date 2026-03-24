/**
 * Help Select Menu – Poprawiona wersja (działa z aktualnym selectMenuHandler)
 */

const logger = require('@mirasaki/logger');
const { emojis, commands } = require('../../client');

const execute = async (interaction) => {
  logger.debug(`[HELP SELECT] Wywołano z customId: ${interaction.customId}`);

  try {
    // Deferujemy od razu – to najważniejsze, żeby uniknąć "Aplikacja nie odpowiada"
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferUpdate();
    }

    const selectedCategory = interaction.values[0];

    let content = `📋 **Pomoc – kategoria: ${selectedCategory}**\n\n`;

    if (selectedCategory === 'all') {
      content += Array.from(commands.values())
        .map(cmd => `**/${cmd.data.name}** — ${cmd.data.description || 'brak opisu'}`)
        .join('\n');
    } else {
      content += `Komendy z kategorii **${selectedCategory}**:\n\n(na razie pusto – dodaj komendy do tej kategorii)`;
    }

    await interaction.editReply({
      content: content,
      components: [] // usuwa menu po wyborze
    });

  } catch (error) {
    logger.syserr(`[HELP SELECT] Błąd wykonania: ${error.message}`);
    console.error(error);

    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: `${emojis?.error || '❌'} Wystąpił błąd przy wyświetlaniu pomocy.`,
        ephemeral: true
      }).catch(() => {});
    } else if (interaction.deferred || interaction.replied) {
      await interaction.editReply({
        content: `${emojis?.error || '❌'} Wystąpił błąd przy wyświetlaniu pomocy.`
      }).catch(() => {});
    }
  }
};

// Wymagane przez Twój loader
execute.load = (filePath, collection) => {
  collection.set('help', execute);   // nazwa musi być 'help' – taka jak w customId
};

module.exports = execute;
