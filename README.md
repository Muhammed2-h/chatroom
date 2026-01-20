# Simple Chat - Modern Retro Chat Application

A lightweight real-time chat app with modern retro design, featuring public World Chat, private password-protected rooms, and secure messaging.

![Preview](https://i.imgur.com/your-preview-image.png) <!-- You can add a screenshot later if you want -->

## 🚀 Features

### Core Functionality
- **🌎 World Chat**: Open public chat room accessible to anyone.
- **🔒 Private Rooms**: Password-protected rooms for secure conversations.
- **💾 Hybrid Storage**:
  - **Local Mode**: Uses RAM for testing (no setup needed).
  - **Production Mode**: Automatically switches to **PostgreSQL** for permanent storage when deployed.
- **⚡ Real-time Messaging**: Fast updates using optimized polling.
- **👤 Username Protection**: Prevents duplicate usernames in active functionality.
- **🎯 Modern Retro UI**: Aesthetic interface inspired by classic Mac OS.

### Deploy in Seconds

**Recommended: Railway**
1. Fork this repository.
2. Create a new project in [Railway](https://railway.app/).
3. Add a **PostgreSQL** database service.
4. Deploy this repository.
5. Add the `DATABASE_URL` variable to your app service (Railway provides this automatically).
6. **Done!** Your chat history is now permanent.

## 📦 Installation (Local)

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

## 🛠️ Configuration

### Environment Variables (Optional)
| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Local port number | `3000` |
| `DATABASE_URL` | Postgres connection string | `null` (runs in RAM) |

## 🎮 Usage

### Joining World Chat
- Click **"🌎 Enter World Chat"**
- Enter your username and join instantly!

### Private Rooms
- Enter a **Room Name** and click **Next**.
- Enter your **Username** and a **Passkey**.
- If the room is new, it's created with that passkey.
- If it exists, you must enter the correct passkey to join.

## 📄 License
This project is open source and available under the MIT License.
