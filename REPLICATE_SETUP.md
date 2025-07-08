# 🤖 Replicate API Setup for OpenAI Whisper

This guide will help you set up the Replicate API to use OpenAI's Whisper model for high-quality audio transcription.

## 📋 Prerequisites

1. **Python environment** with the required dependencies
2. **Replicate account** (free tier available)
3. **API token** from Replicate

## 🔧 Installation Steps

### 1. Install Dependencies

```bash
pip install replicate==0.22.0
pip install pydub==0.25.1
```

Or install all requirements:

```bash
pip install -r requirements.txt
```

### 2. Get Replicate API Token

1. Go to [replicate.com](https://replicate.com)
2. Sign up for a free account
3. Go to your [API tokens page](https://replicate.com/account/api-tokens)
4. Create a new API token
5. Copy the token (it starts with `r8_`)

### 3. Set Environment Variable

**Windows:**

```cmd
set REPLICATE_API_TOKEN=r8_your_token_here
```

**macOS/Linux:**

```bash
export REPLICATE_API_TOKEN=r8_your_token_here
```

**Or create a `.env` file:**

```
REPLICATE_API_TOKEN=r8_your_token_here
```

### 4. Test the Setup

Run the test script to verify everything is working:

```bash
python test_flask_fixes.py
```

## 🎯 Features

### OpenAI Whisper Benefits

- **High accuracy**: State-of-the-art speech recognition
- **Multiple languages**: Supports 99+ languages
- **Noise handling**: Works well with background noise
- **Format flexibility**: Handles various audio formats
- **Automatic language detection**

### Audio Format Support

- **Input formats**: M4A, WAV, MP3, and more
- **Automatic conversion**: Converts to WAV for optimal Whisper performance
- **File size handling**: Supports files up to 25MB

## 🔄 Transcription Flow

1. **Audio Recording**: App records audio in M4A format
2. **Base64 Encoding**: Audio is encoded and sent to Flask server
3. **Format Conversion**: Server converts M4A to WAV using pydub
4. **Whisper API**: Audio is sent to OpenAI Whisper via Replicate
5. **Result Processing**: Transcription text is extracted and returned
6. **File Cleanup**: Temporary files are automatically cleaned up

## 💰 Pricing

### Replicate Free Tier

- **1000 predictions per month** (free)
- **Whisper model**: ~$0.006 per minute of audio
- **No credit card required** for free tier

### Usage Examples

- 1 minute audio ≈ $0.006
- 10 minutes audio ≈ $0.06
- 100 minutes audio ≈ $0.60

## 🚀 Usage in App

### Default Behavior

The app now uses OpenAI Whisper as the **default** transcription method:

1. **Record audio** in the app
2. **Choose "🤖 OpenAI Whisper (Best)"** when prompted
3. **Wait for transcription** (usually 5-15 seconds)
4. **Review results** with word/character counts

### Fallback Options

If Whisper fails, the app provides fallback options:

- **Browser Speech Recognition** (free, works offline)
- **SpeechBrain** (local processing, no API costs)
- **Google Speech Recognition** (requires internet)

## 🔍 Troubleshooting

### Common Issues

**1. API Token Not Set**

```
Error: Replicate API not available
```

**Solution**: Set the `REPLICATE_API_TOKEN` environment variable

**2. Network Issues**

```
Error: Failed to connect to Whisper server
```

**Solution**: Check internet connection and firewall settings

**3. File Size Too Large**

```
Error: File size exceeds limit
```

**Solution**: Record shorter audio clips (under 25MB)

**4. Audio Format Issues**

```
Error: Audio conversion failed
```

**Solution**: Ensure pydub is installed: `pip install pydub`

### Debug Information

The Flask server provides detailed logging:

- Audio file paths and sizes
- Conversion steps
- API response details
- Error messages and types

## 📊 Performance Comparison

| Service            | Accuracy   | Speed    | Cost       | Offline |
| ------------------ | ---------- | -------- | ---------- | ------- |
| **OpenAI Whisper** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | $0.006/min | ❌      |
| SpeechBrain        | ⭐⭐⭐     | ⭐⭐     | Free       | ✅      |
| Browser Speech     | ⭐⭐⭐     | ⭐⭐⭐⭐ | Free       | ✅      |
| Google Speech      | ⭐⭐⭐⭐   | ⭐⭐⭐⭐ | Free       | ❌      |

## 🔐 Security Notes

- **API tokens** are sensitive - never commit them to version control
- **Audio data** is processed by OpenAI's servers
- **Temporary files** are automatically cleaned up
- **No audio data** is stored permanently on external servers

## 📞 Support

If you encounter issues:

1. Check the Flask server logs for detailed error messages
2. Verify your API token is correct
3. Test with a simple audio file first
4. Check your internet connection
5. Review the troubleshooting section above
