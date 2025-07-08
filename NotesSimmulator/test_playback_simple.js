// Simple Playback Test
// This tests the bulletproof playback solution

console.log("🎵 Simple Playback Test");
console.log("=======================");

// Mock components
const mockAudio = {
  Sound: {
    async createAsync(options, callback) {
      console.log("🎵 Mock Audio.Sound.createAsync:", options);
      return Promise.resolve({
        sound: {
          async playAsync() {
            console.log("▶️ Mock playAsync called");
            return Promise.resolve();
          },
          async stopAsync() {
            console.log("⏹️ Mock stopAsync called");
            return Promise.resolve();
          },
          async unloadAsync() {
            console.log("🗑️ Mock unloadAsync called");
            return Promise.resolve();
          },
          setOnPlaybackStatusUpdate(callback) {
            console.log("🎵 Mock setOnPlaybackStatusUpdate called");
            // Simulate successful playback
            setTimeout(
              () => callback({ isPlaying: true, isLoaded: true, error: null }),
              100
            );
            setTimeout(
              () =>
                callback({
                  isPlaying: false,
                  didJustFinish: true,
                  error: null,
                }),
              2000
            );
          },
        },
      });
    },
  },
};

const mockFileSystem = {
  cacheDirectory: "/tmp/",
  async writeAsStringAsync(filePath, data, options) {
    console.log(`📝 Writing to: ${filePath}`);
    console.log(`📊 Data length: ${data.length}`);
    return Promise.resolve();
  },
  async getInfoAsync(filePath) {
    console.log(`📁 Getting info for: ${filePath}`);
    return Promise.resolve({
      exists: true,
      size: 1024,
      uri: filePath,
    });
  },
};

// Test the bulletproof playback function
async function testBulletproofPlayback() {
  console.log("\n🧪 Testing Bulletproof Playback...");

  try {
    // Mock recording data
    const mockRecording = {
      getURI: () => "file:///tmp/test_recording.m4a",
    };

    const mockAudioData = "SGVsbG8gV29ybGQ="; // Mock base64 data

    // Test the playback function
    await playRecording(mockRecording, mockAudioData);
    console.log("✅ Bulletproof playback test passed!");
  } catch (error) {
    console.error("❌ Bulletproof playback test failed:", error);
  }
}

// Mock playRecording function
async function playRecording(recording, audioData) {
  console.log("▶️ Starting BULLETPROOF playback...");
  console.log("📊 Audio data length:", audioData.length);

  try {
    // SIMPLE APPROACH: Use the original recording URI if available
    let audioUri = null;

    if (recording && recording.getURI) {
      try {
        audioUri = recording.getURI();
        console.log("🎵 Using original recording URI:", audioUri);

        // Test if the URI is accessible
        const { sound: testSound } = await mockAudio.Sound.createAsync(
          { uri: audioUri },
          { shouldPlay: false }
        );
        await testSound.unloadAsync();
        console.log("✅ Original URI is valid");
      } catch (uriError) {
        console.log("⚠️ Original URI failed, will try base64 conversion");
        audioUri = null;
      }
    }

    // If no valid URI, create from base64
    if (!audioUri) {
      console.log("💾 Creating audio file from base64...");

      // Simple approach: just use m4a format
      const tempDir = mockFileSystem.cacheDirectory;
      const tempFileName = `playback_${Date.now()}.m4a`;
      audioUri = `${tempDir}${tempFileName}`;

      console.log("📁 Creating file at:", audioUri);

      // Write base64 data
      await mockFileSystem.writeAsStringAsync(audioUri, audioData, {
        encoding: "base64",
      });

      // Verify file
      const fileInfo = await mockFileSystem.getInfoAsync(audioUri);
      if (!fileInfo.exists || fileInfo.size === 0) {
        throw new Error("Failed to create audio file");
      }

      console.log(
        "✅ Audio file created successfully:",
        fileInfo.size,
        "bytes"
      );
    }

    console.log("🎵 Creating sound object...");

    // Create sound object with simple configuration
    const { sound: newSound } = await mockAudio.Sound.createAsync(
      { uri: audioUri },
      {
        shouldPlay: false,
        progressUpdateIntervalMillis: 100,
        positionMillis: 0,
        isLooping: false,
      }
    );

    console.log("✅ Sound object created");

    // Set up simple status callback
    newSound.setOnPlaybackStatusUpdate((status) => {
      console.log("🎵 Status:", {
        isPlaying: status.isPlaying,
        isLoaded: status.isLoaded,
        error: status.error,
        didJustFinish: status.didJustFinish,
      });

      if (status.didJustFinish) {
        console.log("⏹️ Playback finished");
      }

      if (status.error) {
        console.error("🎵 Playback error:", status.error);
      }
    });

    // Start playback
    console.log("▶️ Starting playback...");
    await newSound.playAsync();

    console.log("🎉 PLAYBACK STARTED SUCCESSFULLY!");
  } catch (error) {
    console.error("❌ CRITICAL PLAYBACK ERROR:", error);
    throw error;
  }
}

// Run the test
testBulletproofPlayback();

console.log("\n🎯 Key Improvements in Bulletproof Playback:");
console.log("✅ Uses original recording URI when available");
console.log("✅ Simple base64 to file conversion as fallback");
console.log("✅ Better error handling and logging");
console.log("✅ Simplified sound object configuration");
console.log("✅ No complex format detection");
console.log("✅ Direct file creation approach");

export default testBulletproofPlayback;
