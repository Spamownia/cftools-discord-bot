// ================================================
// src/index.js - FINAL VERSION (z obsługą select menu)
// ================================================
require('dotenv').config({ path: './config/.env' });

const logger = require('@mirasaki/logger');
const chalk = require('chalk');
const { Client, GatewayIntentBits, ActivityType, PresenceUpdateStatus } = require('discord.js');

const pkg = require('../package');
const { clearApplicationCommandData, refreshSlashCommandData, handleCommand } = require('./handlers/commands');
const { getFiles, titleCase, getRuntime, clientConfig } = require('./util');
const clientExtensions = require('./client');

const config = clientConfig;
const path = require('path');

const modeArg = process.argv.find(arg => arg.startsWith('mode='));

process.env.NODE_ENV !== 'production' && console.clear();

logger.info(`${chalk.greenBright.underline(`${pkg.name}@${pkg.version}`)} by ${chalk.cyanBright.bold(pkg.author)}`);

const initTimerStart = process.hrtime.bigint();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  presence: {
    status: PresenceUpdateStatus[config.presence.status] || PresenceUpdateStatus.online,
    activities: config.presence.activities.map(act => ({
      ...act,
      type: ActivityType[titleCase(act.type)]
    }))
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
process.on('unhandledRejection', reason => logger.syserr('Unhandled Rejection:', reason));
process.on('uncaughtException', err => logger.syserr('Uncaught Exception:', err));

// Ładowanie rozszerzeń klienta
client.container = clientExtensions;

if (CLEAR_SLASH_COMMAND_API_DATA === 'true') {
  clearApplicationCommandData();
}

// Ładowanie Slash Commands
logger.debug(`Start loading Slash Commands... ("${CHAT_INPUT_COMMAND_DIR}")`);
for (const file of getFiles(CHAT_INPUT_COMMAND_DIR)) {
  try {
    const cmd = require(file);
    cmd.load(file, client.container.commands);
    cmd.loadAliases();
  } catch (e) {
    logger.syserr(`Error loading command: ${file}`);
    console.error(e);
  }
}

// Ładowanie Context Menus
['user', 'message'].forEach(type => {
  logger.debug(`Start loading ${type} Context Menu Commands...`);
  for (const file of getFiles(`${CONTEXT_MENU_COMMAND_DIR}/${type}`)) {
    try {
      const cmd = require(file);
      cmd.load(file, client.container.contextMenus, `${type}-ctx-menu-`);
    } catch (e) {
      logger.syserr(`Error loading ${type} context menu: ${file}`);
      console.error(e);
    }
  }
});

// Ładowanie reszty interakcji (buttons, modals, autocomplete, selectMenus)
const dirs = {
  buttons: BUTTON_INTERACTION_DIR,
  modals: MODAL_INTERACTION_DIR,
  autoCompletes: AUTO_COMPLETE_INTERACTION_DIR,
  selectMenus: SELECT_MENU_INTERACTION_DIR
};

Object.entries(dirs).forEach(([name, dir]) => {
  logger.debug(`Start loading ${name}... ("${dir}")`);
  for (const file of getFiles(dir)) {
    try {
      const item = require(file);
      item.load(file, client.container[name]);
    } catch (e) {
      logger.syserr(`Error loading ${name}: ${file}`);
      console.error(e);
    }
  }
});

refreshSlashCommandData(client);

// Register other listeners (except interactionCreate)
const registerListeners = () => {
  const files = getFiles('src/listeners', '.js').filter(f => !f.includes('interactionCreate'));
  for (const file of files) {
    const name = file.slice(file.lastIndexOf(path.sep) + 1, file.lastIndexOf('.'));
    const mod = require(file);
    client.on(name, (...args) => mod(client, ...args));
  }
};
registerListeners();

// === GŁÓWNY HANDLER INTERAKCJI ===
client.on('interactionCreate', async (interaction) => {
  try {
    // Slash Commands + Context Menus
    if (interaction.isChatInputCommand() || interaction.isContextMenuCommand()) {
      logger.debug(`[INTERACTION] Otrzymano komendę: ${interaction.commandName}`);
      return await handleCommand(interaction);
    }

    // Select Menus (to naprawia "Aplikacja nie reaguje" przy /help)
    if (interaction.isStringSelectMenu()) {
      const { handleSelectMenu } = require('./handlers/selectMenuHandler');
      return await handleSelectMenu(interaction);
    }

    // Możesz tu dodać później buttons i modals jeśli będziesz ich potrzebował

  } catch (err) {
    logger.syserr(`[INTERACTION] Błąd krytyczny przy interakcji`);
    console.error(err);

    if (!interaction.replied && !interaction.deferred) {
      interaction.reply({
        content: '❌ Wystąpił krytyczny błąd bota.',
        ephemeral: true
      }).catch(() => {});
    }
  }
});

// Finish initialization
logger.success(`Finished initializing after ${getRuntime(initTimerStart).ms} ms`);

if (USE_API === 'true') require('./server/');

if (modeArg && modeArg.endsWith('testing')) process.exit(1);

client.login(DISCORD_BOT_TOKEN);

// Keep-alive (dla Render)
const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

app.get('/health', (req, res) => 
  res.status(200).send(`Bot żyje! Uptime: ${Math.floor(process.uptime()/60)} min`)
);

app.listen(PORT, () => 
  console.log(`[KEEP-ALIVE] Nasłuchuję na porcie ${PORT} – Render szczęśliwy 🚀`)
);
