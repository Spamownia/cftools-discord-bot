// Importing from packages
require('dotenv').config({ path: './config/.env' });
const logger = require('@mirasaki/logger');
const chalk = require('chalk');
const { Client, GatewayIntentBits, ActivityType, PresenceUpdateStatus } = require('discord.js');

// Local imports
const pkg = require('../package');
const { clearApplicationCommandData, refreshSlashCommandData, handleCommand } = require('./handlers/commands');
const { getFiles, titleCase, getRuntime, clientConfig } = require('./util');
const clientExtensions = require('./client');

const config = clientConfig;
const path = require('path');

const modeArg = process.argv.find((arg) => arg.startsWith('mode='));

// Clear console + vanity
process.env.NODE_ENV !== 'production' && console.clear();
logger.info(`${chalk.greenBright.underline(`${pkg.name}@${pkg.version}`)} by ${chalk.cyanBright.bold(pkg.author)}`);

const initTimerStart = process.hrtime.bigint();

const intents = [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.MessageContent
];

const presenceActivityMap = config.presence.activities.map(act => ({
  ...act,
  type: ActivityType[titleCase(act.type)]
}));

const client = new Client({
  intents,
  presence: {
    status: PresenceUpdateStatus[config.presence.status] || PresenceUpdateStatus.online,
    activities: presenceActivityMap
  }
});

const {
  DISCORD_BOT_TOKEN,
  DEBUG_ENABLED,
  CLEAR_SLASH_COMMAND_API_DATA,
  USE_API,
  CHAT_INPUT_COMMAND_DIR,
  CONTEXT_MENU_COMMAND_DIR,
  AUTO_COMPLETE_INTERACTION_DIR,
  BUTTON_INTERACTION_DIR,
  MODAL_INTERACTION_DIR,
  SELECT_MENU_INTERACTION_DIR
} = process.env;

// Global error handling
process.on('unhandledRejection', (reason) => logger.syserr('Unhandled Rejection:', reason));
process.on('uncaughtException', (err) => logger.syserr('Uncaught Exception:', err));

// Register listeners from /src/listeners
const registerListeners = () => {
  const eventFiles = getFiles('src/listeners', '.js');
  for (const filePath of eventFiles) {
    const eventName = filePath.slice(filePath.lastIndexOf(path.sep) + 1, filePath.lastIndexOf('.'));
    const eventFile = require(filePath);
    client.on(eventName, (...args) => eventFile(client, ...args));
  }
};

// Container
client.container = clientExtensions;

// Clear commands if enabled
if (CLEAR_SLASH_COMMAND_API_DATA === 'true') {
  clearApplicationCommandData();
}

// Load Slash Commands
logger.debug(`Start loading Slash Commands... ("${CHAT_INPUT_COMMAND_DIR}")`);
for (const filePath of getFiles(CHAT_INPUT_COMMAND_DIR)) {
  try {
    const cmd = require(filePath);
    cmd.load(filePath, client.container.commands);
    cmd.loadAliases();
  } catch (err) {
    logger.syserr(`Error loading Slash Command: ${filePath}`);
    console.error(err);
  }
}

// Load Context Menus
for (const type of ['user', 'message']) {
  logger.debug(`Start loading ${type} Context Menu Commands...`);
  for (const filePath of getFiles(`${CONTEXT_MENU_COMMAND_DIR}/${type}`)) {
    try {
      const cmd = require(filePath);
      cmd.load(filePath, client.container.contextMenus, `${type}-ctx-menu-`);
    } catch (err) {
      logger.syserr(`Error loading ${type} Context Menu: ${filePath}`);
      console.error(err);
    }
  }
}

// Load other interactions
const interactionTypes = {
  buttons: BUTTON_INTERACTION_DIR,
  modals: MODAL_INTERACTION_DIR,
  autoCompletes: AUTO_COMPLETE_INTERACTION_DIR,
  selectMenus: SELECT_MENU_INTERACTION_DIR
};

Object.entries(interactionTypes).forEach(([name, dir]) => {
  logger.debug(`Start loading ${name}... ("${dir}")`);
  for (const filePath of getFiles(dir)) {
    try {
      const cmd = require(filePath);
      cmd.load(filePath, client.container[name]);
    } catch (err) {
      logger.syserr(`Error loading ${name}: ${filePath}`);
      console.error(err);
    }
  }
});

// Refresh slash commands
refreshSlashCommandData(client);

// Register listeners
registerListeners();

/* ====================== INTERACTION HANDLER ====================== */
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand() && !interaction.isContextMenuCommand()) return;

  logger.debug(`[INTERACTION] Received ${interaction.commandName}`);

  try {
    await handleCommand(interaction);
  } catch (err) {
    logger.syserr(`Critical error in interaction ${interaction.commandName}`);
    console.error(err);

    if (!interaction.replied && !interaction.deferred) {
      interaction.reply({ content: '❌ Wystąpił krytyczny błąd.', ephemeral: true }).catch(() => {});
    }
  }
});

/* ====================== FINISH ====================== */
logger.success(`Finished initializing after ${getRuntime(initTimerStart).ms} ms`);

if (USE_API === 'true') require('./server/');
if (modeArg && modeArg.endsWith('testing')) process.exit(1);

client.login(DISCORD_BOT_TOKEN);

// Keep-alive for Render
const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

app.get('/health', (req, res) => res.status(200).send(`Bot żyje! Uptime: ${Math.floor(process.uptime()/60)} min`));
app.listen(PORT, () => console.log(`[KEEP-ALIVE] Nasłuchuję na porcie ${PORT}`));
