require('dotenv').config();
const { Telegraf } = require('telegraf');
const connectDB = require('./config/database');
const { handleDocument, handleVideo, handleAudio } = require('./handlers/filehandlers');
const { handleSearch, handleFileCallback, handleSearchPagination, handlePageInfo } = require('./handlers/searchhandler');

if (!process.env.BOT_TOKEN) {
  console.error('❌ BOT_TOKEN is required in .env file');
  process.exit(1);
}

if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI is required in .env file');
  process.exit(1);
}

const AUTHORIZED_CHATS = [];

if (process.env.AUTHORIZED_CHATS) {
  const envChats = process.env.AUTHORIZED_CHATS.split(',').map(id => id.trim());
  AUTHORIZED_CHATS.push(...envChats);
}

const bot = new Telegraf(process.env.BOT_TOKEN);

connectDB();

const isAuthorizedChat = (chatId) => {
  const chatIdStr = chatId.toString();
  return AUTHORIZED_CHATS.includes(chatIdStr);
};

bot.use(async (ctx, next) => {
  const chatType = ctx.chat?.type;
  const message = ctx.message || ctx.channelPost;
  
  if (message) {
    const messageKeys = Object.keys(message);
    const fileTypes = ['document', 'video', 'audio'];
    const messageType = messageKeys.find(key => fileTypes.includes(key)) || 
                       (message.text ? 'text' : 'unknown');
    
    console.log(`📨 Message from ${chatType} chat (ID: ${ctx.chat.id}): ${messageType}`);
    
    if (chatType === 'channel' || chatType === 'group' || chatType === 'supergroup') {
      console.log(`🔍 ${chatType} message keys: ${messageKeys.join(', ')}`);
      
      if (!isAuthorizedChat(ctx.chat.id)) {
        console.log(`🚫 Unauthorized ${chatType}: ${ctx.chat.id}`);
        return; 
      }
      
      console.log(`✅ Authorized ${chatType}: ${ctx.chat.id}`);
      
      if (fileTypes.some(type => message[type])) {
        const fileType = fileTypes.find(type => message[type]);
        console.log(`📁 File detected: ${fileType}`);
      }
    }
  }
  
  return next();
});

bot.start((ctx) => {
  const welcomeMessage = `
🤖 *Welcome to File Search Bot!*

This bot automatically stores files from authorized channels and groups, allowing you to search them.

*Commands:*
• \`/search <query>\` - Search for files (private chat only)
• \`/help\` - Show this help message
• \`/stats\` - Show bot statistics
• \`/chats\` - Show authorized channels/groups (admin only)

*How it works:*
1. Add this bot as admin to your authorized channel/group
2. Forward documents, videos, or audio files to the channel/group
3. Use \`/search\` in private chat to find files

*Example:*
\`/search Naruto\`
  `;
  
  ctx.reply(welcomeMessage, { parse_mode: 'Markdown' });
});

bot.help((ctx) => {
  ctx.reply(`
🆘 *Bot Help*

*Search Command:*
\`/search <query>\` - Search for files by name or caption

*Examples:*
• \`/search Naruto\` - Find files with "Naruto" in name or caption
• \`/search tutorial\` - Find files with "tutorial" in name or caption

*Notes:*
• Search is case-insensitive
• Returns maximum 10 results as buttons
• Only works in private chat
• Supports partial matches
• Click button to download file
• Only files from authorized channels/groups are stored
  `, { parse_mode: 'Markdown' });
});

bot.command('chats', (ctx) => {
  // Only allow in private chat for security
  if (ctx.chat.type !== 'private') {
    return ctx.reply('🔒 This command is only available in private chat.');
  }

  if (AUTHORIZED_CHATS.length === 0) {
    return ctx.reply('❌ No authorized channels/groups configured.');
  }

  const chatList = AUTHORIZED_CHATS.map((id, index) => `${index + 1}. \`${id}\``).join('\n');
  
  ctx.reply(`🔐 *Authorized Channels/Groups:*\n\n${chatList}`, { parse_mode: 'Markdown' });
});

bot.command('stats', async (ctx) => {
  if (ctx.chat.type !== 'private') {
    return ctx.reply('🔒 Stats command is only available in private chat.');
  }

  try {
    const File = require('./models/File');
    
    const totalFiles = await File.countDocuments();
    const documentCount = await File.countDocuments({ type: 'document' });
    const videoCount = await File.countDocuments({ type: 'video' });
    const audioCount = await File.countDocuments({ type: 'audio' });
    
    const recentFiles = await File.find()
      .sort({ created_at: -1 })
      .limit(1);
    
    const lastAdded = recentFiles.length > 0 
      ? recentFiles[0].created_at.toLocaleString()
      : 'No files yet';

    const statsMessage = `
📊 *Bot Statistics*

📁 Total Files: ${totalFiles}
📄 Documents: ${documentCount}
🎬 Videos: ${videoCount}
🎵 Audio: ${audioCount}

📅 Last file added: ${lastAdded}
🔐 Authorized Chats: ${AUTHORIZED_CHATS.length}
    `;

    ctx.reply(statsMessage, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Stats error:', error);
    ctx.reply('❌ Error fetching statistics.');
  }
});

bot.on('document', async (ctx) => {
  const message = ctx.message || ctx.channelPost;
  const chatType = ctx.chat?.type;
  
  console.log(`📄 Document received from ${chatType} chat`);
  
  if (chatType === 'channel' || chatType === 'group' || chatType === 'supergroup') {
    // Check if chat is authorized
    if (!isAuthorizedChat(ctx.chat.id)) {
      console.log(`🚫 Document from unauthorized ${chatType}: ${ctx.chat.id}`);
      return;
    }
    
    const chatCtx = {
      message: message,
      chat: ctx.chat
    };
    await handleDocument(chatCtx);
  }
});

bot.on('video', async (ctx) => {
  const message = ctx.message || ctx.channelPost;
  const chatType = ctx.chat?.type;
  
  console.log(`🎬 Video received from ${chatType} chat`);
  
  if (chatType === 'channel' || chatType === 'group' || chatType === 'supergroup') {
    // Check if chat is authorized
    if (!isAuthorizedChat(ctx.chat.id)) {
      console.log(`🚫 Video from unauthorized ${chatType}: ${ctx.chat.id}`);
      return;
    }
    
    const chatCtx = {
      message: message,
      chat: ctx.chat
    };
    await handleVideo(chatCtx);
  }
});

bot.on('audio', async (ctx) => {
  const message = ctx.message || ctx.channelPost;
  const chatType = ctx.chat?.type;
  
  console.log(`🎵 Audio received from ${chatType} chat`);
  
  if (chatType === 'channel' || chatType === 'group' || chatType === 'supergroup') {
    // Check if chat is authorized
    if (!isAuthorizedChat(ctx.chat.id)) {
      console.log(`🚫 Audio from unauthorized ${chatType}: ${ctx.chat.id}`);
      return;
    }
    
    const chatCtx = {
      message: message,
      chat: ctx.chat
    };
    await handleAudio(chatCtx);
  }
});

bot.on('channel_post', async (ctx) => {
  const message = ctx.channelPost;
  const chatType = ctx.chat?.type;
  
  console.log(`📺 Channel post received from channel: ${ctx.chat.id}`);
  
  // Check if channel is authorized
  if (!isAuthorizedChat(ctx.chat.id)) {
    console.log(`🚫 Channel post from unauthorized channel: ${ctx.chat.id}`);
    return;
  }
  
  if (message.document) {
    console.log(`📄 Channel document: ${message.document.file_name}`);
    const chatCtx = {
      message: message,
      chat: ctx.chat
    };
    await handleDocument(chatCtx);
  } else if (message.video) {
    console.log(`🎬 Channel video: ${message.video.file_name || 'Unknown'}`);
    const chatCtx = {
      message: message,
      chat: ctx.chat
    };
    await handleVideo(chatCtx);
  } else if (message.audio) {
    console.log(`🎵 Channel audio: ${message.audio.file_name || message.audio.title || 'Unknown'}`);
    const chatCtx = {
      message: message,
      chat: ctx.chat
    };
    await handleAudio(chatCtx);
  }
});

bot.command('search', handleSearch);

bot.on('callback_query', (ctx) => {
  const data = ctx.callbackQuery.data;
  
  if (data.startsWith('file_')) {
    handleFileCallback(ctx);
  } else if (data.startsWith('search_')) {
    handleSearchPagination(ctx);
  } else if (data === 'page_info') {
    handlePageInfo(ctx);
  }
});

bot.catch((err, ctx) => {
  console.error('Bot error:', err);
  ctx.reply('❌ An unexpected error occurred. Please try again.');
});

process.once('SIGINT', () => {
  console.log('🛑 Stopping bot...');
  bot.stop('SIGINT');
});

process.once('SIGTERM', () => {
  console.log('🛑 Stopping bot...');
  bot.stop('SIGTERM');
});

bot.launch()
  .then(() => {
    console.log('🤖 Bot started successfully!');
    console.log('📡 Listening for messages...');
    console.log(`🔐 Authorized chats: ${AUTHORIZED_CHATS.length > 0 ? AUTHORIZED_CHATS.join(', ') : 'None configured'}`);
  })
  .catch((error) => {
    console.error('❌ Failed to start bot:', error);
    process.exit(1);
  });

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));