/**
 * Help Select Menu - Czysta wersja bez getCommandSelectMenu
 * Działa z aktualnym selectMenuHandler.js i index.js
 */

const logger = require('@mirasaki/logger');
const { emojis, commands } = require('../../client');

const execute = async (interaction) => {
  logger.debug(`[HELP SELECT] Wywołano - wybrano: ${interaction.values[0]}`);

  try {
    // Najważniejsze: deferujemy OD RAZU
    await interaction.deferUpdate();

    const category = interaction.values[0];

    let content = `📋 **Pomoc Discord Bot**\n\n`;

    if (category === 'all') {
      content += '**Wszystkie komendy:**\n\n' +
        Array.from(commands.values())
          .map(cmd => `**/${cmd.data.name}** — ${cmd.data.description || 'brak opisu'}`)
          .join('\n');
    } else {
      content += `**Kategoria: ${category}**\n\nNa razie brak komend w tej kategorii.`;
    }

    await interaction.editReply({
      content: content,
      components: []          // usuwa menu po wyborze
    });

  } catch (error) {
    logger.syserr(`[HELP SELECT] Błąd: ${error.message}`);
    console.error(error);

    const errMsg = `${emojis?.error || '❌'} Wystąpił błąd w menu pomocy.`;

    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({ content: errMsg }).catch(() => {});
    } else {
      await interaction.reply({ content: errMsg, ephemeral: true }).catch(() => {});
    }
  }
};

// Wymagane przez Twój loader selectMenus
execute.load = (filePath, collection) => {
  collection.set('help', execute);
};

module.exports = execute;
