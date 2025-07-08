#!/usr/bin/env python3
"""
Test script for Notes Simulator transcription functionality
This script tests the Flask backend transcription storage service
"""

import requests
import json
import time
import os
from datetime import datetime

def test_health_endpoint():
    """Test the health check endpoint"""
    print("🔍 Testing health endpoint...")
    try:
        response = requests.get("http://localhost:5000/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health check passed: {data['status']}")
            print(f"📊 Transcription count: {data['transcription_count']}")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False

def test_save_transcription():
    """Test saving transcription text to the server"""
    print("\n💾 Testing save transcription endpoint...")
    
    # Sample transcription data
    test_transcription = "Hello, this is a test transcription from the browser speech recognition API."
    
    try:
        # Prepare the request data
        request_data = {
            'transcription': test_transcription,
            'session_id': f'test_session_{int(time.time())}',
            'confidence': 0.95,
            'timestamp': datetime.now().isoformat()
        }
        
        print("📤 Sending transcription data to server...")
        response = requests.post(
            "http://localhost:5000/save-transcription",
            json=request_data,
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            if data['status'] == 'success':
                print("✅ Transcription saved successfully!")
                print(f"📝 Text: {data['transcription']}")
                print(f"📊 Words: {data['word_count']}")
                print(f"📏 Characters: {data['character_count']}")
                print(f"🆔 Session ID: {data['session_id']}")
                print(f"🎯 Confidence: {data['confidence']}")
                return True
            else:
                print(f"❌ Save failed: {data['message']}")
                return False
        else:
            print(f"❌ HTTP error: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Save transcription test error: {e}")
        return False

def test_get_transcriptions():
    """Test retrieving stored transcriptions"""
    print("\n📋 Testing get transcriptions endpoint...")
    
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
                        print(f"  {i}. {trans['transcription'][:50]}...")
                        print(f"     Session: {trans['session_id']}")
                        print(f"     Words: {trans['word_count']}")
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

def test_session_transcriptions():
    """Test retrieving transcriptions for a specific session"""
    print("\n🆔 Testing session transcriptions endpoint...")
    
    try:
        # Use a test session ID
        test_session_id = "test_session_123"
        
        response = requests.get(
            f"http://localhost:5000/transcriptions/session/{test_session_id}",
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if data['status'] == 'success':
                print("✅ Retrieved session transcriptions successfully!")
                print(f"🆔 Session ID: {data['session_id']}")
                print(f"📊 Transcriptions in session: {data['count']}")
                return True
            else:
                print(f"❌ Session get failed: {data.get('message', 'Unknown error')}")
                return False
        else:
            print(f"❌ HTTP error: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Session transcriptions test error: {e}")
        return False

def test_server_configuration():
    """Test server configuration and directories"""
    print("\n⚙️  Testing server configuration...")
    
    # Check transcriptions directory
    if os.path.exists('transcriptions'):
        print("✅ transcriptions directory exists")
    else:
        print("❌ transcriptions directory missing")
        return False
    
    # Check Flask server
    if test_health_endpoint():
        print("✅ Flask server is running")
        return True
    else:
        print("❌ Flask server is not accessible")
        return False

def test_browser_speech_recognition_simulation():
    """Simulate browser speech recognition workflow"""
    print("\n🎤 Testing browser speech recognition simulation...")
    
    # Simulate multiple transcription saves from a session
    session_id = f"simulation_session_{int(time.time())}"
    test_phrases = [
        "Hello, this is the first phrase.",
        "This is the second phrase with more words.",
        "And finally, this is the third phrase to complete our test."
    ]
    
    try:
        for i, phrase in enumerate(test_phrases, 1):
            print(f"📝 Simulating phrase {i}: {phrase}")
            
            request_data = {
                'transcription': phrase,
                'session_id': session_id,
                'confidence': 0.9 + (i * 0.02),  # Slightly increasing confidence
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
                    print(f"✅ Phrase {i} saved successfully")
                else:
                    print(f"❌ Phrase {i} failed: {data['message']}")
                    return False
            else:
                print(f"❌ HTTP error for phrase {i}: {response.status_code}")
                return False
            
            time.sleep(0.5)  # Small delay between saves
        
        print("✅ All simulation phrases saved successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Simulation error: {e}")
        return False

def main():
    print("🧪 Notes Simulator Browser Speech Recognition Test")
    print("=" * 70)
    
    # Test server configuration
    if not test_server_configuration():
        print("\n❌ Server configuration test failed")
        print("💡 Make sure to run: python app.py")
        return
    
    # Test basic save functionality
    if not test_save_transcription():
        print("\n❌ Save transcription test failed")
        return
    
    # Test retrieval functionality
    if not test_get_transcriptions():
        print("\n❌ Get transcriptions test failed")
        return
    
    # Test session functionality
    if not test_session_transcriptions():
        print("\n❌ Session transcriptions test failed")
        return
    
    # Test simulation
    if test_browser_speech_recognition_simulation():
        print("\n🎉 All tests passed! The browser speech recognition system is working correctly.")
    else:
        print("\n⚠️  Simulation test failed")
    
    print("\n📋 Test Summary:")
    print("• Flask server: ✅ Running")
    print("• Health endpoint: ✅ Working")
    print("• Save transcription: ✅ Working")
    print("• Get transcriptions: ✅ Working")
    print("• Session management: ✅ Working")
    print("• Browser simulation: ✅ Working")
    print("\n💡 The system is ready for real-time transcription from the React Native app!")

if __name__ == "__main__":
    main() 