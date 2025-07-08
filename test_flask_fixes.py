#!/usr/bin/env python3
"""
Test script to verify Flask server fixes for audio transcription
"""

import os
import tempfile
import base64
import requests
import json
import time

def test_temp_file_creation():
    """Test temporary file creation and path handling"""
    print("🧪 Testing temporary file creation...")
    
    try:
        # Create a test audio file
        test_audio_data = b"fake audio data for testing"
        test_audio_b64 = base64.b64encode(test_audio_data).decode('utf-8')
        
        # Create temporary file using the same method as Flask
        with tempfile.NamedTemporaryFile(suffix='.m4a', delete=False) as temp_file:
            temp_file.write(test_audio_data)
            temp_file_path = temp_file.name
        
        print(f"✅ Temporary file created: {temp_file_path}")
        print(f"✅ Absolute path: {os.path.abspath(temp_file_path)}")
        print(f"✅ File exists: {os.path.exists(temp_file_path)}")
        print(f"✅ File size: {os.path.getsize(temp_file_path)} bytes")
        print(f"✅ Is absolute: {os.path.isabs(temp_file_path)}")
        
        # Clean up
        os.unlink(temp_file_path)
        print("✅ File cleaned up")
        
        return True
    except Exception as e:
        print(f"❌ Temp file test failed: {e}")
        return False

def test_server_health():
    """Test server health endpoint"""
    print("\n🌐 Testing server health...")
    
    try:
        response = requests.get('http://localhost:5000/health', timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Server health check successful")
            print(f"✅ SpeechBrain available: {data.get('speechbrain_available', False)}")
            print(f"✅ Replicate available: {data.get('replicate_available', False)}")
            print(f"✅ Model loaded: {data.get('model_loaded', False)}")
            return True
        else:
            print(f"❌ Server health check failed: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to server. Is it running?")
        return False
    except Exception as e:
        print(f"❌ Server test failed: {e}")
        return False

def test_replicate_setup():
    """Test Replicate API setup"""
    print("\n🤖 Testing Replicate API setup...")
    
    try:
        import replicate
        
        # Check if API token is set
        api_token = os.getenv('REPLICATE_API_TOKEN')
        if not api_token:
            print("❌ REPLICATE_API_TOKEN not set")
            print("💡 Set it with: export REPLICATE_API_TOKEN=r8_your_token_here")
            return False
        
        if not api_token.startswith('r8_'):
            print("❌ Invalid API token format (should start with 'r8_')")
            return False
        
        print(f"✅ Replicate API token found: {api_token[:10]}...")
        print("✅ Replicate library imported successfully")
        return True
        
    except ImportError:
        print("❌ Replicate library not installed")
        print("💡 Install with: pip install replicate")
        return False
    except Exception as e:
        print(f"❌ Replicate test failed: {e}")
        return False

def test_transcription_endpoint():
    """Test transcription endpoint with mock data"""
    print("\n🎤 Testing transcription endpoint...")
    
    try:
        # Create mock audio data
        test_audio_data = b"fake audio data for testing"
        test_audio_b64 = base64.b64encode(test_audio_data).decode('utf-8')
        
        # Prepare request data
        request_data = {
            'audio_data': test_audio_b64,
            'audio_format': 'm4a',
            'timestamp': time.time(),
            'service': 'openai_whisper'
        }
        
        # Send request
        response = requests.post(
            'http://localhost:5000/transcribe-audio',
            json=request_data,
            timeout=30
        )
        
        print(f"📊 Response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Transcription successful")
            print(f"✅ Service used: {data.get('service', 'unknown')}")
            print(f"✅ Word count: {data.get('word_count', 0)}")
            return True
        else:
            try:
                error_data = response.json()
                print(f"❌ Transcription failed: {error_data.get('message', 'Unknown error')}")
            except:
                print(f"❌ Transcription failed: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to server. Is it running?")
        return False
    except Exception as e:
        print(f"❌ Transcription test failed: {e}")
        return False

def run_all_tests():
    """Run all tests"""
    print("🧪 Running Flask server and Replicate API tests...\n")
    
    results = {
        'temp_file': test_temp_file_creation(),
        'server_health': test_server_health(),
        'replicate_setup': test_replicate_setup(),
        'transcription': test_transcription_endpoint(),
    }
    
    print("\n📊 Test Results:")
    print(f"Temp File Creation: {'✅ PASS' if results['temp_file'] else '❌ FAIL'}")
    print(f"Server Health: {'✅ PASS' if results['server_health'] else '❌ FAIL'}")
    print(f"Replicate Setup: {'✅ PASS' if results['replicate_setup'] else '❌ FAIL'}")
    print(f"Transcription Endpoint: {'✅ PASS' if results['transcription'] else '❌ FAIL'}")
    
    all_passed = all(results.values())
    print(f"\n🎯 Overall Result: {'✅ ALL TESTS PASSED' if all_passed else '❌ SOME TESTS FAILED'}")
    
    if not all_passed:
        print("\n🔧 Next Steps:")
        if not results['replicate_setup']:
            print("1. Get Replicate API token from https://replicate.com/account/api-tokens")
            print("2. Set environment variable: export REPLICATE_API_TOKEN=r8_your_token_here")
        if not results['server_health']:
            print("3. Start Flask server: python app.py")
        if not results['transcription']:
            print("4. Check server logs for detailed error messages")
    
    return all_passed

if __name__ == "__main__":
    run_all_tests() 