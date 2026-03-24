// Importing from packages
require('dotenv').config({ path: './config/.env' });
const logger = require('@mirasaki/logger');
const chalk = require('chalk');
const {
  Client, GatewayIntentBits, ActivityType, PresenceUpdateStatus
} = require('discord.js');

// Argv
const modeArg = process.argv.find((arg) => arg.startsWith('mode='));

// Local imports
const pkg = require('../package');
const { clearApplicationCommandData, refreshSlashCommandData, handleCommand } = require('./handlers/commands');
const {
  getFiles, titleCase, getRuntime, clientConfig
} = require('./util');
const config = clientConfig;
const path = require('path');
const clientExtensions = require('./client');

// Clear the console in non-production modes & print vanity
process.env.NODE_ENV !== 'production' && console.clear();
const packageIdentifierStr = `${ pkg.name }@${ pkg.version }`;
logger.info(`${ chalk.greenBright.underline(packageIdentifierStr) } by ${ chalk.cyanBright.bold(pkg.author) }`);

// Initializing/declaring our variables
const initTimerStart = process.hrtime.bigint();

// Array of Intents your bot needs
const intents = [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.MessageContent
];

const presenceActivityMap = config.presence.activities.map(
  (act) => ({
    ...act, 
    type: ActivityType[titleCase(act.type)]
  })
);

// Building our discord.js client
const client = new Client({
  intents,
  presence: {
    status: PresenceUpdateStatus[config.presence.status] || PresenceUpdateStatus['online'],
    activities: presenceActivityMap
  }
});

// Destructuring from env
const {
  DISCORD_BOT_TOKEN,
  DEBUG_ENABLED,
  CLEAR_SLASH_COMMAND_API_DATA,
  USE_API,
  // Project directory structure
  CHAT_INPUT_COMMAND_DIR,
  CONTEXT_MENU_COMMAND_DIR,
  AUTO_COMPLETE_INTERACTION_DIR,
  BUTTON_INTERACTION_DIR,
  MODAL_INTERACTION_DIR,
  SELECT_MENU_INTERACTION_DIR
} = process.env;

// Listen for user requested shutdown
process.on('SIGINT', () => {
  logger.info('\nGracefully shutting down from SIGINT (Ctrl-C)');
  process.exit(0);
});

// Global error handling
process.on('unhandledRejection', (reason, promise) => {
  logger.syserr('Encountered unhandledRejection:');
  console.error(reason);
});
process.on('uncaughtException', (err) => {
  logger.syserr('Encountered uncaughtException:');
  console.error(err);
});

// Register our listeners using client.on(fileNameWithoutExtension)
const registerListeners = () => {
  const eventFiles = getFiles('src/listeners', '.js');
  const eventNames = eventFiles.map((filePath) => 
    filePath.slice(filePath.lastIndexOf(path.sep) + 1, filePath.lastIndexOf('.'))
  );

  if (DEBUG_ENABLED === 'true') {
    logger.debug(`Registering ${ eventFiles.length } listeners: ${ eventNames.map((name) => chalk.whiteBright(name)).join(', ') }`);
  }

  for (const filePath of eventFiles) {
    const eventName = filePath.slice(
      filePath.lastIndexOf(path.sep) + 1,
      filePath.lastIndexOf('.')
    );
    const eventFile = require(filePath);
    client.on(eventName, (...received) => eventFile(client, ...received));
  }
};

// Containerizing all our client extensions
client.container = clientExtensions;

// Clear slash commands if enabled in .env
if (CLEAR_SLASH_COMMAND_API_DATA === 'true') {
  clearApplicationCommandData();
}

// Destructure from our client extensions container
const {
  commands,
  contextMenus,
  buttons,
  modals,
  autoCompletes,
  selectMenus
} = client.container;

// === LOADING COMMANDS ===
logger.debug(`Start loading Slash Commands... ("${ CHAT_INPUT_COMMAND_DIR }")`);
for (const filePath of getFiles(CHAT_INPUT_COMMAND_DIR)) {
  try {
    const command = require(filePath);
    command.load(filePath, commands);
    command.loadAliases();
  } catch (err) {
    logger.syserr(`Error loading Slash Command: ${filePath}`);
    console.error(err.stack || err);
  }
}

logger.debug(`Start loading User Context Menu Commands... ("${ CONTEXT_MENU_COMMAND_DIR }/user")`);
for (const filePath of getFiles(`${ CONTEXT_MENU_COMMAND_DIR }/user`)) {
  try {
    const command = require(filePath);
    command.load(filePath, contextMenus, 'user-ctx-menu-');
  } catch (err) {
    logger.syserr(`Error loading User Context Menu: ${filePath}`);
    console.error(err.stack || err);
  }
}

logger.debug(`Start loading Message Context Menu Commands... ("${ CONTEXT_MENU_COMMAND_DIR }/message")`);
for (const filePath of getFiles(`${ CONTEXT_MENU_COMMAND_DIR }/message`)) {
  try {
    const command = require(filePath);
    command.load(filePath, contextMenus, 'message-ctx-menu-');
  } catch (err) {
    logger.syserr(`Error loading Message Context Menu: ${filePath}`);
    console.error(err.stack || err);
  }
}

// Loading other interactions (buttons, modals, etc.)
['buttons', 'modals', 'autocomplete', 'select-menus'].forEach(dir => {
  const dirPath = dir === 'autocomplete' ? AUTO_COMPLETE_INTERACTION_DIR : 
                  dir === 'select-menus' ? SELECT_MENU_INTERACTION_DIR : 
                  eval(`${dir.toUpperCase()}_INTERACTION_DIR`);
  
  logger.debug(`Start loading ${dir}...`);
  for (const filePath of getFiles(dirPath)) {
    try {
      const command = require(filePath);
      command.load(filePath, client.container[dir === 'select-menus' ? 'selectMenus' : dir]);
    } catch (err) {
      logger.syserr(`Error loading ${dir}: ${filePath}`);
      console.error(err.stack || err);
    }
  }
});

// Refresh InteractionCommand data if requested
refreshSlashCommandData(client);

// Registering our listeners
registerListeners();

/**
 * INTERACTION CREATE - GŁÓWNY HANDLER (naprawia "Aplikacja nie reaguje")
 */
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand() && !interaction.isContextMenuCommand()) return;

  try {
    await handleCommand(interaction);
  } catch (err) {
    logger.syserr(`Critical error in interactionCreate for command: ${interaction.commandName}`);
    console.error(err);

    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: `${require('../../config/emojis.json').error || '❌'} Wystąpił poważny błąd.`,
        ephemeral: true
      }).catch(() => {});
    }
  }
});

/**
 * Finished initializing
 */
logger.success(`Finished initializing after ${ getRuntime(initTimerStart).ms } ms`);

// Require our server index file if requested
if (USE_API === 'true') require('./server/');

// Exit before initializing listeners in test mode
if (modeArg && modeArg.endsWith('testing')) process.exit(1);

// Logging in to our client
client.login(DISCORD_BOT_TOKEN);

// Keep-alive for Render
const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;   // Render często używa 10000

app.get('/health', (req, res) => {
  res.status(200).send(`Bot żyje! Uptime: ${Math.floor(process.uptime() / 60)} minut`);
});

app.listen(PORT, () => {
  console.log(`[KEEP-ALIVE] Nasłuchuję na porcie ${PORT} – Render szczęśliwy 🚀`);
});
