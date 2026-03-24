/**
 * Komenda /help - Pełna, zgodna ze strukturą projektu wersja
 * Naprawia błąd: cmd.loadAliases is not a function
 */

const { SlashCommandBuilder } = require('discord.js');
const { emojis } = require('../../client');
const pkg = require('../../../package.json');

const execute = async (interaction) => {
  try {
    // Natychmiastowa odpowiedź - kluczowe dla uniknięcia "Aplikacja nie reaguje"
    await interaction.deferReply({ ephemeral: false });

    const selectMenu = {
      type: 1,
      components: [
        {
          type: 3, // StringSelect
          custom_id: 'help',
          placeholder: 'Wybierz kategorię pomocy...',
          options: [
            { label: 'Wszystkie komendy', value: 'all', description: 'Lista wszystkich komend', emoji: '📋' },
            { label: 'Administracja',     value: 'admin',     description: 'Komendy administratorskie', emoji: '🔧' },
            { label: 'Moderacja',         value: 'moderator', description: 'Komendy moderatorskie', emoji: '🛡️' },
            { label: 'DayZ / Serwer',     value: 'dayz',      description: 'Komendy związane z serwerem', emoji: '🎮' },
            { label: 'Teleporty',         value: 'teleport',  description: 'Dostępne lokacje teleportacji', emoji: '📍' },
          ]
        }
      ]
    };

    const embed = {
      color: 0x00ff88,
      title: '📚 Pomoc — cftools-discord-bot',
      description: 'Wybierz kategorię z poniższego menu, aby zobaczyć dostępne komendy.',
      timestamp: new Date().toISOString(),
      footer: { text: `Wersja ${pkg.version} • Husaria` }
    };

    await interaction.editReply({
      embeds: [embed],
      components: [selectMenu]
    });

  } catch (error) {
    console.error('[HELP COMMAND ERROR]', error);

    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: `${emojis?.error || '❌'} Wystąpił błąd podczas wyświetlania pomocy.`,
        ephemeral: true
      }).catch(() => {});
    }
  }
};

// === Wymagane metody przez system ładowania komend ===
execute.load = (filePath, collection) => {
  const data = new SlashCommandBuilder()
    .setName('help')
    .setDescription('Wyświetla pomoc i listę wszystkich komend')
    .setDMPermission(false);

  collection.set('help', {
    data,
    execute,
    category: 'system',
    aliases: [] // puste aliasy
  });
};

// Ta metoda jest wywoływana w index.js – musi istnieć!
execute.loadAliases = () => {
  // Komenda nie używa aliasów – zostawiamy pustą funkcję
  return [];
};

module.exports = execute;
