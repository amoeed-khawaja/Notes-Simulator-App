# Browser Speech Recognition Configuration
# This system uses the browser's built-in Speech Recognition API for real-time transcription

# Flask server configuration
FLASK_HOST = "0.0.0.0"
FLASK_PORT = 5000
FLASK_DEBUG = True

# Transcription settings
TRANSCRIPTIONS_FOLDER = "transcriptions"
DEFAULT_LANGUAGE = "en-US"

# Session management
SESSION_TIMEOUT = 300  # 5 minutes in seconds
MAX_SESSION_TRANSCRIPTIONS = 100

# Logging configuration
LOG_LEVEL = "INFO"

# Browser Speech Recognition settings
SPEECH_RECOGNITION_CONFIG = {
    "continuous": True,
    "interimResults": True,
    "lang": "en-US",
    "maxAlternatives": 1
}

# File storage settings
MAX_TRANSCRIPTION_LENGTH = 10000  # characters
AUTO_SAVE_INTERVAL = 30  # seconds 