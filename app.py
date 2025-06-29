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

# Audio processing imports
try:
    from pydub import AudioSegment
    AUDIO_CONVERSION_AVAILABLE = True
except ImportError:
    AUDIO_CONVERSION_AVAILABLE = False
    print("⚠️  pydub not installed. Install with: pip install pydub")

# Replicate imports for OpenAI Whisper
try:
    import replicate
    REPLICATE_AVAILABLE = True
except ImportError:
    REPLICATE_AVAILABLE = False
    print("⚠️  replicate not installed. Install with: pip install replicate")

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

def convert_audio_format(input_path, output_format='wav'):
    """
    Convert audio file to a format that SpeechBrain can handle
    """
    if not AUDIO_CONVERSION_AVAILABLE:
        logger.warning("Audio conversion not available, using original file")
        return input_path
    
    try:
        logger.info(f"🔄 Converting audio to {output_format} format...")
        
        # Check if input file exists
        if not os.path.exists(input_path):
            raise Exception(f"Input file not found: {input_path}")
        
        # Load audio file
        audio = AudioSegment.from_file(input_path)
        
        # Create output path
        output_path = tempfile.mktemp(suffix=f'.{output_format}')
        
        # Export to new format
        audio.export(output_path, format=output_format)
        
        # Verify the output file was created
        if not os.path.exists(output_path):
            raise Exception(f"Output file was not created: {output_path}")
        
        # Check file size
        output_size = os.path.getsize(output_path)
        if output_size == 0:
            raise Exception(f"Output file is empty: {output_path}")
        
        logger.info(f"✅ Audio converted to: {output_path} ({output_size} bytes)")
        return output_path
        
    except Exception as e:
        logger.error(f"❌ Audio conversion failed: {e}")
        logger.warning("⚠️ Using original file format for transcription")
        
        # If the original file exists, return it
        if os.path.exists(input_path):
            logger.info(f"🔄 Falling back to original file: {input_path}")
            return input_path
        else:
            # If even the original file doesn't exist, this is a critical error
            raise Exception(f"Both conversion and original file failed: {e}")

def transcribe_with_speechbrain(audio_file_path):
    """
    Transcribe audio using SpeechBrain ASR model
    """
    try:
        logger.info("🧠 Using SpeechBrain for transcription...")
        
        if not speechbrain_model:
            logger.error("SpeechBrain model not loaded")
            raise Exception("SpeechBrain model not available")
        
        # Ensure we have a clean absolute path
        audio_file_path = os.path.abspath(audio_file_path)
        logger.info(f"🧠 Audio file path: {audio_file_path}")
        
        # Check if file exists
        if not os.path.exists(audio_file_path):
            raise Exception(f"Audio file not found: {audio_file_path}")
        
        # Get file size for debugging
        file_size = os.path.getsize(audio_file_path)
        logger.info(f"🧠 Audio file size: {file_size} bytes")
        
        # Get current working directory for debugging
        cwd = os.getcwd()
        logger.info(f"🧠 Current working directory: {cwd}")
        
        # Check if the path is absolute
        is_absolute = os.path.isabs(audio_file_path)
        logger.info(f"🧠 Is absolute path: {is_absolute}")
        
        # List directory contents for debugging
        try:
            dir_path = os.path.dirname(audio_file_path)
            dir_contents = os.listdir(dir_path)
            logger.info(f"🧠 Directory contents: {dir_contents[:10]}...")  # Show first 10 items
        except Exception as dir_error:
            logger.warning(f"🧠 Could not list directory contents: {dir_error}")
        
        # Transcribe audio using SpeechBrain
        logger.info("🧠 Calling SpeechBrain transcribe_file...")
        transcription = speechbrain_model.transcribe_file(audio_file_path)
        
        logger.info(f"✅ SpeechBrain transcription completed: {transcription}")
        return transcription
        
    except Exception as e:
        logger.error(f"❌ SpeechBrain transcription error: {e}")
        logger.error(f"❌ Error type: {type(e).__name__}")
        logger.error(f"❌ Error details: {str(e)}")
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

def transcribe_with_openai_whisper(audio_file_path):
    """
    Transcribe audio using OpenAI Whisper via Replicate API
    """
    if not REPLICATE_AVAILABLE:
        logger.error("Replicate not available")
        raise Exception("Replicate API not available")
    
    try:
        logger.info("🤖 Using OpenAI Whisper for transcription...")
        
        # Check if file exists
        if not os.path.exists(audio_file_path):
            raise Exception(f"Audio file not found: {audio_file_path}")
        
        # Get file size for debugging
        file_size = os.path.getsize(audio_file_path)
        logger.info(f"🤖 Audio file size: {file_size} bytes")
        logger.info(f"🤖 Audio file path: {audio_file_path}")
        
        # Verify it's a WAV file (should be converted by endpoint)
        if not audio_file_path.lower().endswith('.wav'):
            logger.warning(f"⚠️ Audio file is not WAV format: {audio_file_path}")
        
        # Open the audio file for Replicate
        with open(audio_file_path, 'rb') as audio_file:
            logger.info("🤖 Sending WAV audio to OpenAI Whisper via Replicate...")
            
            # Run OpenAI Whisper model
            output = replicate.run(
                "openai/whisper:8099696689d249cf8b122d833c36ac3f75505c666a395ca40ef26f68e7d3d16e",
                input={"audio": audio_file}
            )
            
            logger.info(f"✅ OpenAI Whisper transcription completed")
            
            # Extract transcription text from output
            if isinstance(output, dict) and 'segments' in output:
                # If output has segments, concatenate all text
                transcription_text = ' '.join([segment.get('text', '').strip() for segment in output['segments']])
            elif isinstance(output, str):
                # If output is directly a string
                transcription_text = output
            else:
                # Fallback: try to extract text from any format
                transcription_text = str(output)
            
            logger.info(f"🤖 Transcription: {transcription_text}")
            
            return transcription_text.strip()
        
    except Exception as e:
        logger.error(f"❌ OpenAI Whisper transcription error: {e}")
        logger.error(f"❌ Error type: {type(e).__name__}")
        logger.error(f"❌ Error details: {str(e)}")
        raise e

@app.route('/health', methods=['GET'])
def health_check():
    logger.info("Health check endpoint called")
    return jsonify({
        'status': 'healthy',
        'message': 'Flask server is running with OpenAI Whisper transcription',
        'speechbrain_available': SPEECHBRAIN_AVAILABLE,
        'replicate_available': REPLICATE_AVAILABLE,
        'model_loaded': speechbrain_model is not None,
        'transcription_count': len(transcription_results),
        'timestamp': datetime.now().isoformat()
    })

@app.route('/transcribe-audio', methods=['POST'])
def transcribe_audio():
    """Transcribe audio files using OpenAI Whisper"""
    logger.info("=== OPENAI WHISPER TRANSCRIPTION REQUEST STARTED ===")
    
    # Track all temporary files for cleanup
    temp_files_to_cleanup = []
    
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
        
        # Create temporary files for transcription
        logger.info("Creating temporary audio files for transcription...")
        temp_file_path = None
        wav_file_path = None
        transcription_file_path = None
        
        try:
            # Create temporary file with original format first
            with tempfile.NamedTemporaryFile(suffix=f'.{audio_format}', delete=False) as temp_file:
                temp_file.write(decoded_audio)
                temp_file_path = temp_file.name
                temp_files_to_cleanup.append(temp_file_path)
            
            logger.info(f"Temporary file created: {temp_file_path}")
            logger.info(f"Temporary file absolute path: {os.path.abspath(temp_file_path)}")
            
            # Convert to WAV format for optimal Whisper performance
            if audio_format.lower() != 'wav':
                logger.info("🔄 Converting audio to WAV format for optimal Whisper performance...")
                try:
                    wav_file_path = convert_audio_format(temp_file_path, 'wav')
                    if wav_file_path != temp_file_path:  # Only add if it's a new file
                        temp_files_to_cleanup.append(wav_file_path)
                    transcription_file_path = wav_file_path
                    logger.info(f"WAV file created: {wav_file_path}")
                except Exception as conversion_error:
                    logger.error(f"❌ Audio conversion failed: {conversion_error}")
                    logger.warning("⚠️ Using original file format for transcription")
                    transcription_file_path = temp_file_path
            else:
                transcription_file_path = temp_file_path
                wav_file_path = None
                
        except Exception as e:
            logger.error(f"Failed to create temporary audio file: {e}")
            return jsonify({
                'status': 'error',
                'message': f'Failed to process audio file: {str(e)}'
            }), 500
        
        # Verify transcription file exists before proceeding
        if not os.path.exists(transcription_file_path):
            logger.error(f"Transcription file does not exist: {transcription_file_path}")
            return jsonify({
                'status': 'error',
                'message': f'Transcription file not found: {transcription_file_path}'
            }), 500
        
        logger.info(f"✅ Transcription file verified: {transcription_file_path}")
        
        try:
            # Determine transcription service to use
            transcription_service = data.get('service', 'openai_whisper')
            logger.info(f"Using transcription service: {transcription_service}")
            
            transcription_text = None
            
            # Check if Replicate API token is available
            replicate_token_available = os.environ.get('REPLICATE_API_TOKEN') is not None
            if not replicate_token_available:
                logger.warning("⚠️ REPLICATE_API_TOKEN not set - OpenAI Whisper will be skipped")
            
            # Try OpenAI Whisper first (only if token is available)
            if transcription_service == 'openai_whisper' and REPLICATE_AVAILABLE and replicate_token_available:
                try:
                    logger.info("🤖 Using OpenAI Whisper for transcription...")
                    transcription_text = transcribe_with_openai_whisper(transcription_file_path)
                    transcription_service = 'openai_whisper'
                except Exception as whisper_error:
                    logger.error(f"❌ OpenAI Whisper failed: {whisper_error}")
                    logger.info("🔄 Falling back to other services...")
            elif transcription_service == 'openai_whisper' and not replicate_token_available:
                logger.warning("⚠️ Skipping OpenAI Whisper - API token not configured")
                logger.info("🔄 Falling back to other services...")
            
            # Try SpeechBrain if Whisper failed or was not requested
            if transcription_text is None and speechbrain_model:
                try:
                    logger.info("🧠 Using SpeechBrain for transcription...")
                    # For SpeechBrain, we might need a different WAV conversion
                    if audio_format.lower() != 'wav':
                        logger.info("🔄 Converting audio to WAV format for SpeechBrain...")
                        try:
                            sb_wav_file_path = convert_audio_format(temp_file_path, 'wav')
                            if sb_wav_file_path != temp_file_path:
                                temp_files_to_cleanup.append(sb_wav_file_path)
                            transcription_text = transcribe_with_speechbrain(sb_wav_file_path)
                        except Exception as sb_conversion_error:
                            logger.error(f"❌ SpeechBrain WAV conversion failed: {sb_conversion_error}")
                            # Try with original file if conversion fails
                            transcription_text = transcribe_with_speechbrain(temp_file_path)
                    else:
                        transcription_text = transcribe_with_speechbrain(temp_file_path)
                    transcription_service = 'speechbrain'
                except Exception as sb_error:
                    logger.error(f"❌ SpeechBrain failed: {sb_error}")
                    logger.info("🔄 Falling back to Google Speech Recognition...")
            
            # Try Google Speech Recognition as final fallback
            if transcription_text is None:
                try:
                    logger.info("🔄 Using Google Speech Recognition fallback...")
                    # Google Speech Recognition requires WAV format, so try to convert if needed
                    google_audio_path = temp_file_path
                    if audio_format.lower() != 'wav':
                        logger.info("🔄 Converting audio to WAV format for Google Speech Recognition...")
                        try:
                            google_wav_file_path = convert_audio_format(temp_file_path, 'wav')
                            if google_wav_file_path != temp_file_path:
                                temp_files_to_cleanup.append(google_wav_file_path)
                                google_audio_path = google_wav_file_path
                        except Exception as google_conversion_error:
                            logger.error(f"❌ Google Speech Recognition WAV conversion failed: {google_conversion_error}")
                            logger.warning("⚠️ Trying Google Speech Recognition with original format...")
                    
                    transcription_text = transcribe_with_google_fallback(google_audio_path)
                    transcription_service = 'google_fallback'
                except Exception as google_error:
                    logger.error(f"❌ Google Speech Recognition failed: {google_error}")
                    
                    # Provide helpful error message based on the failure
                    if "Audio file could not be read as PCM WAV" in str(google_error):
                        error_msg = "Audio format not supported. Please install FFmpeg for M4A support or record in WAV format."
                    else:
                        error_msg = "All transcription services failed. Please check your internet connection and try again."
                    
                    raise Exception(error_msg)
            
            if transcription_text is None:
                raise Exception("No transcription service succeeded")
            
            # Store transcription in global variable
            transcription_result = {
                'timestamp': timestamp,
                'transcription': transcription_text,
                'audio_size': len(decoded_audio),
                'service': transcription_service,
                'word_count': len(str(transcription_text).split()),
                'character_count': len(str(transcription_text))
            }
            
            transcription_results.append(transcription_result)
            logger.info(f"📝 Transcription stored in memory: {transcription_text}")
            
            # Calculate word and character counts
            word_count = transcription_result['word_count']
            character_count = transcription_result['character_count']
            
            logger.info(f"Word count: {word_count}")
            logger.info(f"Character count: {character_count}")
            
            # Save transcription to file
            service_name = transcription_service.replace('_', '_')
            transcription_filename = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{service_name}_transcription.txt"
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
        
        except Exception as transcription_error:
            logger.error(f"All transcription services failed: {transcription_error}")
            return jsonify({
                'status': 'error',
                'message': f'Transcription failed: {str(transcription_error)}'
            }), 500
    
    except Exception as e:
        logger.error(f"Unexpected error during transcription: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Unexpected error: {str(e)}'
        }), 500
    
    finally:
        # Clean up all temporary files at the very end
        logger.info("🧹 Cleaning up temporary files...")
        for temp_file in temp_files_to_cleanup:
            try:
                if temp_file and os.path.exists(temp_file):
                    os.unlink(temp_file)
                    logger.info(f"✅ Temporary file cleaned up: {temp_file}")
                elif temp_file:
                    logger.warning(f"⚠️ Temporary file already deleted: {temp_file}")
            except Exception as cleanup_error:
                logger.warning(f"⚠️ Failed to clean up temporary file {temp_file}: {cleanup_error}")
        
        logger.info("=== OPENAI WHISPER TRANSCRIPTION REQUEST COMPLETED ===")

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
            'word_count': len(str(transcription_text).split()),
            'character_count': len(str(transcription_text))
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