# Notes Simulator

A React Native app with real-time voice transcription capabilities using browser Speech Recognition API and a Flask backend for storage.

## Features

- 🎤 **Audio Recording**: Record high-quality audio with waveform visualization
- 🎵 **Audio Playback**: Play back recorded audio with controls
- 🗣️ **Real-time Transcription**: Live transcription using browser Speech Recognition API
- 📱 **Cross-Platform**: Works on iOS and Android
- 🔗 **Server Integration**: Flask backend for storing and managing transcriptions
- 📊 **Analytics**: Word count, character count, and transcription history
- 🔐 **Permission Handling**: Proper microphone permission requests for both iOS and Android
- 📁 **Local File Management**: Audio files stored locally within the app
- 🧠 **Session Management**: Organize transcriptions by recording sessions
- ⚡ **Real-time Display**: See transcription results as you speak

## Architecture

```
React Native App (Frontend)
    ↓ Browser Speech Recognition API
Real-time Transcription
    ↓ HTTP/JSON
Flask Server (Backend Storage)
    ↓ File System
Transcription Results
```

## Prerequisites

- Python 3.8+
- Node.js 16+
- Expo CLI
- React Native development environment
- Modern browser with Speech Recognition support (Chrome, Edge, Safari)

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd NotesSimmulator
```

### 2. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 3. Install React Native Dependencies

```bash
cd NotesSimmulator
npm install
```

### 4. Configure the Application

Run the setup script to automatically configure the Flask server IP:

```bash
python setup.py
```

This script will:

- Detect your local IP address
- Test Flask server connectivity
- Update the React Native app configuration
- Provide setup instructions

## Usage

### Starting the Flask Backend

```bash
python app.py
```

The Flask server will start on `http://0.0.0.0:5000` and create:

- `transcriptions/` directory for transcription results

### Starting the React Native App

```bash
cd NotesSimmulator
npx expo start
```

Then:

1. Scan the QR code with Expo Go app (iOS/Android)
2. Or press `a` for Android emulator
3. Or press `i` for iOS simulator

### Using the App

1. **Grant Microphone Permission**: The app will request microphone access on first use
2. **Navigate to Recordings**: Use the drawer menu to access the Recordings screen
3. **Start Real-time Transcription**: Tap "🎤 Start Real-time Transcription" to begin live transcription
4. **View Live Results**: See transcription appear in real-time as you speak
5. **Stop Transcription**: Tap "🛑 Stop Transcription" when finished
6. **Save Results**: Transcription is automatically saved to the server
7. **Test Connection**: Use the "Test Server Connection" button to verify connectivity

## File Structure

```
NotesSimmulator/
├── app.py                          # Flask backend server
├── setup.py                        # Configuration script
├── test_transcription.py           # Testing script
├── config.py                       # Configuration settings
├── requirements.txt                # Python dependencies
├── transcriptions/                 # Transcription results (Flask)
└── NotesSimmulator/               # React Native app
    ├── App.js                      # Main app component
    ├── AppNavigator.js             # Navigation setup
    ├── DrawerNavigator.js          # Drawer navigation
    ├── AppPages/                   # Screen components
    │   ├── NewRecordingScreen.js   # Audio recording & transcription screen
    │   ├── RecordingsScreen.js     # Recordings list
    │   └── ...                     # Other screens
    └── assets/                     # Images and icons
```

## API Endpoints

### Flask Backend

- `GET /health` - Health check endpoint
- `POST /save-transcription` - Save transcription text
- `GET /transcriptions` - Get all stored transcriptions
- `GET /transcriptions/session/<session_id>` - Get transcriptions for a session
- `POST /clear-transcriptions` - Clear all transcriptions

### Request Format

```javascript
// Save transcription request
const response = await fetch("http://YOUR_IP:5000/save-transcription", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    transcription: "Hello world this is a test",
    session_id: "session_1234567890",
    confidence: 0.95,
    timestamp: "2025-06-23T23:15:02.000Z",
  }),
});
```

### Response Format

```json
{
  "status": "success",
  "transcription": "Hello world this is a test",
  "word_count": 6,
  "character_count": 25,
  "session_id": "session_1234567890",
  "confidence": 0.95,
  "transcription_file": "20250623_231502_transcription.txt",
  "message": "Transcription saved successfully"
}
```

## Browser Speech Recognition

The app uses the browser's built-in Speech Recognition API for real-time transcription:

### Features

- **Real-time Processing**: Transcribes speech as you speak
- **Interim Results**: Shows partial results while speaking
- **Final Results**: Provides accurate final transcriptions
- **No API Keys**: Uses browser's built-in capabilities
- **Cross-platform**: Works on modern browsers

### Supported Browsers

- Chrome (recommended)
- Edge
- Safari (limited support)
- Firefox (limited support)

### Configuration

```javascript
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();

recognition.continuous = true; // Continuous recognition
recognition.interimResults = true; // Show interim results
recognition.lang = "en-US"; // Language setting
```

## Permission Handling

### Android Permissions

The app requests `RECORD_AUDIO` permission with a user-friendly dialog:

```javascript
const granted = await PermissionsAndroid.request(
  PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
  {
    title: "Microphone Permission",
    message: "This app needs access to your microphone to record audio.",
    buttonNeutral: "Ask Me Later",
    buttonNegative: "Cancel",
    buttonPositive: "OK",
  }
);
```

### iOS Permissions

The app uses Expo's Audio API for iOS permission handling:

```javascript
const { status } = await Audio.requestPermissionsAsync();
```

## Testing

Run the test script to verify the system is working:

```bash
python test_transcription.py
```

This will test:

- Server connectivity
- Transcription saving
- Transcription retrieval
- Session management
- Browser speech recognition simulation

## Troubleshooting

### Common Issues

1. **"Speech Recognition not supported"**

   - Use Chrome or Edge browser
   - Ensure HTTPS connection (required for Speech Recognition)
   - Check browser permissions

2. **"Microphone permission denied"**

   - Grant microphone permission in browser settings
   - Check device microphone permissions
   - Restart the app

3. **"Server connection failed"**

   - Verify Flask server is running
   - Check IP address configuration
   - Ensure network connectivity

4. **"No transcription results"**
   - Speak clearly and at normal volume
   - Check microphone is working
   - Ensure quiet environment

### Debug Mode

Enable detailed logging by setting in config.py:

```python
LOG_LEVEL = "DEBUG"
```

## Performance Tips

1. **Use Chrome**: Best Speech Recognition performance
2. **Quiet Environment**: Reduces transcription errors
3. **Clear Speech**: Speak at normal pace and volume
4. **Session Management**: Use session IDs to organize transcriptions
5. **Regular Saves**: Transcriptions are saved automatically

## Security Notes

- No external API keys required
- All processing happens locally in the browser
- Transcriptions stored securely on your server
- Session data is isolated and private

## Support

For browser-specific issues:

- [Chrome Speech Recognition](https://developer.chrome.com/docs/web-platform/speech-recognition/)
- [Web Speech API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)

For app integration issues:

- Check the Flask server logs
- Review browser console for errors
- Test with the provided test script
