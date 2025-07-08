const File = require('../models/File');

const escapeMarkdown = (text) => {
  if (!text) return '';
  return text.replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
};

const ITEMS_PER_PAGE = 10;

const handleSearch = async (ctx) => {
  const chatType = ctx.chat.type;
  if (chatType !== 'private') {
    return ctx.reply('🔒 Search command is only available in private chat.');
  }
  const query = ctx.message.text.replace('/search', '').trim();
  
  if (!query) {
    return ctx.reply('❌ Please provide a search query.\n\nExample: `/search Kalki 2898AD`');
  }

  try {
    await ctx.sendChatAction('typing');

    const searchRegex = new RegExp(query, 'i');
    const totalFiles = await File.countDocuments({
      $or: [
        { file_name: { $regex: searchRegex } },
        { caption: { $regex: searchRegex } }
      ]
    });

    if (totalFiles === 0) {
      return ctx.reply(`❌ No files found matching "${query}"`);
    }

    // Get first page of results
    const files = await File.find({
      $or: [
        { file_name: { $regex: searchRegex } },
        { caption: { $regex: searchRegex } }
      ]
    })
    .sort({ created_at: -1 })
    .limit(ITEMS_PER_PAGE);

    const totalPages = Math.ceil(totalFiles / ITEMS_PER_PAGE);
    const currentPage = 1;

    const keyboard = createSearchKeyboard(files, query, currentPage, totalPages);
    
    const resultText = `🔍 Found ${totalFiles} file(s) matching "${query}"\n📄 Page ${currentPage} of ${totalPages}\n\nClick to download:`;

    await ctx.reply(resultText, {
      reply_markup: {
        inline_keyboard: keyboard
      }
    });

  } catch (error) {
    console.error('Search error:', error);
    await ctx.reply('❌ An error occurred while searching. Please try again.');
  }
};

const createSearchKeyboard = (files, query, currentPage, totalPages) => {
  // File buttons
  const fileButtons = files.map(file => [{
    text: `[SAB KUCH] ${file.file_name}`,
    callback_data: `file_${file._id}`
  }]);

  // Navigation buttons
  const navigationButtons = [];
  
  if (totalPages > 1) {
    const navRow = [];
    
    // Previous button
    if (currentPage > 1) {
      navRow.push({
        text: '⬅️ Previous',
        callback_data: `search_${encodeURIComponent(query)}_${currentPage - 1}`
      });
    }
    
    // Page indicator
    navRow.push({
      text: `${currentPage}/${totalPages}`,
      callback_data: 'page_info'
    });
    
    // Next button
    if (currentPage < totalPages) {
      navRow.push({
        text: 'Next ➡️',
        callback_data: `search_${encodeURIComponent(query)}_${currentPage + 1}`
      });
    }
    
    navigationButtons.push(navRow);
  }

  return [...fileButtons, ...navigationButtons];
};

const handleSearchPagination = async (ctx) => {
  const callbackData = ctx.callbackQuery.data;
  const [, encodedQuery, pageStr] = callbackData.split('_');
  const query = decodeURIComponent(encodedQuery);
  const page = parseInt(pageStr);

  try {
    await ctx.answerCbQuery();
    await ctx.sendChatAction('typing');

    const searchRegex = new RegExp(query, 'i');
    const totalFiles = await File.countDocuments({
      $or: [
        { file_name: { $regex: searchRegex } },
        { caption: { $regex: searchRegex } }
      ]
    });

    const totalPages = Math.ceil(totalFiles / ITEMS_PER_PAGE);
    
    // Validate page number
    if (page < 1 || page > totalPages) {
      return ctx.answerCbQuery('❌ Invalid page number');
    }

    const skip = (page - 1) * ITEMS_PER_PAGE;
    const files = await File.find({
      $or: [
        { file_name: { $regex: searchRegex } },
        { caption: { $regex: searchRegex } }
      ]
    })
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(ITEMS_PER_PAGE);

    const keyboard = createSearchKeyboard(files, query, page, totalPages);
    
    const resultText = `🔍 Found ${totalFiles} file(s) matching "${query}"\n📄 Page ${page} of ${totalPages}\n\nClick to download:`;

    await ctx.editMessageText(resultText, {
      reply_markup: {
        inline_keyboard: keyboard
      }
    });

  } catch (error) {
    console.error('Search pagination error:', error);
    await ctx.answerCbQuery('❌ Error loading page. Please try again.');
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

    const defaultCaption = file.caption;
    const customCaption = "\n\nPowered By: [SAB KUCH]";
    
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

const handlePageInfo = async (ctx) => {
  await ctx.answerCbQuery('📄 Current page information', { show_alert: false });
};

module.exports = {
  handleSearch,
  handleFileCallback,
  handleSearchPagination,
  handlePageInfo
};