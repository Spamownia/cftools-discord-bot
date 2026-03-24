/**
 * Help Select Menu - Stabilna wersja
 */

const logger = require('@mirasaki/logger');
const { emojis, commands } = require('../../client');

const execute = async (interaction) => {
  logger.debug(`[HELP SELECT] Wybrano kategorię: ${interaction.values[0]}`);

  try {
    await interaction.deferUpdate();

    const category = interaction.values[0];

    let content = `📋 **Pomoc - ${category === 'all' ? 'Wszystkie komendy' : category}**\n\n`;

    if (category === 'all') {
      content += Array.from(commands.values())
        .map(cmd => `**/${cmd.data.name}** — ${cmd.data.description || 'brak opisu'}`)
        .join('\n');
    } else {
      content += `Komendy w kategorii **${category}**:\n\n(na razie pusto - dodaj komendy do tej kategorii)`;
    }

    await interaction.editReply({ 
      content, 
      components: [] 
    });

  } catch (error) {
    logger.error(`[HELP SELECT] Błąd: ${error.message}`);
    console.error(error);

    const errMsg = `${emojis?.error || '❌'} Wystąpił błąd podczas wyświetlania pomocy.`;

    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({ content: errMsg }).catch(() => {});
    } else {
      await interaction.reply({ content: errMsg, ephemeral: true }).catch(() => {});
    }
  }
};

// Poprawione ładowanie – rejestrujemy pod kluczem 'help'
execute.load = (filePath, collection) => {
  collection.set('help', execute);
};

module.exports = execute;
