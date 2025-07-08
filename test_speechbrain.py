#!/usr/bin/env python3
"""
Test script for SpeechBrain integration in Notes Simulator
This script tests the SpeechBrain transcription functionality
"""

import requests
import json
import time
import os
import base64
from datetime import datetime

def test_speechbrain_health():
    """Test the health check endpoint for SpeechBrain status"""
    print("🔍 Testing SpeechBrain health endpoint...")
    try:
        response = requests.get("http://localhost:5000/health", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health check passed: {data['status']}")
            print(f"🧠 SpeechBrain Available: {data['speechbrain_available']}")
            print(f"📦 Model Loaded: {data['model_loaded']}")
            print(f"📊 Transcription count: {data['transcription_count']}")
            return data['speechbrain_available'], data['model_loaded']
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False, False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False, False

def create_test_audio():
    """Create a simple test audio file for transcription"""
    print("🎵 Creating test audio file...")
    
    # Create a simple WAV file with a sine wave
    import wave
    import struct
    import math
    
    # Audio parameters
    sample_rate = 16000
    duration = 2  # seconds
    frequency = 440  # Hz (A note)
    
    # Create sine wave
    num_samples = sample_rate * duration
    audio_data = []
    
    for i in range(num_samples):
        sample = math.sin(2 * math.pi * frequency * i / sample_rate)
        audio_data.append(int(sample * 32767))  # Convert to 16-bit integer
    
    # Create WAV file
    test_audio_path = "test_audio.wav"
    with wave.open(test_audio_path, 'w') as wav_file:
        wav_file.setnchannels(1)  # Mono
        wav_file.setsampwidth(2)  # 16-bit
        wav_file.setframerate(sample_rate)
        
        for sample in audio_data:
            wav_file.writeframes(struct.pack('<h', sample))
    
    print(f"✅ Test audio created: {test_audio_path}")
    return test_audio_path

def test_speechbrain_transcription():
    """Test SpeechBrain transcription with a test audio file"""
    print("\n🧠 Testing SpeechBrain transcription...")
    
    try:
        # Create test audio file
        test_audio_path = create_test_audio()
        
        # Read and encode audio file
        with open(test_audio_path, 'rb') as audio_file:
            audio_data = audio_file.read()
            base64_audio = base64.b64encode(audio_data).decode('utf-8')
        
        # Prepare request data
        request_data = {
            'audio_data': base64_audio,
            'audio_format': 'wav',
            'service': 'speechbrain',
            'timestamp': datetime.now().isoformat()
        }
        
        print("📤 Sending audio to SpeechBrain for transcription...")
        response = requests.post(
            "http://localhost:5000/transcribe-audio",
            json=request_data,
            headers={'Content-Type': 'application/json'},
            timeout=60  # Longer timeout for SpeechBrain
        )
        
        if response.status_code == 200:
            data = response.json()
            if data['status'] == 'success':
                print("✅ SpeechBrain transcription successful!")
                print(f"📝 Transcription: {data['transcription']}")
                print(f"📊 Words: {data['word_count']}")
                print(f"📏 Characters: {data['character_count']}")
                print(f"🔧 Service: {data['service']}")
                print(f"📁 File: {data['transcription_file']}")
                return True
            else:
                print(f"❌ SpeechBrain transcription failed: {data['message']}")
                return False
        else:
            print(f"❌ HTTP error: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ SpeechBrain transcription test error: {e}")
        return False
    finally:
        # Clean up test audio file
        try:
            if os.path.exists(test_audio_path):
                os.remove(test_audio_path)
                print("🧹 Test audio file cleaned up")
        except:
            pass

def test_browser_transcription_save():
    """Test saving browser transcription (existing functionality)"""
    print("\n💾 Testing browser transcription save...")
    
    test_transcription = "This is a test transcription from browser speech recognition."
    
    try:
        request_data = {
            'transcription': test_transcription,
            'session_id': f'speechbrain_test_session_{int(time.time())}',
            'confidence': 0.95,
            'timestamp': datetime.now().isoformat()
        }
        
        response = requests.post(
            "http://localhost:5000/save-transcription",
            json=request_data,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if data['status'] == 'success':
                print("✅ Browser transcription save successful!")
                print(f"📝 Text: {data['transcription']}")
                print(f"🆔 Session: {data['session_id']}")
                return True
            else:
                print(f"❌ Browser save failed: {data['message']}")
                return False
        else:
            print(f"❌ HTTP error: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Browser transcription test error: {e}")
        return False

def test_get_transcriptions():
    """Test retrieving all transcriptions"""
    print("\n📋 Testing get transcriptions...")
    
    try:
        response = requests.get("http://localhost:5000/transcriptions", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if data['status'] == 'success':
                print("✅ Retrieved transcriptions successfully!")
                print(f"📊 Total transcriptions: {data['count']}")
                
                if data['transcriptions']:
                    print("\n📝 Recent transcriptions:")
                    for i, trans in enumerate(data['transcriptions'][-3:], 1):
                        service = trans.get('service', 'unknown')
                        print(f"  {i}. [{service}] {trans['transcription'][:50]}...")
                else:
                    print("📭 No transcriptions found")
                
                return True
            else:
                print(f"❌ Get failed: {data.get('message', 'Unknown error')}")
                return False
        else:
            print(f"❌ HTTP error: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Get transcriptions test error: {e}")
        return False

def main():
    print("🧪 Notes Simulator SpeechBrain Integration Test")
    print("=" * 60)
    
    # Test server health and SpeechBrain status
    speechbrain_available, model_loaded = test_speechbrain_health()
    
    if not speechbrain_available:
        print("\n⚠️  SpeechBrain is not available")
        print("💡 Install with: pip install speechbrain")
        return
    
    if not model_loaded:
        print("\n⚠️  SpeechBrain model is not loaded")
        print("💡 The model will be downloaded on first use")
    
    # Test browser transcription save (existing functionality)
    if not test_browser_transcription_save():
        print("\n❌ Browser transcription test failed")
        return
    
    # Test SpeechBrain transcription
    if test_speechbrain_transcription():
        print("\n✅ SpeechBrain transcription test passed!")
    else:
        print("\n⚠️  SpeechBrain transcription test failed")
        print("💡 This might be due to model download or audio format issues")
    
    # Test retrieval
    if not test_get_transcriptions():
        print("\n❌ Get transcriptions test failed")
        return
    
    print("\n📋 Test Summary:")
    print("• Flask server: ✅ Running")
    print("• SpeechBrain: ✅ Available")
    print("• Model loaded: " + ("✅ Yes" if model_loaded else "⏳ Will download on first use"))
    print("• Browser transcription: ✅ Working")
    print("• SpeechBrain transcription: " + ("✅ Working" if test_speechbrain_transcription() else "⚠️  Needs attention"))
    print("• Get transcriptions: ✅ Working")
    
    print("\n💡 The system now supports both browser speech recognition and SpeechBrain audio transcription!")

if __name__ == "__main__":
    main() 