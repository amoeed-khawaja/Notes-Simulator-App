#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Simple test script to verify transcription functionality
"""

import requests
import json
import base64
import os

def test_transcription():
    """Test the transcription endpoint"""
    print("🧪 Testing Transcription Functionality...")
    
    # Check if server is running
    try:
        health_response = requests.get('http://localhost:5000/health')
        if health_response.status_code == 200:
            health_data = health_response.json()
            print("✅ Flask server is running")
            print(f"   - Replicate available: {health_data.get('replicate_available')}")
            print(f"   - SpeechBrain available: {health_data.get('speechbrain_available')}")
            print(f"   - Model loaded: {health_data.get('model_loaded')}")
        else:
            print("❌ Flask server is not responding properly")
            return False
    except Exception as e:
        print(f"❌ Cannot connect to Flask server: {e}")
        return False
    
    # Test with a simple audio file (if available)
    test_audio_path = "NotesSimmulator/test_audio.wav"
    
    if os.path.exists(test_audio_path):
        print(f"📁 Found test audio file: {test_audio_path}")
        
        try:
            # Read and encode the audio file
            with open(test_audio_path, 'rb') as f:
                audio_data = f.read()
            
            audio_base64 = base64.b64encode(audio_data).decode('utf-8')
            
            # Prepare the request
            payload = {
                'audio_data': audio_base64,
                'audio_format': 'wav',
                'service': 'openai_whisper'
            }
            
            print("🔄 Sending transcription request...")
            
            # Send the request
            response = requests.post(
                'http://localhost:5000/transcribe-audio',
                json=payload,
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 200:
                result = response.json()
                print("✅ Transcription successful!")
                print(f"   - Service used: {result.get('service')}")
                print(f"   - Transcription: {result.get('transcription')}")
                print(f"   - Word count: {result.get('word_count')}")
                return True
            else:
                print(f"❌ Transcription failed: {response.status_code}")
                print(f"   - Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Test failed: {e}")
            return False
    else:
        print("⚠️ No test audio file found")
        print("💡 You can test with your React Native app now")
        return True

if __name__ == "__main__":
    test_transcription() 