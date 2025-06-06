# 🚀 Getting Started with Open Voice Chat

This guide will help you set up and run Open Voice Chat on your local machine in under 10 minutes.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

### Required Software
- **Node.js** 18.17 or higher ([Download](https://nodejs.org/))
- **pnpm** 8.0 or higher ([Install Guide](https://pnpm.io/installation))
- **Git** ([Download](https://git-scm.com/downloads))

### Browser Requirements
- **Modern browser** with WebRTC support:
  - Chrome 90+ (recommended)
  - Firefox 88+
  - Safari 14+
  - Edge 90+

### API Keys Required
You'll need to obtain API keys from these services:

1. **ByteDance Doubao** - [Get API Key](https://www.doubao.com/console)
2. **VolcEngine RTC** - [Get Credentials](https://console.volcengine.com/rtc)

---

## 🛠️ Installation

### 1. Clone the Repository

```bash
# Clone via HTTPS
git clone https://github.com/markshawn2020/open-voice-chat.git

# Or clone via SSH
git clone git@github.com:markshawn2020/open-voice-chat.git

# Navigate to the project directory
cd open-voice-chat
```

### 2. Install Dependencies

```bash
# Install all dependencies
pnpm install

# Verify installation
pnpm --version
node --version
```

### 3. Environment Configuration

```bash
# Copy the example environment file
cp .env.example .env.local

# Open the file in your preferred editor
code .env.local  # VS Code
# or
nano .env.local  # Terminal editor
```

### 4. Configure API Keys

Edit `.env.local` with your actual API credentials:

```env
# Required: ByteDance Doubao API
DOUBAO_API_KEY=your_actual_doubao_api_key
DOUBAO_APP_ID=your_actual_app_id

# Required: VolcEngine RTC
VOLCENGINE_APP_ID=your_actual_volcengine_app_id
VOLCENGINE_ACCESS_KEY=your_actual_access_key
VOLCENGINE_SECRET_KEY=your_actual_secret_key
```

> ⚠️ **Security Note**: Never commit `.env.local` to version control. It's already included in `.gitignore`.

---

## 🚀 Running the Application

### Development Mode

```bash
# Start the development server
pnpm dev

# The app will be available at:
# 🌐 http://localhost:3000
```

### Production Build

```bash
# Build the application
pnpm build

# Start the production server
pnpm start
```

### Other Useful Commands

```bash
# Run linting
pnpm lint

# Run tests
pnpm test

# Run E2E tests
pnpm e2e:headless

# Analyze bundle size
pnpm analyze
```

---

## 🎯 First Steps

### 1. Open the Application

Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Test Voice Permissions

- Click the **microphone icon** to enable voice permissions
- Allow microphone access when prompted
- You should see the microphone status change to "active"

### 3. Start Your First Conversation

1. **Choose an AI Persona** - Select from the default personas or create a custom one
2. **Click the Call Button** - Start your voice conversation
3. **Speak Naturally** - Talk to the AI as you would in a phone conversation
4. **View Real-time Subtitles** - Watch the conversation unfold in the chat panel

### 4. Explore Features

- **Chat History**: View your conversation history in the right panel
- **AI Settings**: Adjust voice settings and persona characteristics
- **Voice Controls**: Mute, unmute, and end conversations
- **Mobile View**: Try the responsive mobile interface

---

## 🔧 Configuration Options

### Voice Settings

You can customize voice behavior in the AI configuration panel:

```typescript
// Example configuration
{
  voice: {
    speed: 1.0,        // Speaking speed (0.5 - 2.0)
    pitch: 1.0,        // Voice pitch (0.5 - 2.0)
    volume: 0.8,       // Output volume (0.0 - 1.0)
    language: "en-US"  // Voice language
  }
}
```

### AI Persona Customization

Create custom AI personalities:

```typescript
// Example persona
{
  name: "Assistant",
  personality: "helpful and friendly",
  voice: "professional",
  language: "en-US",
  instructions: "You are a helpful AI assistant..."
}
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Microphone Not Working
- **Check browser permissions**: Ensure microphone access is allowed
- **Try different browser**: Some browsers have stricter WebRTC policies
- **Check system permissions**: Verify microphone access in OS settings

#### 2. API Connection Errors
- **Verify API keys**: Double-check your credentials in `.env.local`
- **Check network**: Ensure you have internet connectivity
- **Review console**: Open browser dev tools for error details

#### 3. Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules .next
pnpm install
pnpm dev
```

#### 4. Port Already in Use
```bash
# Use a different port
pnpm dev -- --port 3001
```

### Getting Help

If you encounter issues:

1. **Check our [Troubleshooting Guide](./troubleshooting.md)**
2. **Search existing [GitHub Issues](https://github.com/markshawn2020/open-voice-chat/issues)**
3. **Join our [Discord Community](https://discord.gg/open-voice-chat)**
4. **Create a new issue** with detailed error information

---

## 📚 Next Steps

Now that you have Open Voice Chat running, explore these topics:

- **[AI Personas Setup](./personas.md)** - Create custom AI personalities
- **[Voice Configuration](./voice-config.md)** - Fine-tune voice settings
- **[API Integration](./api-integration.md)** - Integrate with other services
- **[Development Guide](./development.md)** - Contributing to the project

---

## 🎉 Success!

Congratulations! You now have Open Voice Chat running locally. Start experimenting with voice conversations and explore the features.

If you find this project helpful, please consider:
- ⭐ **Starring the repository**
- 🐛 **Reporting bugs**
- 💡 **Suggesting features**
- 🤝 **Contributing code**

Happy chatting! 🎙️
