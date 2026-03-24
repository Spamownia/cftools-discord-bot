const cftSDK = require('cftools-sdk');
const emojis = require('../../config/emojis.json');
const { existsSync, readFileSync } = require('fs');
const logger = require('@mirasaki/logger');

const APPLICATION_JSON = 'application/json';

// ==================== SUPER DEBUG NA POCZĄTKU ====================
logger.debug('=== [CFTCLIENT] INICJALIZACJA MODUŁU ===');
logger.debug(`CFTOOLS_API_APPLICATION_ID istnieje: ${!!process.env.CFTOOLS_API_APPLICATION_ID}`);
logger.debug(`CFTOOLS_API_SECRET istnieje: ${!!process.env.CFTOOLS_API_SECRET}`);
logger.debug(`CFTOOLS_API_KEY istnieje: ${!!process.env.CFTOOLS_API_KEY}`);
logger.debug(`Dostępne zmienne CFTOOLS: ${Object.keys(process.env).filter(k => k.includes('CFTOOLS')).join(', ')}`);
// ============================================================

// Destructure our environmental variables
const { 
  CFTOOLS_API_SECRET, 
  CFTOOLS_API_APPLICATION_ID,
  CFTOOLS_API_KEY 
} = process.env;

// Getting our servers config
const serverConfig = require('../../config/servers.js');

logger.debug(`[CFTCLIENT] Załadowano konfigurację serwerów – znaleziono ${serverConfig.length} serwerów`);
serverConfig.forEach((cfg, i) => {
  logger.debug(`[CFTCLIENT] Serwer ${i+1}: ${cfg.NAME} | API_ID: ${cfg.CFTOOLS_SERVER_API_ID || 'BRAK'}`);
});

// Creating a unique client for every entry
logger.debug('[CFTCLIENT] Tworzę CFToolsClientBuilder...');
const cftClient = new cftSDK.CFToolsClientBuilder()
  .withCache()
  .withCredentials(
    CFTOOLS_API_APPLICATION_ID || CFTOOLS_API_KEY, 
    CFTOOLS_API_SECRET
  )
  .build();

logger.debug('[CFTCLIENT] CFTools client zbudowany pomyślnie');

// ====================== SERVER OPTION ======================
const serverConfigCommandOptionIdentifier = 'server';
const serverConfigCommandChoices = serverConfig
  .map(({ CFTOOLS_SERVER_API_ID, NAME }) => ({
    name: NAME,
    value: CFTOOLS_SERVER_API_ID
  }));

const serverConfigCommandOption = {
  name: serverConfigCommandOptionIdentifier,
  description: 'Which server to display',
  type: 3, // String
  required: false,
  choices: serverConfigCommandChoices
};

const requiredServerConfigCommandOption = {
  ...serverConfigCommandOption,
  required: true
};

// ====================== POPRAWIONA FUNKCJA Z DEBUGIEM ======================
const getServerConfigCommandOptionValue = (interaction) => {
  const { options } = interaction;
  const chosenValue = options.getString('server') || options.getString(serverConfigCommandOptionIdentifier);

  logger.debug(`[CFTCLIENT] getServerConfigCommandOptionValue → wybrano: "${chosenValue}"`);

  let serverCfg;

  if (!chosenValue) {
    serverCfg = serverConfig[0];
    logger.debug(`[CFTCLIENT] Nie wybrano serwera → biorę pierwszy z listy: ${serverCfg?.NAME}`);
  } else {
    serverCfg = serverConfig.find(cfg => 
      cfg.CFTOOLS_SERVER_API_ID === chosenValue || 
      cfg.NAME.toLowerCase() === chosenValue.toLowerCase()
    );
  }

  if (!serverCfg) {
    logger.syserr(`[CFTCLIENT] NIE ZNALEZIONO serwera dla wartości: ${chosenValue}`);
    logger.debug(`Dostępne serwery: ${serverConfig.map(s => `${s.NAME} (${s.CFTOOLS_SERVER_API_ID})`).join(' | ')}`);
    throw new Error(`Nie znaleziono konfiguracji serwera: ${chosenValue || 'pierwszy z listy'}`);
  }

  logger.debug(`[CFTCLIENT] WYBRANO SERWER: ${serverCfg.NAME} | API_ID: ${serverCfg.CFTOOLS_SERVER_API_ID}`);
  logger.debug(`[CFTCLIENT] Pełna konfiguracja serwera:\n${JSON.stringify(serverCfg, null, 2)}`);

  return serverCfg;
};

// ====================== PLAYER SESSION ======================
const playerSessionOptionIdentifier = 'player';
const playerSessionOption = {
  name: playerSessionOptionIdentifier,
  description: 'The in-game player',
  type: 3,
  required: false,
  autocomplete: true
};

const requiredPlayerSessionOption = { ...playerSessionOption, required: true };

const getPlayerSessionOptionValue = async (interaction, id = playerSessionOptionIdentifier) => {
  const serverCfg = getServerConfigCommandOptionValue(interaction);
  const sessionId = interaction.options.getString(id);

  logger.debug(`[CFTCLIENT] Szukam gracza o sessionId: ${sessionId} na serwerze ${serverCfg.NAME}`);

  const sessions = await cftClient.listGameSessions({ 
    serverApiId: cftSDK.ServerApiId.of(serverCfg.CFTOOLS_SERVER_API_ID) 
  });

  const targetSession = sessions.find(e => e.id === sessionId);

  logger.debug(`[CFTCLIENT] Znaleziono sesję gracza: ${targetSession ? targetSession.playerName : 'NIE ZNALEZIONO'}`);

  return targetSession;
};

// ====================== TELEPORT & INNE (bez zmian + lekkie debugi) ======================
const getTeleportLocations = (serverCfg) => {
  // ... (pozostawiam oryginalną funkcję – możesz dodać logger.debug jeśli chcesz)
  // Dla teraz zostawiam bez zmian
  const tpLocationsFilePath = `./config/teleport-locations/${serverCfg.TELEPORT_LOCATIONS_FILE_NAME}.json`;
  if (!existsSync(tpLocationsFilePath)) {
    logger.syserr(`Teleport locations file not found: ${tpLocationsFilePath}`);
    return null;
  }
  try {
    const data = JSON.parse(readFileSync(tpLocationsFilePath, 'utf8'));
    return Array.isArray(data) ? data : null;
  } catch (err) {
    logger.syserr('Error reading teleport locations file:');
    logger.printErr(err);
    return null;
  }
};

// handleCFToolsError z lepszym debugiem
const handleCFToolsError = (interaction, err, followUpInstead = false) => {
  logger.syserr(`[CFTCLIENT] CFTools API Error: ${err.message}`);
  console.error(err);

  const str = `${emojis.error} Wystąpił błąd CFTools: ${err.message}`;

  if (followUpInstead) interaction.followUp(str);
  else interaction.editReply(str);
};

// ====================== EXPORTY ======================
module.exports = {
  cftClient,
  serverConfigCommandOption,
  requiredServerConfigCommandOption,
  getServerConfigCommandOptionValue,
  playerSessionOption,
  requiredPlayerSessionOption,
  getPlayerSessionOptionValue,
  getTeleportLocations,
  handleCFToolsError,
  // Dodaj inne funkcje, które używasz w komendach (np. broadcastMessage, shutdownServer itd.)
  // Jeśli ich nie ma – dodaj je później
};
