#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
FFmpeg Installation Helper Script

This script helps install FFmpeg on Windows for audio conversion support.
FFmpeg is required for pydub to handle M4A audio files.
"""

import os
import sys
import subprocess
import platform

def check_ffmpeg():
    """Check if FFmpeg is already installed"""
    try:
        result = subprocess.run(['ffmpeg', '-version'], 
                              capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            print("✅ FFmpeg is already installed!")
            print(f"Version: {result.stdout.split('ffmpeg version ')[1].split()[0]}")
            return True
    except (subprocess.TimeoutExpired, FileNotFoundError, subprocess.SubprocessError):
        pass
    return False

def install_with_chocolatey():
    """Install FFmpeg using Chocolatey"""
    try:
        print("🍫 Installing FFmpeg using Chocolatey...")
        result = subprocess.run(['choco', 'install', 'ffmpeg', '-y'], 
                              capture_output=True, text=True, timeout=300)
        if result.returncode == 0:
            print("✅ FFmpeg installed successfully with Chocolatey!")
            return True
        else:
            print(f"❌ Chocolatey installation failed: {result.stderr}")
            return False
    except (subprocess.TimeoutExpired, FileNotFoundError, subprocess.SubprocessError) as e:
        print(f"❌ Chocolatey not available or installation failed: {e}")
        return False

def install_with_scoop():
    """Install FFmpeg using Scoop"""
    try:
        print("🥄 Installing FFmpeg using Scoop...")
        result = subprocess.run(['scoop', 'install', 'ffmpeg'], 
                              capture_output=True, text=True, timeout=300)
        if result.returncode == 0:
            print("✅ FFmpeg installed successfully with Scoop!")
            return True
        else:
            print(f"❌ Scoop installation failed: {result.stderr}")
            return False
    except (subprocess.TimeoutExpired, FileNotFoundError, subprocess.SubprocessError) as e:
        print(f"❌ Scoop not available or installation failed: {e}")
        return False

def check_package_manager():
    """Check which package manager is available"""
    try:
        result = subprocess.run(['choco', '--version'], 
                              capture_output=True, text=True, timeout=5)
        if result.returncode == 0:
            return 'chocolatey'
    except (subprocess.TimeoutExpired, FileNotFoundError, subprocess.SubprocessError):
        pass
    
    try:
        result = subprocess.run(['scoop', '--version'], 
                              capture_output=True, text=True, timeout=5)
        if result.returncode == 0:
            return 'scoop'
    except (subprocess.TimeoutExpired, FileNotFoundError, subprocess.SubprocessError):
        pass
    
    return None

def main():
    """Main installation function"""
    print("🎵 FFmpeg Installation Helper")
    print("=" * 40)
    
    # Check if we're on Windows
    if platform.system() != 'Windows':
        print("⚠️  This script is designed for Windows.")
        print("For other operating systems, please install FFmpeg manually:")
        print("  - macOS: brew install ffmpeg")
        print("  - Ubuntu/Debian: sudo apt install ffmpeg")
        print("  - CentOS/RHEL: sudo yum install ffmpeg")
        return
    
    # Check if FFmpeg is already installed
    if check_ffmpeg():
        return
    
    print("FFmpeg is required for audio conversion (M4A to WAV) in NotesSimmulator.")
    print("Without FFmpeg, audio transcription may fail for M4A files.\n")
    
    # Check for package managers
    package_manager = check_package_manager()
    
    if package_manager == 'chocolatey':
        print("🍫 Chocolatey detected. Installing FFmpeg...")
        if install_with_chocolatey():
            print("\n🔄 Please restart your terminal/command prompt and try again.")
            return
    elif package_manager == 'scoop':
        print("🥄 Scoop detected. Installing FFmpeg...")
        if install_with_scoop():
            print("\n🔄 Please restart your terminal/command prompt and try again.")
            return
    else:
        print("❌ No package manager (Chocolatey/Scoop) detected.")
    
    # Manual installation instructions
    print("\n📋 Manual Installation Instructions:")
    print("1. Download FFmpeg from: https://ffmpeg.org/download.html")
    print("2. Extract the downloaded archive")
    print("3. Add the 'bin' folder to your system PATH")
    print("4. Restart your terminal/command prompt")
    print("5. Verify installation: ffmpeg -version")
    
    print("\n🔧 Alternative: Install a package manager first:")
    print("Chocolatey: https://chocolatey.org/install")
    print("Scoop: https://scoop.sh/")
    
    print("\n💡 After installing FFmpeg, restart your Flask server for the changes to take effect.")

if __name__ == "__main__":
    main() 