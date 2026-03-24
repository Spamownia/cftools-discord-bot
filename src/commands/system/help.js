/**
 * Komenda /help - FINALNA WERSJA (używa builders + natychmiastowa reply)
 * Naprawia "Aplikacja nie reaguje"
 */

const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const logger = require('@mirasaki/logger');
const { emojis } = require('../../client');
const pkg = require('../../../package.json');

const execute = async (interaction) => {
  try {
    logger.debug(`[HELP] Komenda uruchomiona przez ${interaction.user.tag}`);

    // Tworzenie Select Menu przy użyciu builders (zalecane w discord.js v14)
    const row = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('help')
        .setPlaceholder('Wybierz kategorię pomocy...')
        .addOptions([
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
            description: 'Komendy moderatorskie',
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
        ])
    );

    const embed = {
      color: 0x00ff88,
      title: '📚 Pomoc — cftools-discord-bot',
      description: 'Wybierz kategorię z menu poniżej, aby zobaczyć komendy.',
      timestamp: new Date(),
      footer: {
        text: `Wersja ${pkg.version} • Husaria`
      }
    };

    // NATYCHMIASTOWA odpowiedź (najpewniejsza metoda)
    await interaction.reply({
      embeds: [embed],
      components: [row],
      ephemeral: false
    });

    logger.debug(`[HELP] Komenda wykonana pomyślnie`);

  } catch (error) {
    logger.error(`[HELP] Błąd krytyczny: ${error.message}`);
    console.error(error);

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
    aliases: []
  });
};

execute.loadAliases = () => {
  return [];
};

module.exports = execute;
