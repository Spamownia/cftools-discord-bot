const { PermissionsBitField } = require('discord.js');

const config = {
  // Bot activity
  presence: {
    // One of online, idle, invisible, dnd
    status: 'online',
    activities: [
      {
        name: '/help',
        // One of Playing, Streaming, Listening, Watching
        type: 'Listening'
      }
    ]
  },

  // Permission config
  permissions: {
    // Array of Moderator role ids
    moderatorRoleIds: [ '0', '0' ],
    // Array of Administrator role ids
    administratorRoleIds: [ '76561197992396189' ],
    // Bot Owner, highest permission level (5)
    ownerId: '76561197992396189',

    // Bot developers, second to highest permission level (4)
    developers: [ '76561197992396189' ]
  },

  // Additional permissions that are considered required when generating
  // the bot invite link with /invite
  permissionsBase: [
    PermissionsBitField.Flags.ViewChannel,
    PermissionsBitField.Flags.SendMessages,
    PermissionsBitField.Flags.SendMessagesInThreads
  ],

  // The Discord server invite to your Support server
  supportServerInviteLink: 'https://discord.mirasaki.dev'
};

module.exports = config;
