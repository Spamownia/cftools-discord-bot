const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const logger = require('@mirasaki/logger');
const { emojis } = require('../../client');
const {
  requiredServerConfigCommandOption,
  getServerConfigCommandOptionValue
} = require('../../modules/cftClient');

const execute = async (interaction) => {
  try {
    await interaction.deferReply();
    const serverCfg = getServerConfigCommandOptionValue(interaction);
    const item = interaction.options.getString('item');
    const x = interaction.options.getNumber('x');
    const y = interaction.options.getNumber('y');
    const z = interaction.options.getNumber('z');

    // Logika spawn item na koordynatach (użyj postGameLabsAction lub RCON)

    const embed = new EmbedBuilder()
      .setColor(0x00ff88)
      .setTitle('📦 Item spawned')
      .setDescription(`Item: **${item}** na koordynatach (${x}, ${y}, ${z})`)
      .setFooter({ text: `Serwer: ${serverCfg.NAME}` });

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    logger.syserr(`[SPAWN-ITEM-ON-COORDS] Błąd: ${error.message}`);
    console.error(error);
    if (interaction.deferred && !interaction.replied) {
      await interaction.editReply({ content: `${emojis.error || '❌'} Nie udało się zespawnować itemu.` });
    }
  }
};

execute.load = (filePath, collection) => {
  const data = new SlashCommandBuilder()
    .setName('spawn-item-on-coords')
    .setDescription('Spawn item na podanych koordynatach')
    .setDMPermission(false)
    .addStringOption(option => {
      option
        .setName(requiredServerConfigCommandOption.name)
        .setDescription(requiredServerConfigCommandOption.description)
        .setRequired(requiredServerConfigCommandOption.required)
        .setChoices(...requiredServerConfigCommandOption.choices);
      return option;
    })
    .addStringOption(option => option.setName('item').setDescription('Nazwa itemu').setRequired(true))
    .addNumberOption(option => option.setName('x').setDescription('X').setRequired(true))
    .addNumberOption(option => option.setName('y').setDescription('Y').setRequired(true))
    .addNumberOption(option => option.setName('z').setDescription('Z').setRequired(true));

  collection.set('spawn-item-on-coords', { data, execute, category: 'admin', aliases: [] });
};

execute.loadAliases = () => [];
module.exports = execute;
