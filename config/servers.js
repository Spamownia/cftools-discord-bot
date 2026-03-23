const { clientConfig } = require('../src/util');
const colors = require('../config/colors.json');

module.exports = [
  {
    NAME: process.env.SERVER_NAME || 'Husaria',
    CFTOOLS_SERVER_API_ID: process.env.CFTOOLS_SERVER_API_ID || '69ba997375cb13ab97a0ad34',
    SERVER_IPV4: process.env.SERVER_IP || '147.93.162.60',
    SERVER_PORT: parseInt(process.env.SERVER_PORT) || 3702,
    CFTOOLS_WEBHOOK_CHANNEL_ID: process.env.WEBHOOK_CHANNEL_ID || '1477302685542645991',
    CFTOOLS_WEBHOOK_USER_ID: process.env.WEBHOOK_USER_ID || '1477302685542645991',

    // Command config
    STATISTICS_INCLUDE_ZONES_HEATMAP: true,
    STATISTICS_KEEP_PUPPETEER_BROWSER_OPEN: true,
    STATISTICS_HIDE_PLAYER_NAME_HISTORY: true,
    SERVER_INFO_INCLUDE_MOD_LIST: true,

    // Live Discord > DayZ chat feed
    USE_CHAT_FEED: true,
    CHAT_FEED_CHANNEL_IDS: process.env.CHAT_FEED_CHANNEL_IDS 
      ? process.env.CHAT_FEED_CHANNEL_IDS.split(',') 
      : ['1477302685542645991'],
    CHAT_FEED_REQUIRED_ROLE_IDS: [],
    CHAT_FEED_USE_DISCORD_PREFIX: true,
    CHAT_FEED_USE_DISPLAY_NAME: true,
    CHAT_FEED_MESSAGE_COOLDOWN: 2.5,
    CHAT_FEED_MAX_DISPLAY_NAME_LENGTH: 20,
    CHAT_FEED_DISCORD_TAGS: [
      {
        roleIds: [ clientConfig.permissions.ownerId ],
        displayTag: '[OWNER]',
        color: colors.red
      },
      {
        roleIds: clientConfig.permissions.administratorRoleIds,
        displayTag: '[ADMIN]',
        color: colors.red
      },
      {
        roleIds: clientConfig.permissions.moderatorRoleIds,
        displayTag: '[MOD]',
        color: colors.blue
      },
      {
        roleIds: [],
        displayTag: '[SURVIVOR]',
        enabled: false
      }
    ],

    // Teleport, Watch list, Kill Feed, Leaderboard
    USE_TELEPORT_LOCATIONS: true,
    TELEPORT_LOCATIONS_FILE_NAME: 'chernarus',

    WATCH_LIST_CHANNEL_ID: process.env.WATCH_LIST_CHANNEL_ID || '1477302685542645991',
    WATCH_LIST_NOTIFICATION_ROLE_ID: process.env.WEBHOOK_USER_ID || '1477302685542645991',

    USE_KILL_FEED: true,
    KILL_FEED_DELAY: 5,
    KILL_FEED_CHANNEL_ID: process.env.KILL_FEED_CHANNEL_ID || '1477302685542645991',
    KILL_FEED_MESSAGE_IDENTIFIER: ' Zabity przez ',
    KILL_FEED_REMOVE_IDENTIFIER: false,

    OVERALL_RANKING_STAT: 'KILLS',
    LEADERBOARD_DEFAULT_SORTING_STAT: 'OVERALL',
    LEADERBOARD_PLAYER_LIMIT: 25,
    LEADERBOARD_BLACKLIST: [],
    LEADERBOARD_STATS: ['OVERALL','KILLS','KILL_DEATH_RATIO','LONGEST_KILL','PLAYTIME','LONGEST_SHOT','DEATHS','SUICIDES'],

    AUTO_LB_ENABLED: false,
    AUTO_LB_CHANNEL_ID: process.env.AUTO_LB_CHANNEL_ID || '1477302685542645991',
    AUTO_LB_INTERVAL_IN_MINUTES: 60,
    AUTO_LB_REMOVE_OLD_MESSAGES: true,
    AUTO_LB_PLAYER_LIMIT: 100,
    AUTO_LB_STAT: 'OVERALL'
  }
];
