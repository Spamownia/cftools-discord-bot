/**
 * Help Select Menu - FINAL CLEAN VERSION
 * Zero odniesień do getCommandSelectMenu
 */

const logger = require('@mirasaki/logger');
const { emojis, commands } = require('../../client');

const execute = async (interaction) => {
  logger.debug(`[HELP SELECT] Wybrano: ${interaction.values[0]}`);

  try {
    await interaction.deferUpdate();

    const category = interaction.values[0];

    let content = `📋 **Pomoc - ${category === 'all' ? 'Wszystkie komendy' : category}**\n\n`;

    if (category === 'all') {
      content += Array.from(commands.values())
        .map(cmd => `**/${cmd.data.name}** — ${cmd.data.description || 'brak opisu'}`)
        .join('\n');
    } else {
      content += `Komendy w kategorii **${category}**:\n\n(na razie pusto)`;
    }

    await interaction.editReply({ content, components: [] });

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

execute.load = (filePath, collection) => {
  collection.set('help', execute);
};

module.exports = execute;
