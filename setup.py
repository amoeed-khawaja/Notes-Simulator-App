#!/usr/bin/env python3
"""
Setup script for Notes Simulator Flask Backend
This script helps configure the Flask server IP for React Native app
"""

import socket
import requests
import json
import os
import sys

def get_local_ip():
    """Get the local IP address of the computer"""
    try:
        # Connect to a remote address to determine local IP
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
        return local_ip
    except Exception:
        return "127.0.0.1"

def test_server_connection(ip_address, port=5000):
    """Test if the Flask server is accessible"""
    try:
        url = f"http://{ip_address}:{port}/health"
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            return True, response.json()
        else:
            return False, f"Server responded with status code: {response.status_code}"
    except requests.exceptions.ConnectionError:
        return False, "Connection refused - server may not be running"
    except requests.exceptions.Timeout:
        return False, "Connection timeout"
    except Exception as e:
        return False, f"Error: {str(e)}"

def update_react_native_config(ip_address):
    """Update the React Native app configuration with the correct IP"""
    config_file = "NotesSimmulator/AppPages/NewRecordingScreen.js"
    
    if not os.path.exists(config_file):
        print(f"❌ React Native config file not found: {config_file}")
        return False
    
    try:
        with open(config_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Update the FLASK_SERVER_URL
        import re
        pattern = r'const FLASK_SERVER_URL = "http://[^"]+";'
        replacement = f'const FLASK_SERVER_URL = "http://{ip_address}:5000";'
        
        if re.search(pattern, content):
            new_content = re.sub(pattern, replacement, content)
            
            with open(config_file, 'w', encoding='utf-8') as f:
                f.write(new_content)
            
            print(f"✅ Updated React Native config with IP: {ip_address}")
            return True
        else:
            print("⚠️  Could not find FLASK_SERVER_URL in config file")
            return False
            
    except Exception as e:
        print(f"❌ Error updating React Native config: {e}")
        return False

def main():
    print("🚀 Notes Simulator Setup Script")
    print("=" * 50)
    
    # Get local IP
    local_ip = get_local_ip()
    print(f"📍 Your local IP address: {local_ip}")
    
    # Test server connection
    print(f"\n🔗 Testing Flask server connection...")
    is_accessible, result = test_server_connection(local_ip)
    
    if is_accessible:
        print(f"✅ Flask server is accessible at http://{local_ip}:5000")
        if isinstance(result, dict):
            print(f"📊 Server status: {result.get('status', 'unknown')}")
            print(f"⏰ Server time: {result.get('timestamp', 'unknown')}")
        else:
            print(f"📊 Server response: {result}")
    else:
        print(f"❌ Flask server is not accessible: {result}")
        print("\n💡 To start the Flask server, run:")
        print("   python app.py")
        return
    
    # Update React Native config
    print(f"\n📱 Updating React Native configuration...")
    if update_react_native_config(local_ip):
        print("✅ React Native app configured successfully!")
    else:
        print("⚠️  Manual configuration required")
        print(f"   Update FLASK_SERVER_URL in NotesSimmulator/AppPages/NewRecordingScreen.js")
        print(f"   Set it to: http://{local_ip}:5000")
    
    print(f"\n🎯 Next steps:")
    print(f"1. Make sure your phone and computer are on the same WiFi network")
    print(f"2. Start the React Native app: npx expo start")
    print(f"3. Test the connection using the 'Test Server Connection' button")
    print(f"4. Try recording and transcribing audio")
    
    print(f"\n📋 Configuration Summary:")
    print(f"   Flask Server: http://{local_ip}:5000")
    print(f"   Upload Folder: uploads/")
    print(f"   Transcriptions Folder: transcriptions/")

if __name__ == "__main__":
    main() 