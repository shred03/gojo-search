const File = require('../models/File');

const escapeMarkdown = (text) => {
  if (!text) return '';
  return text.replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
};

const handleSearch = async (ctx) => {
  const chatId = ctx.chat.id;

  console.log(chatId)
  
  const query = ctx.message.text.replace('/search', '').trim();
  
  if (!query) {
    return ctx.reply('❌ Please provide a search query.\n\nExample: `/search Naruto`');
  }

  try {
    await ctx.sendChatAction('typing');

    const searchRegex = new RegExp(query, 'i');
    const files = await File.find({
      $or: [
        { file_name: { $regex: searchRegex } },
        { caption: { $regex: searchRegex } }
      ]
    })
    .sort({ created_at: -1 })
    .limit(10);

    if (files.length === 0) {
      return ctx.reply(`❌ No files found matching "${query}"`);
    }

    const keyboard = files.map(file => [{
      text: `[SAB KUCH] ${file.file_name}`,
      callback_data: `file_${file._id}`
    }]);

    await ctx.reply(`🔍 Found ${files.length} file(s) matching "${query}". Click to download:`, {
      reply_markup: {
        inline_keyboard: keyboard
      }
    });

  } catch (error) {
    console.error('Search error:', error);
    await ctx.reply('❌ An error occurred while searching. Please try again.');
  }
};

const handleFileCallback = async (ctx) => {
  const fileId = ctx.callbackQuery.data.replace('file_', '');
  
  try {
    await ctx.answerCbQuery();
    await ctx.sendChatAction('upload_document');
    
    const file = await File.findById(fileId);
    
    if (!file) {
      return ctx.reply('❌ File not found or may have been deleted.');
    }

    // const escapedCaption = escapeMarkdown(file.caption);
    const defaultCaption = file.caption;
    const customCaption = "\n\nPowered By: [SAB KUCH]"
    
    if (file.type === 'document') {
      await ctx.sendDocument(file.file_id, {
        caption: defaultCaption + customCaption,
        parse_mode: 'Markdown'
      });
    } else if (file.type === 'video') {
      await ctx.sendVideo(file.file_id, {
        caption: defaultCaption + customCaption,
        parse_mode: 'Markdown'
      });
    } else if (file.type === 'audio') {
      await ctx.sendAudio(file.file_id, {
        caption: defaultCaption + customCaption,
        parse_mode: 'Markdown'
      });
    }

  } catch (error) {
    console.error('File callback error:', error);
    await ctx.reply('❌ Error sending file. Please try again.');
  }
};

module.exports = {
  handleSearch,
  handleFileCallback
};