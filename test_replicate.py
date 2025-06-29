#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test script to verify Replicate API token is working
"""

import os
import replicate

def test_replicate_token():
    """Test if Replicate API token is set and working"""
    print("🧪 Testing Replicate API Token...")
    
    # Check if token is set
    token = os.environ.get('REPLICATE_API_TOKEN')
    if not token:
        print("❌ REPLICATE_API_TOKEN not found in environment variables")
        print("💡 Set it with: $env:REPLICATE_API_TOKEN='your_token_here'")
        return False
    
    print(f"✅ Token found: {token[:10]}...{token[-4:]}")
    
    # Test with a simple API call
    try:
        print("🔄 Testing API connection...")
        
        # Use the example from your data
        input_data = {
            "audio": "https://replicate.delivery/mgxm/e5159b1b-508a-4be4-b892-e1eb47850bdc/OSR_uk_000_0050_8k.wav"
        }
        
        output = replicate.run(
            "openai/whisper:8099696689d249cf8b122d833c36ac3f75505c666a395ca40ef26f68e7d3d16e",
            input=input_data
        )
        
        print("✅ API test successful!")
        print(f"📝 Transcription result: {output}")
        return True
        
    except Exception as e:
        print(f"❌ API test failed: {e}")
        return False

if __name__ == "__main__":
    test_replicate_token() 