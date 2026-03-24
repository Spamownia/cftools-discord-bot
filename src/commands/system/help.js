/**
 * Komenda /help - Wersja w 100% zgodna ze strukturą bota
 * Naprawia problem "Chat myśli..." 
 */

const { SlashCommandBuilder } = require('discord.js');
const { emojis } = require('../../client');
const pkg = require('../../../package.json');

const execute = async (interaction) => {
  try {
    // NATYCHMIASTOWA odpowiedź - najważniejsze!
    await interaction.deferReply({ ephemeral: false });

    const row = {
      type: 1,
      components: [{
        type: 3, // String Select Menu
        custom_id: 'help',
        placeholder: 'Wybierz kategorię pomocy...',
        options: [
          { 
            label: 'Wszystkie komendy', 
            value: 'all', 
            description: 'Pokazuje wszystkie dostępne komendy', 
            emoji: '📋' 
          },
          { 
            label: 'Administracja', 
            value: 'admin', 
            description: 'Komendy administratorskie', 
            emoji: '🔧' 
          },
          { 
            label: 'Moderacja', 
            value: 'moderator', 
            description: 'Komendy dla moderatorów', 
            emoji: '🛡️' 
          },
          { 
            label: 'DayZ / Serwer', 
            value: 'dayz', 
            description: 'Komendy związane z serwerem DayZ', 
            emoji: '🎮' 
          },
          { 
            label: 'Teleporty', 
            value: 'teleport', 
            description: 'Dostępne lokacje teleportacji', 
            emoji: '📍' 
          }
        ]
      }]
    };

    const embed = {
      color: 0x00ff88,
      title: '📚 Pomoc — cftools-discord-bot',
      description: 'Wybierz kategorię z menu poniżej, aby zobaczyć komendy.',
      timestamp: new Date(),
      footer: {
        text: `Wersja ${pkg.version} • Husaria`
      }
    };

    await interaction.editReply({
      embeds: [embed],
      components: [row]
    });

  } catch (error) {
    console.error('[HELP ERROR]', error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: `${emojis?.error || '❌'} Wystąpił błąd podczas wyświetlania pomocy.`,
        ephemeral: true
      }).catch(() => {});
    }
  }
};

// === Wymagane przez Twój system ładowania ===
execute.load = (filePath, collection) => {
  const data = new SlashCommandBuilder()
    .setName('help')
    .setDescription('Wyświetla pomoc i listę komend')
    .setDMPermission(false);

  collection.set('help', {
    data,
    execute,
    category: 'system',
    aliases: []
  });
};

execute.loadAliases = () => {
  // Komenda nie używa aliasów
  return [];
};

module.exports = execute;
