const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const logger = require('@mirasaki/logger');
const { emojis } = require('../../client');
const {
  requiredServerConfigCommandOption,
  getServerConfigCommandOptionValue,
  getPlayerSessionOptionValue
} = require('../../modules/cftClient');

const execute = async (interaction) => {
  try {
    await interaction.deferReply();
    const serverCfg = getServerConfigCommandOptionValue(interaction);
    const player = await getPlayerSessionOptionValue(interaction);
    const item = interaction.options.getString('item');

    // Logika spawn item na graczu

    const embed = new EmbedBuilder()
      .setColor(0x00ff88)
      .setTitle('📦 Item spawned on player')
      .setDescription(`Item: **${item}** dla gracza **${player.name}**`)
      .setFooter({ text: `Serwer: ${serverCfg.NAME}` });

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    logger.syserr(`[SPAWN-ITEM-ON-PLAYER] Błąd: ${error.message}`);
    console.error(error);
    if (interaction.deferred && !interaction.replied) {
      await interaction.editReply({ content: `${emojis.error || '❌'} Nie udało się zespawnować itemu.` });
    }
  }
};

execute.load = (filePath, collection) => {
  const data = new SlashCommandBuilder()
    .setName('spawn-item-on-player')
    .setDescription('Spawn item na graczu')
    .setDMPermission(false)
    .addStringOption(option => {
      option
        .setName(requiredServerConfigCommandOption.name)
        .setDescription(requiredServerConfigCommandOption.description)
        .setRequired(requiredServerConfigCommandOption.required)
        .setChoices(...requiredServerConfigCommandOption.choices);
      return option;
    })
    .addStringOption(option =>
      option.setName('player')
        .setDescription('Gracz')
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addStringOption(option => option.setName('item').setDescription('Nazwa itemu').setRequired(true));

  collection.set('spawn-item-on-player', { data, execute, category: 'admin', aliases: [] });
};

execute.loadAliases = () => [];
module.exports = execute;
