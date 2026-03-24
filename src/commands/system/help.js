/**
 * Komenda /help - Profesjonalna wersja z Select Menu
 */

const { SlashCommandBuilder } = require('discord.js');
const { emojis } = require('../../client');

const execute = async (interaction) => {
  try {
    // Natychmiastowa odpowiedź - ważne, żeby Discord nie pokazywał "Aplikacja nie reaguje"
    await interaction.deferReply({ ephemeral: false });

    const row = {
      type: 1, // Action Row
      components: [
        {
          type: 3, // String Select Menu
          custom_id: 'help',                    // <-- to jest kluczowe
          placeholder: 'Wybierz kategorię pomocy...',
          options: [
            {
              label: 'Wszystkie komendy',
              value: 'all',
              description: 'Pokazuje listę wszystkich dostępnych komend',
              emoji: '📋'
            },
            {
              label: 'Administracja',
              value: 'admin',
              description: 'Komendy dla administratorów',
              emoji: '🔧'
            },
            {
              label: 'Moderacja',
              value: 'moderator',
              description: 'Komendy moderacyjne',
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
        }
      ]
    };

    const embed = {
      color: 0x00ff00,
      title: '📚 Pomoc - cftools-discord-bot',
      description: 'Wybierz kategorię z menu poniżej, aby zobaczyć dostępne komendy.',
      timestamp: new Date(),
      footer: {
        text: `Wersja ${require('../../../package.json').version}`
      }
    };

    await interaction.editReply({
      embeds: [embed],
      components: [row]
    });

  } catch (error) {
    console.error(error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: `${emojis?.error || '❌'} Wystąpił błąd podczas wyświetlania pomocy.`,
        ephemeral: true
      }).catch(() => {});
    }
  }
};

// Ładowanie komendy
execute.load = (filePath, collection) => {
  const data = new SlashCommandBuilder()
    .setName('help')
    .setDescription('Wyświetla pomoc i listę komend')
    .setDMPermission(false);

  collection.set('help', { 
    data, 
    execute,
    category: 'system'
  });
};

module.exports = execute;
