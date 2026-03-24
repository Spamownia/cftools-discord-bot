const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const logger = require('@mirasaki/logger');
const { emojis } = require('../../client');
const {
  requiredServerConfigCommandOption,
  getServerConfigCommandOptionValue,
  broadcastMessage
} = require('../../modules/cftClient');

const execute = async (interaction) => {
  try {
    await interaction.deferReply();

    const { member, options } = interaction;
    const serverCfg = getServerConfigCommandOptionValue(interaction);
    const message = options.getString('message');

    if (message.length > 256) {
      await interaction.editReply({ 
        content: `${emojis.error} ${member}, wiadomość nie może przekraczać 256 znaków.` 
      });
      return;
    }

    const res = await broadcastMessage(serverCfg.CFTOOLS_SERVER_API_ID, message);
    if (res !== true) {
      await interaction.editReply({ 
        content: `${emojis.error} ${member}, błąd podczas wysyłania broadcastu.` 
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0x00ff88)
      .setTitle('✅ Broadcast wysłany')
      .setDescription(`\`\`\`${message}\`\`\``)
      .setFooter({ text: `Serwer: ${serverCfg.NAME}` });

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    logger.syserr(`[BROADCAST] Błąd: ${error.message}`);
    console.error(error);
    if (interaction.deferred && !interaction.replied) {
      await interaction.editReply({ content: `${emojis.error || '❌'} Wystąpił nieoczekiwany błąd.` });
    }
  }
};

execute.load = (filePath, collection) => {
  const data = new SlashCommandBuilder()
    .setName('broadcast')
    .setDescription('Wyślij wiadomość do wszystkich graczy na serwerze')
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
      option.setName('message')
        .setDescription('Treść wiadomości')
        .setRequired(true)
        .setMinLength(3)
        .setMaxLength(256)
    );

  collection.set('broadcast', { data, execute, category: 'admin', aliases: [] });
};

execute.loadAliases = () => [];
module.exports = execute;
