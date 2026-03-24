/**
 * Command Handler - Final fixed version
 */

const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');

const logger = require('@mirasaki/logger');
const chalk = require('chalk');
const { hasChannelPerms, resolvePermissionArray } = require('./permissions');
const { commands, contextMenus, emojis } = require('../client');
const { MS_IN_ONE_SECOND } = require('../constants');

const {
  UserContextCommand,
  MessageContextCommand
} = require('../classes/Commands');

const {
  DISCORD_BOT_TOKEN,
  CLIENT_ID,
  TEST_SERVER_GUILD_ID,
  REFRESH_SLASH_COMMAND_API_DATA,
  DEBUG_SLASH_COMMAND_API_DATA
} = process.env;

const rest = new REST({ version: '10' }).setToken(DISCORD_BOT_TOKEN);

/* ====================== CLEAR COMMANDS ====================== */
const clearApplicationCommandData = () => {
  logger.info('Clearing ApplicationCommand API data');
  rest.put(Routes.applicationCommands(CLIENT_ID), { body: [] });
  if (TEST_SERVER_GUILD_ID) {
    rest.put(Routes.applicationGuildCommands(CLIENT_ID, TEST_SERVER_GUILD_ID), { body: [] })
      .catch(err => logger.syserr(err));
  }
  logger.success('Successfully reset all Slash Commands.');
  process.exit(1);
};

/* ====================== REGISTER COMMANDS ====================== */
const cleanAPIData = (cmd) => {
  if (cmd instanceof UserContextCommand || cmd instanceof MessageContextCommand) {
    return { ...cmd.data, description: null };
  }
  if (cmd.data.description?.length > 100) {
    return { ...cmd.data, description: `${cmd.data.description.slice(0, 97)}...` };
  }
  return cmd.data;
};

const registerGlobalCommands = async (client) => {
  logger.info('Registering Global Application Commands');
  const combined = client.container.commands.concat(client.container.contextMenus);
  const data = combined
    .filter(cmd => cmd.global === true && cmd.enabled === true)
    .map(cleanAPIData);

  return rest.put(Routes.applicationCommands(CLIENT_ID), { body: data })
    .catch(err => logger.syserr(err));
};

const registerTestServerCommands = async (client) => {
  const combined = client.container.commands.concat(client.container.contextMenus);
  const data = combined
    .filter(cmd => cmd.global === false && cmd.enabled === true)
    .map(cleanAPIData);

  if (data.length === 0) return;
  return rest.put(Routes.applicationGuildCommands(CLIENT_ID, TEST_SERVER_GUILD_ID), { body: data })
    .catch(err => logger.syserr(err));
};

const refreshSlashCommandData = (client) => {
  if (REFRESH_SLASH_COMMAND_API_DATA !== 'true') return;
  logger.startLog('Refreshing Application (/) Commands');
  registerGlobalCommands(client);
  if (TEST_SERVER_GUILD_ID) registerTestServerCommands(client);
  logger.endLog('Refreshing Application (/) Commands');
};

/* ====================== COOLDOWN ====================== */
const ThrottleMap = new Map();

const throttleCommand = (clientCmd, interaction) => {
  const { cooldown } = clientCmd;
  if (!cooldown || cooldown === false) return false;

  const cooldownInMS = cooldown.duration * MS_IN_ONE_SECOND;
  const identifier = `${interaction.member.id}-${clientCmd.data.name}`;

  if (!ThrottleMap.has(identifier)) {
    ThrottleMap.set(identifier, [Date.now()]);
    setTimeout(() => ThrottleMap.delete(identifier), cooldownInMS);
    return false;
  }

  const times = ThrottleMap.get(identifier).filter(t => Date.now() - t < cooldownInMS);
  if (times.length >= cooldown.usages) {
    const timeLeft = ((times[0] + cooldownInMS) - Date.now()) / 1000;
    return `${emojis.error} {{user}}, możesz użyć komendy ponownie za ${timeLeft.toFixed(1)}s`;
  }

  times.push(Date.now());
  ThrottleMap.set(identifier, times);
  return false;
};

/* ====================== MAIN HANDLER - FIXED ====================== */
const handleCommand = async (interaction) => {
  const { client } = interaction;
  let clientCmd = commands.get(interaction.commandName) || contextMenus.get(interaction.commandName);

  if (!clientCmd) {
    return interaction.reply({ content: `${emojis.error} Command not found.`, ephemeral: true }).catch(() => {});
  }

  // DEFER OD RAZU - to rozwiązuje "Aplikacja nie reaguje"
  if (!interaction.replied && !interaction.deferred) {
    await interaction.deferReply().catch(() => {});
  }

  // Sprawdzenie uprawnień
  if (!checkCommandCanExecute(client, interaction, clientCmd)) return;

  // Cooldown
  const throttleMsg = throttleCommand(clientCmd, interaction);
  if (throttleMsg) {
    return interaction.editReply({ content: throttleMsg }).catch(() => {});
  }

  try {
    if (typeof clientCmd.execute === 'function') {
      await clientCmd.execute(interaction);
    } else if (typeof clientCmd.run === 'function') {
      await clientCmd.run(client, interaction);   // stare komendy z tego repo
    } else {
      throw new Error(`No execute() or run() method in command: ${interaction.commandName}`);
    }
  } catch (error) {
    logger.syserr(`Error in command ${interaction.commandName}`);
    console.error(error);

    await interaction.editReply({
      content: `${emojis.error} Wystąpił błąd podczas wykonywania komendy.`
    }).catch(() => {});
  }
};

/* ====================== PERMISSION CHECK ====================== */
const checkCommandCanExecute = (client, interaction, clientCmd) => {
  const { member, channel } = interaction;
  const { permLevel = 0, enabled = true, clientPerms = [], userPerms = [], nsfw = false } = clientCmd;

  if (enabled === false) {
    interaction.editReply({ content: `${emojis.error} Ta komenda jest obecnie wyłączona.` });
    return false;
  }

  if (member.permLevel < permLevel) {
    interaction.editReply({ content: `${emojis.error} Nie masz uprawnień do tej komendy.` });
    return false;
  }

  if (nsfw && !channel.nsfw) {
    interaction.editReply({ content: `${emojis.error} Ta komenda działa tylko na kanałach NSFW.` });
    return false;
  }

  return true;
};

const isAppropriateCommandFilter = (member, command) => true; // uproszczone

// Exports
module.exports = {
  clearApplicationCommandData,
  refreshSlashCommandData,
  handleCommand,
  isAppropriateCommandFilter,
  sortCommandsByCategory: () => [] // niepotrzebne teraz
};
