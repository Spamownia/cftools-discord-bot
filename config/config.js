const { PermissionsBitField } = require('discord.js');

const config = {
  // Bot activity
  presence: {
    status: 'online',
    activities: [
      {
        name: '/help',
        type: 'Listening'
      }
    ]
  },

  // Permission config – teraz z env!
  permissions: {
    moderatorRoleIds: process.env.MODERATOR_ROLE_IDS 
      ? process.env.MODERATOR_ROLE_IDS.split(',') 
      : ['0', '0'],
    
    administratorRoleIds: process.env.ADMIN_ROLE_IDS 
      ? process.env.ADMIN_ROLE_IDS.split(',') 
      : [],
    
    ownerId: process.env.BOT_OWNER_ID || '76561197992396189',
    
    developers: process.env.BOT_DEVELOPERS 
      ? process.env.BOT_DEVELOPERS.split(',') 
      : ['76561197992396189']
  },

  permissionsBase: [
    PermissionsBitField.Flags.ViewChannel,
    PermissionsBitField.Flags.SendMessages,
    PermissionsBitField.Flags.SendMessagesInThreads
  ],

  supportServerInviteLink: process.env.SUPPORT_INVITE || 'https://discord.mirasaki.dev'
};

module.exports = config;
