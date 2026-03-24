/**
 * Our command handler, holds utility functions and everything to do with
 * handling commands in this template. Exported from `/src/handlers/commands.js`.
 * See {@tutorial adding-commands} for an overview.
 * @module Handler/Commands
 */

/**
 * Discord API command data
 * @external DiscordAPIApplicationCommand
 * @see {@link https://discord-api-types.dev/api/discord-api-types-v10/interface/APIApplicationCommand}
 */

/**
 * The command interaction received
 * @external DiscordCommandInteraction
 * @see {@link https://discord.js.org/#/docs/discord.js/main/class/CommandInteraction}
 */

/**
 * The `discord.js` ActionRowBuilder
 * @external DiscordActionRowBuilder
 * @see {@link https://discord.js.org/#/docs/discord.js/main/class/ActionRowBuilder}
 */

/**
 * The `discord.js` EmbedBuilder
 * @external DiscordEmbedBuilder
 * @see {@link https://discord.js.org/#/docs/discord.js/main/class/EmbedBuilder}
 */

// Require dependencies
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');

// Local imports
const {
  titleCase, splitCamelCaseStr, colorResolver
} = require('../util');
const emojis = require('../../config/emojis.json');

// Packages
const logger = require('@mirasaki/logger');
const chalk = require('chalk');
const { hasChannelPerms, resolvePermissionArray } = require('./permissions');
const {
  commands, contextMenus, colors
} = require('../client');
const {
  SELECT_MENU_MAX_OPTIONS,
  HELP_SELECT_MENU_SEE_MORE_OPTIONS,
  HELP_COMMAND_SELECT_MENU,
  MS_IN_ONE_SECOND
} = require('../constants');
const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  PermissionsBitField
} = require('discord.js');
const {
  UserContextCommand,
  MessageContextCommand,
  ChatInputCommand
} = require('../classes/Commands');

// Destructure from process.env
const {
  DISCORD_BOT_TOKEN,
  CLIENT_ID,
  TEST_SERVER_GUILD_ID,
  REFRESH_SLASH_COMMAND_API_DATA,
  DEBUG_SLASH_COMMAND_API_DATA,
  DEBUG_COMMAND_THROTTLING
} = process.env;

// Initializing our REST client
const rest = new REST({ version: '10' })
  .setToken(DISCORD_BOT_TOKEN);

/**
 * Clears all InteractionCommand data from the Discord API
 */
const clearApplicationCommandData = () => {
  logger.info('Clearing ApplicationCommand API data');
  rest.put(Routes.applicationCommands(CLIENT_ID), { body: [] });

  if (TEST_SERVER_GUILD_ID) {
    rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, TEST_SERVER_GUILD_ID),
      { body: [] }
    ).catch((err) => {
      logger.syserr('Error while clearing GuildCommands in test server (probably invalid TEST_SERVER_GUILD_ID)');
      logger.syserr(err);
    });
  } else {
    logger.info('Skipping non-global commands, TEST_SERVER_GUILD_ID missing');
  }

  logger.success('Successfully reset all Slash Commands.');
  logger.syslog(chalk.redBright('Shutting down...'));
  process.exit(1);
};

/**
 * Sorts commands by category
 */
const sortCommandsByCategory = (commands) => {
  let currentCategory = '';
  const sorted = [];

  commands.forEach((cmd) => {
    const workingCategory = titleCase(cmd.category);
    if (currentCategory !== workingCategory) {
      sorted.push({
        category: workingCategory,
        commands: [cmd]
      });
      currentCategory = workingCategory;
    } else {
      sorted.find((e) => e.category === currentCategory).commands.unshift(cmd);
    }
  });
  return sorted;
};

/**
 * Cleans command data for Discord API
 */
const cleanAPIData = (cmd) => {
  if (cmd instanceof UserContextCommand || cmd instanceof MessageContextCommand) {
    return { ...cmd.data, description: null };
  }

  if (cmd.data.description.length > 100) {
    return {
      ...cmd.data,
      description: `${cmd.data.description.slice(0, 97)}...`
    };
  }
  return cmd.data;
};

const apiCommandTypeList = {
  1: 'Slash Command',
  2: 'User Context Menu',
  3: 'Message Context Menu'
};

const logCommandApiData = (cmdData) => {
  const cleanedObjArr = cmdData.map((data) => ({
    name: data.name,
    description: data.description || 'n/a',
    options: data.options?.length || 0,
    type: apiCommandTypeList[data.type]
  }));
  console.table(cleanedObjArr);
};

/**
 * Register global commands
 */
const registerGlobalCommands = async (client) => {
  logger.info('Registering Global Application Commands');

  const { commands, contextMenus } = client.container;
  const combinedData = commands.concat(contextMenus);

  const globalCommandData = combinedData
    .filter((cmd) => cmd.global === true && cmd.enabled === true)
    .map(cleanAPIData);

  if (DEBUG_SLASH_COMMAND_API_DATA === 'true') {
    logger.startLog('Global Command Data');
    logCommandApiData(globalCommandData);
    logger.endLog('Global Command Data');
  }

  return await rest.put(
    Routes.applicationCommands(CLIENT_ID),
    { body: globalCommandData }
  ).catch((err) => {
    if (err.status === 400) {
      logger.syserr(`Invalid Form Body: ${err.message}`);
      console.log(err.rawError?.errors);
    } else {
      logger.syserr(err);
    }
  });
};

/**
 * Register test server commands
 */
const registerTestServerCommands = async (client) => {
  const { commands, contextMenus } = client.container;
  const combinedData = commands.concat(contextMenus);

  const testServerCommandData = combinedData
    .filter((cmd) => cmd.global === false && cmd.enabled === true)
    .map(cleanAPIData);

  if (testServerCommandData.length === 0) return true;

  logger.info('Registering Test Server Commands');

  if (DEBUG_SLASH_COMMAND_API_DATA === 'true') {
    logger.startLog('Test Server Command Data');
    logCommandApiData(testServerCommandData);
    logger.endLog('Test Server Command Data');
  }

  return await rest.put(
    Routes.applicationGuildCommands(CLIENT_ID, TEST_SERVER_GUILD_ID),
    { body: testServerCommandData }
  ).catch((err) => {
    if (err.status === 404) {
      logger.syserr('Invalid TEST_SERVER_GUILD_ID or bot not in that server');
    } else if (err.status === 400) {
      logger.syserr(`Invalid Form Body: ${err.message}`);
    } else {
      logger.syserr(err);
    }
  });
};

/**
 * Refresh slash command data on startup
 */
const refreshSlashCommandData = (client) => {
  if (REFRESH_SLASH_COMMAND_API_DATA !== 'true') {
    logger.syslog(`Skipping application (/) commands refresh.`);
    return;
  }

  try {
    logger.startLog(`Refreshing Application (/) Commands`);
    registerGlobalCommands(client);
    if (TEST_SERVER_GUILD_ID) registerTestServerCommands(client);
    logger.endLog(`Refreshing Application (/) Commands`);
  } catch (error) {
    logger.syserr('Error while refreshing application commands');
    console.error(error);
  }
};

// ==================== COOLDOWN SYSTEM ====================

const ThrottleMap = new Map();

const getThrottleId = (cooldown, cmdName, interaction) => {
  const { member, channel, guild } = interaction;
  let identifierStr = '';

  switch (cooldown.type) {
    case 'member': identifierStr = `${member.id}${guild.id}`; break;
    case 'guild':  identifierStr = guild.id; break;
    case 'channel': identifierStr = channel.id; break;
    case 'global': identifierStr = ''; break;
    case 'user':
    default: identifierStr = member.id;
  }

  return `${identifierStr}-${cmdName}`;
};

const throttleCommand = (clientCmd, interaction) => {
  const { data, cooldown } = clientCmd;
  const debugStr = chalk.red('[Cmd Throttle]');
  const activeCommandName = clientCmd.isAlias ? clientCmd.aliasFor : data.name;

  if (cooldown === false) return false;

  const cooldownInMS = parseInt(cooldown.duration * MS_IN_ONE_SECOND, 10);
  if (!cooldownInMS || cooldownInMS < 0) return false;

  const identifierStr = getThrottleId(cooldown, activeCommandName, interaction);

  if (!ThrottleMap.has(identifierStr)) {
    ThrottleMap.set(identifierStr, [Date.now()]);
    setTimeout(() => ThrottleMap.delete(identifierStr), cooldownInMS);
    return false;
  }

  const throttleData = ThrottleMap.get(identifierStr);
  const nonExpired = throttleData.filter(ts => Date.now() < ts + cooldownInMS);

  if (nonExpired.length >= cooldown.usages) {
    const timeLeft = ((nonExpired[0] + cooldownInMS) - Date.now()) / MS_IN_ONE_SECOND;
    return `${emojis.error} {{user}}, you can use **\`/${data.name}\`** again in ${timeLeft.toFixed(1)} seconds`;
  }

  throttleData.push(Date.now());
  return false;
};

// ==================== COMMAND EXECUTION ====================

const isUserComponentCommand = (clientCmd, interaction) => (
  interaction.isButton() ||
  interaction.isStringSelectMenu() ||
  interaction.isMessageComponent()
) && clientCmd.isUserComponent === true;

const hasAccessToComponentCommand = (interaction) => {
  if (!interaction.message?.interaction) return true;
  return interaction.member.id === interaction.message.interaction.user?.id;
};

const checkCommandCanExecute = (client, interaction, clientCmd) => {
  const { member, channel } = interaction;
  const { emojis } = client.container;
  const {
    data, permLevel, enabled = true, clientPerms = [], userPerms = [], nsfw = false
  } = clientCmd;

  if (enabled === false) {
    interaction.reply({ content: `${emojis.error} ${member}, this command is currently disabled.`, ephemeral: true });
    return false;
  }

  if (isNaN(permLevel)) {
    interaction.reply({ content: `${emojis.error} Something went wrong.`, ephemeral: true });
    logger.syserr(`permLevel for ${data.name} is NaN`);
    return false;
  }

  if (member.permLevel < permLevel) {
    interaction.reply({ content: `${emojis.error} ${member}, you don't have permission to use this command.` });
    return false;
  }

  if (clientPerms.length > 0) {
    const missing = hasChannelPerms(client.user.id, channel, clientPerms);
    if (missing !== true) {
      interaction.reply({
        content: `${emojis.error} ${member}, I am missing permissions: ${resolvePermissionArray(missing).join(', ')}`,
        ephemeral: true
      });
      return false;
    }
  }

  if (userPerms.length > 0) {
    const missing = hasChannelPerms(member.user.id, channel, userPerms);
    if (missing !== true) {
      interaction.reply({
        content: `${emojis.error} ${member}, you are missing permissions: ${resolvePermissionArray(missing).join(', ')}`,
        ephemeral: true
      });
      return false;
    }
  }

  if (nsfw === true && channel.nsfw !== true) {
    interaction.reply({ content: `${emojis.error} ${member}, this command can only be used in NSFW channels.`, ephemeral: true });
    return false;
  }

  if (isUserComponentCommand(clientCmd, interaction) && !hasAccessToComponentCommand(interaction)) {
    interaction.reply({ content: `${emojis.error} ${member}, this component is not for you.`, ephemeral: true });
    return false;
  }

  return true;
};

const isAppropriateCommandFilter = (member, command) => (
  member.permLevel >= command.permLevel &&
  command.enabled === true &&
  (command.global === true || member.guild.id === TEST_SERVER_GUILD_ID)
);

/**
 * Główna funkcja obsługująca komendy
 */
const handleCommand = async (interaction) => {
  const { client } = interaction;
  const { commands, contextMenus, emojis } = client.container;

  let commandName = interaction.commandName;
  let clientCmd = commands.get(commandName) || contextMenus.get(commandName);

  // Alias support
  if (!clientCmd && commands.hasAlias?.(commandName)) {
    const aliasFor = commands.getAlias(commandName);
    clientCmd = commands.get(aliasFor);
    if (clientCmd) {
      clientCmd.isAlias = true;
      clientCmd.aliasFor = commandName;
    }
  }

  if (!clientCmd) {
    logger.syserr(`Command "${commandName}" not found`);
    return interaction.reply({ content: `${emojis.error} Command not found.`, ephemeral: true });
  }

  if (!checkCommandCanExecute(client, interaction, clientCmd)) return;

  const throttleResult = throttleCommand(clientCmd, interaction);
  if (throttleResult !== false) {
    return interaction.reply({ content: throttleResult, ephemeral: true });
  }

  try {
    await clientCmd.execute(interaction);
  } catch (error) {
    logger.syserr(`Error executing command: ${commandName}`);
    console.error(error);

    const reply = {
      content: `${emojis.error} There was an error while executing this command.`,
      ephemeral: true
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply);
    } else {
      await interaction.reply(reply);
    }
  }
};

// ==================== EXPORTS ====================

module.exports = {
  clearApplicationCommandData,
  refreshSlashCommandData,
  handleCommand,
  isAppropriateCommandFilter,
  sortCommandsByCategory
};
