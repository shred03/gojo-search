# Telegram File Search Bot

A Node.js Telegram bot that automatically stores files from channels and provides search functionality through MongoDB.

## Features

- 🤖 Automatically stores documents, videos, and audio files from Telegram channels
- 🔍 Search functionality with case-insensitive partial matching
- 📊 File statistics and management
- 🗄️ MongoDB integration for persistent storage
- 🔒 Private chat search (security feature)
- 📝 Comprehensive logging and error handling

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas)
- Telegram Bot Token from [@BotFather](https://t.me/BotFather)

## Installation

1. **Clone or create the project structure:**
```bash
mkdir telegram-file-bot
cd telegram-file-bot
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
   - Copy the `.env` template
   - Add your bot token and MongoDB URI

4. **Create the project structure:**
```
telegram-file-bot/
├── config/
│   └── database.js
├── handlers/
│   ├── fileHandlers.js
│   └── searchHandler.js
├── models/
│   └── File.js
├── .env
├── index.js
├── package.json
└── README.md
```

## Configuration

### 1. Get a Bot Token

1. Message [@BotFather](https://t.me/BotFather) on Telegram
2. Send `/newbot` and follow the instructions
3. Copy the bot token

### 2. Set up MongoDB

**Option A: Local MongoDB**
```bash
# Install MongoDB locally or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

**Option B: MongoDB Atlas (Cloud)**
1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster
3. Get connection string

### 3. Configure Environment Variables

Update your `.env` file:
```env
BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrSTUvwxyz
MONGODB_URI=mongodb://localhost:27017/telegram-bot
```

## Usage

### 1. Start the Bot

```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

### 2. Set up Channel Integration

1. Add your bot to a Telegram channel as an administrator
2. Give the bot permissions to read messages
3. Start forwarding files to the channel

### 3. Search Files

In a private chat with the bot:
```
/search Naruto
/search tutorial
/search .pdf
```

## Bot Commands

- `/start` - Welcome message and instructions
- `/help` - Show help information
- `/search <query>` - Search for files (private chat only)
- `/stats` - Show bot statistics

## Project Structure

```
telegram-file-bot/
├── config/
│   └── database.js          # MongoDB connection config
├── handlers/
│   ├── fileHandlers.js      # File processing logic
│   └── searchHandler.js     # Search functionality
├── models/
│   └── File.js              # Mongoose schema
├── .env                     # Environment variables
├── index.js                 # Main bot application
├── package.json             # Dependencies and scripts
└── README.md               # This file
```

## Database Schema

The bot stores files with the following structure:

```javascript
{
  file_id: String,        // Telegram file ID
  file_name: String,      // Original filename
  caption: String,        // File caption
  type: String,           // 'document', 'video', or 'audio'
  file_size: Number,      // File size in bytes
  mime_type: String,      // MIME type
  channel_id: String,     // Channel ID where file was posted
  message_id: Number,     // Message ID
  created_at: Date        // When file was stored
}
```

## Development

### Running in Development Mode

```bash
npm run dev
```

This uses `nodemon` for automatic restarts when files change.

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `BOT_TOKEN` | Telegram bot token | `1234567890:ABC...` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/telegram-bot` |
| `NODE_ENV` | Environment (optional) | `development` |

## Deployment

### Using PM2 (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Start the bot
pm2 start index.js --name telegram-file-bot

# Monitor
pm2 monit

# View logs
pm2 logs telegram-file-bot
```

### Using Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

CMD ["npm", "start"]
```

## Troubleshooting

### Common Issues

1. **Bot not responding**
   - Check if bot token is correct
   - Verify bot is added to channel as admin
   - Check MongoDB connection

2. **Files not being stored**
   - Ensure bot has admin rights in channel
   - Check MongoDB connection
   - Verify file types are supported

3. **Search not working**
   - Search only works in private chat
   - Check if files exist in database
   - Verify MongoDB indexes are created

### Logs

The bot provides comprehensive logging:
- MongoDB connection status
- File processing results
- Search queries and results
- Error messages

## Security Features

- Search functionality restricted to private chats
- File validation and duplicate prevention
- Error handling and logging
- Graceful shutdown handling

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the logs for error messages
3. Ensure all dependencies are installed correctly
4. Verify environment variables are set properly