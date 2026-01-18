# Simple Chat - Modern Retro Chat Application

A lightweight real-time chat app with modern retro design, featuring public World Chat, private password-protected rooms, and secure HTTPS polling for live messaging.

## 🎨 Features

### Core Functionality
- **🌎 World Chat**: Open public chat room accessible to anyone without authentication
- **🔒 Private Rooms**: Create and join password-protected rooms for secure conversations
- **⚡ Real-time Messaging**: Live updates using efficient 2-second HTTPS polling
- **👤 Username Protection**: Automatic duplicate username detection within rooms
- **📊 Online User List**: See who's currently active in your room
- **🔔 Sound Notifications**: Optional audio alerts for new messages
- **⏱️ Message Timestamps**: All messages include formatted timestamps
- **🎯 Modern Retro UI**: Beautiful interface inspired by classic Mac OS and Vaporwave aesthetics

### World Chat Admin Commands
Administrators can manage the World Chat using special commands:
- `/PASSWORDclearchat` - Clear all messages in World Chat
- `/PASSWORDdelete"message"` - Delete specific messages by content
- `/OLDPASS2NEWPASS` - Change the admin password

Default admin password: `QWERTY`

### UI/UX Features
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Error Handling**: User-friendly error messages displayed inline
- **Auto-scroll**: Messages automatically scroll to the latest
- **Duplicate Prevention**: Blocks identical messages sent within 2 seconds
- **Session Management**: Clean exit and re-join functionality

## 🚀 Installation

### Prerequisites
- Node.js (v14 or higher)
- npm (comes with Node.js)

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/Muhammed2-h/chatroom.git
cd chatroom
```

2. **Install dependencies**
```bash
npm install
```

3. **Start the server**
```bash
node server.js
```

4. **Open your browser**
Navigate to `http://localhost:3000`

## 📦 Dependencies

```json
{
  "express": "^4.18.0",
  "body-parser": "^1.20.0",
  "sanitize-html": "^2.11.0"
}
```

## 🎮 Usage

### Joining World Chat
1. Click **"🌎 Enter World Chat"** on the home page
2. Enter your username
3. Click **"Join World"**
4. Start chatting!

### Creating/Joining Private Rooms
1. Enter a room name on the home page
2. Click **"Next"**
3. Enter your username and a passkey
4. Click **"Join"**
   - If the room doesn't exist, it will be created with your passkey
   - If it exists, you must enter the correct passkey to join

### Admin Commands (World Chat Only)
To use admin commands, type them in the message box:
- Clear all chat: `/QWERTYclearchat`
- Delete specific message: `/QWERTYdelete"spam message"`
- Change password: `/QWERTY2NEWPASSWORD`

## 🏗️ Project Structure

```
chatroom/
├── public/
│   ├── index.html      # Main HTML with embedded CSS
│   └── script.js       # Client-side JavaScript
├── server.js           # Express server with all endpoints
├── package.json        # Project dependencies
└── README.md          # This file
```

## 🔧 Configuration

### Server Settings
Edit `server.js` to modify:
- **PORT**: Default is `3000`
- **USER_TIMEOUT**: User activity timeout (default: 15 seconds)
- **MAX_MESSAGES**: Maximum messages per room (default: 50)

### World Chat Admin Password
Change the default password in `server.js`:
```javascript
let worldAdminPassword = "QWERTY"; // Change this
```

## 🎨 Design Philosophy

The UI follows a "Modern Retro" aesthetic combining:
- **Color Palette**: Soft beige backgrounds (#f0f0eb) with navy blue accents (#000080)
- **Typography**: Geneva/Verdana for readability, Courier New for headers
- **Visual Elements**: Subtle 3D borders, rounded corners, and soft shadows
- **Inspiration**: Classic Mac OS interfaces and Vaporwave design

## 🔒 Security Features

- **Input Sanitization**: All user inputs are sanitized using `sanitize-html`
- **Passkey Protection**: Private rooms require correct passkeys
- **Username Validation**: Prevents duplicate usernames in active sessions
- **XSS Prevention**: HTML tags are stripped from all user content

## 📡 API Endpoints

### POST `/join`
Join or create a room
- **Body**: `{ roomId, passkey, username }`
- **Returns**: `{ success, status }`

### GET `/poll`
Poll for new messages and online users
- **Query**: `roomId`, `passkey`, `username`
- **Returns**: `{ messages, users }`

### POST `/send`
Send a message to a room
- **Body**: `{ roomId, passkey, name, content }`
- **Returns**: `{ success }`

### POST `/clear`
Clear all messages in a room (private rooms only)
- **Body**: `{ roomId, passkey }`
- **Returns**: `{ success }`

### POST `/leave`
Remove user from room's active user list
- **Body**: `{ roomId, passkey, username }`
- **Returns**: `{ success }`

## 🐛 Known Limitations

- **In-Memory Storage**: All data is stored in RAM and will be lost on server restart
- **No Persistence**: Messages and rooms are not saved to a database
- **Polling-Based**: Uses HTTP polling instead of WebSockets (simpler but less efficient)
- **No User Authentication**: Usernames are not password-protected
- **Single Server**: Not designed for horizontal scaling

## 🔮 Future Enhancements

- [ ] Database integration (MongoDB/PostgreSQL)
- [ ] WebSocket support for real-time updates
- [ ] User authentication and profiles
- [ ] Message editing and deletion
- [ ] File/image sharing
- [ ] Private direct messaging
- [ ] Room moderation tools
- [ ] Message search functionality
- [ ] Emoji support
- [ ] Typing indicators

## 📄 License

This project is open source and available under the MIT License.

## 👨‍💻 Author

Created with ❤️ by Muhammed

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

If you encounter any issues or have questions, please open an issue on GitHub.

---

**Enjoy chatting! 💬**
