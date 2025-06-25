from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import speech_recognition as sr
import logging
import base64
import tempfile
import os
import requests
import time
from datetime import datetime

# SpeechBrain imports
try:
    import speechbrain as sb
    from speechbrain.inference import EncoderDecoderASR
    SPEECHBRAIN_AVAILABLE = True
except ImportError:
    SPEECHBRAIN_AVAILABLE = False
    print("⚠️  SpeechBrain not installed. Install with: pip install speechbrain")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Configuration
TRANSCRIPTIONS_FOLDER = 'transcriptions'

# Create transcriptions directory if it doesn't exist
os.makedirs(TRANSCRIPTIONS_FOLDER, exist_ok=True)

# Global variable to store transcription results
transcription_results = []

# SpeechBrain model (loaded once at startup)
speechbrain_model = None

def load_speechbrain_model():
    """Load SpeechBrain ASR model"""
    global speechbrain_model
    if not SPEECHBRAIN_AVAILABLE:
        logger.warning("SpeechBrain not available, falling back to Google Speech Recognition")
        return False
    
    try:
        logger.info("🧠 Loading SpeechBrain ASR model...")
        # Use a simpler pre-trained ASR model
        speechbrain_model = EncoderDecoderASR.from_hparams(
            source="speechbrain/asr-crdnn-rnnlm-librispeech",
            savedir="./pretrained_models/asr-crdnn-rnnlm-librispeech"
        )
        logger.info("✅ SpeechBrain model loaded successfully")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to load SpeechBrain model: {e}")
        return False

@app.route('/health', methods=['GET'])
def health_check():
    logger.info("Health check endpoint called")
    return jsonify({
        'status': 'healthy',
        'message': 'Flask server is running with SpeechBrain transcription',
        'speechbrain_available': SPEECHBRAIN_AVAILABLE,
        'model_loaded': speechbrain_model is not None,
        'transcription_count': len(transcription_results),
        'timestamp': datetime.now().isoformat()
    })

def transcribe_with_speechbrain(audio_file_path):
    """
    Transcribe audio using SpeechBrain ASR model
    """
    try:
        logger.info("🧠 Using SpeechBrain for transcription...")
        
        if not speechbrain_model:
            logger.error("SpeechBrain model not loaded")
            raise Exception("SpeechBrain model not available")
        
        # Ensure the file path is absolute and properly formatted
        audio_file_path = os.path.abspath(audio_file_path)
        logger.info(f"🧠 Audio file path: {audio_file_path}")
        
        # Check if file exists
        if not os.path.exists(audio_file_path):
            raise Exception(f"Audio file not found: {audio_file_path}")
        
        # Transcribe audio using SpeechBrain
        transcription = speechbrain_model.transcribe_file(audio_file_path)
        
        logger.info(f"✅ SpeechBrain transcription completed: {transcription}")
        return transcription
        
    except Exception as e:
        logger.error(f"❌ SpeechBrain transcription error: {e}")
        raise e

def transcribe_with_google_fallback(audio_file_path):
    """
    Fallback to Google Speech Recognition if SpeechBrain fails
    """
    try:
        logger.info("🔄 Falling back to Google Speech Recognition...")
        recognizer = sr.Recognizer()
        
        with sr.AudioFile(audio_file_path) as source:
            logger.info("Audio file loaded successfully")
            recognizer.adjust_for_ambient_noise(source, duration=1)
            audio_data = recognizer.record(source)
            logger.info("Audio recorded successfully")
        
        transcription = recognizer.recognize_google(audio_data)
        logger.info(f"✅ Google fallback transcription completed: {transcription}")
        return transcription
        
    except Exception as e:
        logger.error(f"❌ Google fallback transcription failed: {e}")
        raise e

@app.route('/transcribe-audio', methods=['POST'])
def transcribe_audio():
    """Transcribe audio files using SpeechBrain"""
    logger.info("=== SPEECHBRAIN TRANSCRIPTION REQUEST STARTED ===")
    
    try:
        # Check if request is JSON
        if not request.is_json:
            logger.error("Request is not JSON")
            return jsonify({
                'status': 'error',
                'message': 'Request must be JSON'
            }), 400
        
        data = request.get_json()
        
        # Check if audio_data is present
        if 'audio_data' not in data:
            logger.error("No audio_data found in request")
            return jsonify({
                'status': 'error',
                'message': 'No audio_data provided'
            }), 400
        
        audio_data = data['audio_data']
        audio_format = data.get('audio_format', 'm4a')
        timestamp = data.get('timestamp', datetime.now().isoformat())
        
        logger.info(f"Received audio data length: {len(audio_data)}")
        logger.info(f"Audio format: {audio_format}")
        logger.info(f"Timestamp: {timestamp}")
        
        # Decode base64 audio data
        logger.info("Decoding base64 audio data...")
        try:
            decoded_audio = base64.b64decode(audio_data)
            logger.info(f"Decoded audio size: {len(decoded_audio)} bytes")
        except Exception as e:
            logger.error(f"Failed to decode base64 audio: {e}")
            return jsonify({
                'status': 'error',
                'message': 'Invalid base64 audio data'
            }), 400
        
        # Create temporary file for transcription
        logger.info("Creating temporary audio file...")
        temp_file_path = tempfile.mktemp(suffix=f'.{audio_format}')
        with open(temp_file_path, 'wb') as temp_file:
            temp_file.write(decoded_audio)
        
        logger.info(f"Temporary file created: {temp_file_path}")
        
        try:
            # Use SpeechBrain for transcription
            transcription_service = data.get('service', 'speechbrain')
            logger.info(f"Using transcription service: {transcription_service}")
            
            if transcription_service == 'speechbrain' and speechbrain_model:
                transcription_text = transcribe_with_speechbrain(temp_file_path)
            else:
                # Fallback to Google Speech Recognition
                transcription_text = transcribe_with_google_fallback(temp_file_path)
                transcription_service = 'google_fallback'
            
            # Store transcription in global variable
            transcription_result = {
                'timestamp': timestamp,
                'transcription': transcription_text,
                'audio_size': len(decoded_audio),
                'service': transcription_service,
                'word_count': len(transcription_text.split()),
                'character_count': len(transcription_text)
            }
            
            transcription_results.append(transcription_result)
            logger.info(f"📝 Transcription stored in memory: {transcription_text}")
            
            # Calculate word and character counts
            word_count = transcription_result['word_count']
            character_count = transcription_result['character_count']
            
            logger.info(f"Word count: {word_count}")
            logger.info(f"Character count: {character_count}")
            
            # Save transcription to file
            transcription_filename = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_speechbrain_transcription.txt"
            transcription_path = os.path.join(TRANSCRIPTIONS_FOLDER, transcription_filename)
            
            with open(transcription_path, 'w', encoding='utf-8') as f:
                f.write(f"Audio Format: {audio_format}\n")
                f.write(f"Audio Size: {len(decoded_audio)} bytes\n")
                f.write(f"Transcription Service: {transcription_service}\n")
                f.write(f"Transcription Time: {datetime.now().isoformat()}\n")
                f.write(f"Word Count: {word_count}\n")
                f.write(f"Character Count: {character_count}\n")
                f.write(f"Transcription:\n{transcription_text}\n")
            
            logger.info(f"Transcription saved to: {transcription_path}")
            
            return jsonify({
                'status': 'success',
                'transcription': transcription_text,
                'word_count': word_count,
                'character_count': character_count,
                'audio_size': len(decoded_audio),
                'service': transcription_service,
                'transcription_file': transcription_filename
            })
            
        except sr.UnknownValueError:
            logger.error("Speech recognition could not understand the audio")
            return jsonify({
                'status': 'error',
                'message': 'Could not understand the audio. Please try again with clearer speech.'
            }), 400
            
        except sr.RequestError as e:
            logger.error(f"Could not request results from speech recognition service: {e}")
            return jsonify({
                'status': 'error',
                'message': f'Speech recognition service error: {str(e)}'
            }), 500
        
        finally:
            # Clean up temporary file
            try:
                os.unlink(temp_file_path)
                logger.info("Temporary file cleaned up")
            except Exception as e:
                logger.warning(f"Failed to clean up temporary file: {e}")
    
    except Exception as e:
        logger.error(f"Unexpected error during transcription: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Unexpected error: {str(e)}'
        }), 500
    
    finally:
        logger.info("=== SPEECHBRAIN TRANSCRIPTION REQUEST COMPLETED ===")

@app.route('/save-transcription', methods=['POST'])
def save_transcription():
    """Save transcription text from browser Speech Recognition API"""
    logger.info("=== SAVE TRANSCRIPTION REQUEST STARTED ===")
    
    try:
        # Check if request is JSON
        if not request.is_json:
            logger.error("Request is not JSON")
            return jsonify({
                'status': 'error',
                'message': 'Request must be JSON'
            }), 400
        
        data = request.get_json()
        
        # Check if transcription text is present
        if 'transcription' not in data:
            logger.error("No transcription text found in request")
            return jsonify({
                'status': 'error',
                'message': 'No transcription text provided'
            }), 400
        
        transcription_text = data['transcription']
        timestamp = data.get('timestamp', datetime.now().isoformat())
        session_id = data.get('session_id', 'default')
        confidence = data.get('confidence', 0.0)
        
        logger.info(f"Received transcription: {transcription_text[:50]}...")
        logger.info(f"Session ID: {session_id}")
        logger.info(f"Confidence: {confidence}")
        
        # Store transcription in global variable
        transcription_result = {
            'timestamp': timestamp,
            'transcription': transcription_text,
            'session_id': session_id,
            'confidence': confidence,
            'service': 'browser_speech_recognition',
            'word_count': len(transcription_text.split()),
            'character_count': len(transcription_text)
        }
        
        transcription_results.append(transcription_result)
        logger.info(f"📝 Transcription stored in memory: {transcription_text}")
        
        # Calculate word and character counts
        word_count = transcription_result['word_count']
        character_count = transcription_result['character_count']
        
        logger.info(f"Word count: {word_count}")
        logger.info(f"Character count: {character_count}")
        
        # Save transcription to file
        transcription_filename = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_browser_transcription.txt"
        transcription_path = os.path.join(TRANSCRIPTIONS_FOLDER, transcription_filename)
        
        with open(transcription_path, 'w', encoding='utf-8') as f:
            f.write(f"Session ID: {session_id}\n")
            f.write(f"Confidence: {confidence}\n")
            f.write(f"Service: Browser Speech Recognition\n")
            f.write(f"Transcription Time: {datetime.now().isoformat()}\n")
            f.write(f"Word Count: {word_count}\n")
            f.write(f"Character Count: {character_count}\n")
            f.write(f"Transcription:\n{transcription_text}\n")
        
        logger.info(f"Transcription saved to: {transcription_path}")
        
        return jsonify({
            'status': 'success',
            'transcription': transcription_text,
            'word_count': word_count,
            'character_count': character_count,
            'session_id': session_id,
            'confidence': confidence,
            'transcription_file': transcription_filename,
            'message': 'Transcription saved successfully'
        })
        
    except Exception as e:
        logger.error(f"Unexpected error during transcription save: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Unexpected error: {str(e)}'
        }), 500
    
    finally:
        logger.info("=== SAVE TRANSCRIPTION REQUEST COMPLETED ===")

@app.route('/transcriptions', methods=['GET'])
def get_transcriptions():
    """Get all stored transcriptions"""
    logger.info("Retrieving stored transcriptions...")
    return jsonify({
        'status': 'success',
        'transcriptions': transcription_results,
        'count': len(transcription_results)
    })

@app.route('/transcriptions/<filename>')
def transcription_file(filename):
    return send_from_directory(TRANSCRIPTIONS_FOLDER, filename)

@app.route('/clear-transcriptions', methods=['POST'])
def clear_transcriptions():
    """Clear all stored transcriptions"""
    global transcription_results
    transcription_results.clear()
    logger.info("All transcriptions cleared from memory")
    return jsonify({
        'status': 'success',
        'message': 'All transcriptions cleared'
    })

@app.route('/transcriptions/session/<session_id>', methods=['GET'])
def get_session_transcriptions(session_id):
    """Get transcriptions for a specific session"""
    session_transcriptions = [
        t for t in transcription_results 
        if t.get('session_id') == session_id
    ]
    return jsonify({
        'status': 'success',
        'session_id': session_id,
        'transcriptions': session_transcriptions,
        'count': len(session_transcriptions)
    })

if __name__ == '__main__':
    logger.info("Starting Flask server...")
    logger.info(f"Transcriptions folder: {os.path.abspath(TRANSCRIPTIONS_FOLDER)}")
    logger.info("Server ready for both SpeechBrain and browser transcription")
    
    # Load SpeechBrain model
    if load_speechbrain_model():
        logger.info("🧠 Using SpeechBrain for audio transcription")
    else:
        logger.info("🔄 Using Google Speech Recognition as fallback")
    
    app.run(host='0.0.0.0', port=5000, debug=True) 