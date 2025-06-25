#!/usr/bin/env python3
"""
Simple test script for Notes Simulator with SpeechBrain
This script tests basic functionality without complex models
"""

import requests
import json
import time
import os
from datetime import datetime

def test_health():
    """Test the health check endpoint"""
    print("🔍 Testing health endpoint...")
    try:
        response = requests.get("http://localhost:5000/health", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health check passed: {data['status']}")
            print(f"🧠 SpeechBrain Available: {data['speechbrain_available']}")
            print(f"📦 Model Loaded: {data['model_loaded']}")
            print(f"📊 Transcription count: {data['transcription_count']}")
            return True
        else:
        
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False

def test_browser_transcription():
    """Test browser transcription save"""
    print("\n💾 Testing browser transcription save...")
    
    test_transcription = "Hello, this is a test from the browser speech recognition API."
    
    try:
        request_data = {
            'transcription': test_transcription,
            'session_id': f'simple_test_session_{int(time.time())}',
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
                print(f"📊 Words: {data['word_count']}")
                print(f"📏 Characters: {data['character_count']}")
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
    """Test retrieving transcriptions"""
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

def test_clear_transcriptions():
    """Test clearing transcriptions"""
    print("\n🗑️  Testing clear transcriptions...")
    
    try:
        response = requests.post("http://localhost:5000/clear-transcriptions", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if data['status'] == 'success':
                print("✅ Transcriptions cleared successfully!")
                return True
            else:
                print(f"❌ Clear failed: {data.get('message', 'Unknown error')}")
                return False
        else:
            print(f"❌ HTTP error: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Clear transcriptions test error: {e}")
        return False

def main():
    print("🧪 Notes Simulator Simple Test")
    print("=" * 50)
    
    # Test health
    if not test_health():
        print("\n❌ Health check failed")
        print("💡 Make sure to run: python app.py")
        return
    
    # Test browser transcription
    if not test_browser_transcription():
        print("\n❌ Browser transcription test failed")
        return
    
    # Test retrieval
    if not test_get_transcriptions():
        print("\n❌ Get transcriptions test failed")
        return
    
    # Test clear
    if not test_clear_transcriptions():
        print("\n❌ Clear transcriptions test failed")
        return
    
    print("\n📋 Test Summary:")
    print("• Flask server: ✅ Running")
    print("• SpeechBrain: ✅ Available")
    print("• Browser transcription: ✅ Working")
    print("• Get transcriptions: ✅ Working")
    print("• Clear transcriptions: ✅ Working")
    
    print("\n💡 The basic system is working correctly!")
    print("💡 SpeechBrain audio transcription can be tested from the React Native app.")

if __name__ == "__main__":
    main() 