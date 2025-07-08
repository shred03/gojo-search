const File = require('../models/File');

// Get authorized chats from environment or config
const getAuthorizedChats = () => {
  const AUTHORIZED_CHATS = [];
  
  if (process.env.AUTHORIZED_CHATS) {
    const envChats = process.env.AUTHORIZED_CHATS.split(',').map(id => id.trim());
    AUTHORIZED_CHATS.push(...envChats);
  }
  
  return AUTHORIZED_CHATS;
};

const isAuthorizedChat = (chatId) => {
  const authorizedChats = getAuthorizedChats();
  const chatIdStr = chatId.toString();
  return authorizedChats.includes(chatIdStr);
};

// Handle document files
const handleDocument = async (ctx) => {
  const message = ctx.message || ctx.channelPost;
  const { document, caption, message_id } = message;
  const chat = ctx.chat;
  
  // Additional authorization check
  if (!isAuthorizedChat(chat.id)) {
    console.log(`🚫 Unauthorized chat attempt - Document: ${chat.id}`);
    return;
  }
  
  console.log(`📄 Processing document: ${document.file_name || 'Unknown'} from authorized chat: ${chat.id}`);
  
  try {
    const fileData = {
      file_id: document.file_id,
      file_name: document.file_name || 'Unknown Document',
      caption: caption || '',
      type: 'document',
      file_size: document.file_size || 0,
      mime_type: document.mime_type || '',
      channel_id: chat.id.toString(),
      message_id: message_id,
      channel_title: chat.title || 'Unknown Chat',
      chat_type: chat.type || 'unknown'
    };

    // Check if file already exists
    const existingFile = await File.findOne({ file_id: document.file_id });
    if (existingFile) {
      console.log(`📄 Document already exists: ${document.file_name}`);
      return;
    }

    const file = new File(fileData);
    await file.save();
    console.log(`✅ Document saved: ${document.file_name} from ${chat.type}: ${chat.title || chat.id}`);
  } catch (error) {
    console.error('❌ Error saving document:', error);
  }
};

// Handle video files
const handleVideo = async (ctx) => {
  const message = ctx.message || ctx.channelPost;
  const { video, caption, message_id } = message;
  const chat = ctx.chat;
  
  // Additional authorization check
  if (!isAuthorizedChat(chat.id)) {
    console.log(`🚫 Unauthorized chat attempt - Video: ${chat.id}`);
    return;
  }
  
  console.log(`🎬 Processing video: ${video.file_name || 'Unknown'} from authorized chat: ${chat.id}`);
  
  try {
    const fileData = {
      file_id: video.file_id,
      file_name: video.file_name || `Video_${Date.now()}.mp4`,
      caption: caption || '',
      type: 'video',
      file_size: video.file_size || 0,
      mime_type: video.mime_type || 'video/mp4',
      channel_id: chat.id.toString(),
      message_id: message_id,
      channel_title: chat.title || 'Unknown Chat',
      chat_type: chat.type || 'unknown'
    };

    // Check if file already exists
    const existingFile = await File.findOne({ file_id: video.file_id });
    if (existingFile) {
      console.log(`🎬 Video already exists: ${video.file_name || 'Unknown Video'}`);
      return;
    }

    const file = new File(fileData);
    await file.save();
    console.log(`✅ Video saved: ${video.file_name || 'Unknown Video'} from ${chat.type}: ${chat.title || chat.id}`);
  } catch (error) {
    console.error('❌ Error saving video:', error);
  }
};

const handleAudio = async (ctx) => {
  const message = ctx.message || ctx.channelPost;
  const { audio, caption, message_id } = message;
  const chat = ctx.chat;
  
  // Additional authorization check
  if (!isAuthorizedChat(chat.id)) {
    console.log(`🚫 Unauthorized chat attempt - Audio: ${chat.id}`);
    return;
  }
  
  console.log(`🎵 Processing audio: ${audio.file_name || audio.title || 'Unknown'} from authorized chat: ${chat.id}`);
  
  try {
    const fileData = {
      file_id: audio.file_id,
      file_name: audio.file_name || audio.title || `Audio_${Date.now()}.mp3`,
      caption: caption || '',
      type: 'audio',
      file_size: audio.file_size || 0,
      mime_type: audio.mime_type || 'audio/mpeg',
      channel_id: chat.id.toString(),
      message_id: message_id,
      channel_title: chat.title || 'Unknown Chat',
      chat_type: chat.type || 'unknown'
    };

    const existingFile = await File.findOne({ file_id: audio.file_id });
    if (existingFile) {
      console.log(`🎵 Audio already exists: ${audio.file_name || audio.title || 'Unknown Audio'}`);
      return;
    }

    const file = new File(fileData);
    await file.save();
    console.log(`✅ Audio saved: ${audio.file_name || audio.title || 'Unknown Audio'} from ${chat.type}: ${chat.title || chat.id}`);
  } catch (error) {
    console.error('❌ Error saving audio:', error);
  }
};

module.exports = {
  handleDocument,
  handleVideo,
  handleAudio
};