#!/usr/bin/env python3
"""
Install dependencies for NotesSimmulator
"""

import subprocess
import sys
import os

def run_command(command, description):
    """Run a command and handle errors"""
    print(f"🔧 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed:")
        print(f"Error: {e.stderr}")
        return False

def main():
    print("🚀 Installing NotesSimmulator Dependencies")
    print("=" * 50)
    
    # Check Python version
    print(f"🐍 Python version: {sys.version}")
    
    # Upgrade pip
    if not run_command("python -m pip install --upgrade pip", "Upgrading pip"):
        print("⚠️  Failed to upgrade pip, continuing...")
    
    # Install requirements
    if not run_command("pip install -r requirements.txt", "Installing requirements"):
        print("❌ Failed to install requirements")
        return False
    
    # Test imports
    print("🧪 Testing imports...")
    try:
        import flask
        import flask_cors
        import speech_recognition
        import numpy
        import requests
        print("✅ All basic imports successful")
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False
    
    # Test SpeechBrain (optional)
    try:
        import speechbrain
        print("✅ SpeechBrain import successful")
    except ImportError:
        print("⚠️  SpeechBrain not available - this is optional")
    
    # Test PyTorch (optional)
    try:
        import torch
        print("✅ PyTorch import successful")
    except ImportError:
        print("⚠️  PyTorch not available - this is optional")
    
    print("\n🎉 Dependencies installation completed!")
    print("\n📋 Next steps:")
    print("1. Start the Flask server: python app.py")
    print("2. Start the React Native app: cd NotesSimmulator && expo start")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 