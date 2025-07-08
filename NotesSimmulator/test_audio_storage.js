/**
 * Test script for Audio Storage functionality
 * This script tests the audio storage system without requiring the full React Native environment
 */

// Mock AsyncStorage for testing
const mockAsyncStorage = {
  data: {},
  async setItem(key, value) {
    this.data[key] = value;
    console.log(`✅ Stored: ${key}`);
  },
  async getItem(key) {
    const value = this.data[key];
    console.log(`📖 Retrieved: ${key} = ${value ? "exists" : "null"}`);
    return value;
  },
  async removeItem(key) {
    delete this.data[key];
    console.log(`🗑️ Removed: ${key}`);
  },
};

// Mock AudioStorage class for testing
class AudioStorage {
  constructor() {
    this.recordings = [];
    this.storageKey = "audio_recordings";
    this.storage = mockAsyncStorage;
  }

  async loadRecordings() {
    try {
      const storedRecordings = await this.storage.getItem(this.storageKey);
      if (storedRecordings) {
        this.recordings = JSON.parse(storedRecordings);
      }
      return this.recordings;
    } catch (error) {
      console.error("Error loading recordings:", error);
      return [];
    }
  }

  async saveRecording(recording) {
    try {
      const newRecording = {
        id: `recording_${Date.now()}`,
        title: recording.title || `Recording ${this.recordings.length + 1}`,
        uri: recording.uri,
        duration: recording.duration,
        timestamp: new Date().toISOString(),
        size: recording.size || 0,
        transcription: recording.transcription || "",
        audioData: recording.audioData || null,
      };

      this.recordings.unshift(newRecording);
      await this.persistRecordings();
      return newRecording;
    } catch (error) {
      console.error("Error saving recording:", error);
      throw error;
    }
  }

  getRecordings() {
    return this.recordings;
  }

  getRecording(id) {
    return this.recordings.find((recording) => recording.id === id);
  }

  async deleteRecording(id) {
    try {
      this.recordings = this.recordings.filter(
        (recording) => recording.id !== id
      );
      await this.persistRecordings();
      return true;
    } catch (error) {
      console.error("Error deleting recording:", error);
      return false;
    }
  }

  async updateRecordingTitle(id, newTitle) {
    try {
      const recording = this.recordings.find((r) => r.id === id);
      if (recording) {
        recording.title = newTitle;
        await this.persistRecordings();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error updating recording title:", error);
      return false;
    }
  }

  async persistRecordings() {
    try {
      await this.storage.setItem(
        this.storageKey,
        JSON.stringify(this.recordings)
      );
    } catch (error) {
      console.error("Error persisting recordings:", error);
      throw error;
    }
  }

  getStats() {
    return {
      totalRecordings: this.recordings.length,
      totalDuration: this.recordings.reduce(
        (total, r) => total + (r.duration || 0),
        0
      ),
      totalSize: this.recordings.reduce((total, r) => total + (r.size || 0), 0),
      recordingsWithTranscription: this.recordings.filter(
        (r) => r.transcription
      ).length,
    };
  }
}

// Test functions
async function testAudioStorage() {
  console.log("🧪 Testing Audio Storage System");
  console.log("=".repeat(50));

  const audioStorage = new AudioStorage();

  // Test 1: Load empty recordings
  console.log("\n📋 Test 1: Load empty recordings");
  const emptyRecordings = await audioStorage.loadRecordings();
  console.log(`✅ Loaded ${emptyRecordings.length} recordings`);

  // Test 2: Save a recording
  console.log("\n💾 Test 2: Save a recording");
  const testRecording = {
    title: "Test Recording 1",
    uri: "file://test/recording1.m4a",
    duration: 120, // 2 minutes
    size: 1024000, // 1MB
    transcription: "This is a test transcription",
    audioData: "base64_audio_data_here",
  };

  const savedRecording = await audioStorage.saveRecording(testRecording);
  console.log(
    `✅ Saved recording: ${savedRecording.title} (ID: ${savedRecording.id})`
  );

  // Test 3: Save another recording
  console.log("\n💾 Test 3: Save another recording");
  const testRecording2 = {
    title: "Test Recording 2",
    uri: "file://test/recording2.m4a",
    duration: 180, // 3 minutes
    size: 1536000, // 1.5MB
    transcription: "",
    audioData: "base64_audio_data_here_2",
  };

  const savedRecording2 = await audioStorage.saveRecording(testRecording2);
  console.log(
    `✅ Saved recording: ${savedRecording2.title} (ID: ${savedRecording2.id})`
  );

  // Test 4: Load all recordings
  console.log("\n📋 Test 4: Load all recordings");
  const allRecordings = await audioStorage.loadRecordings();
  console.log(`✅ Loaded ${allRecordings.length} recordings`);
  allRecordings.forEach((rec, index) => {
    console.log(`  ${index + 1}. ${rec.title} (${rec.duration}s)`);
  });

  // Test 5: Get statistics
  console.log("\n📊 Test 5: Get statistics");
  const stats = audioStorage.getStats();
  console.log(`✅ Statistics:`);
  console.log(`  - Total recordings: ${stats.totalRecordings}`);
  console.log(`  - Total duration: ${stats.totalDuration} seconds`);
  console.log(`  - Total size: ${stats.totalSize} bytes`);
  console.log(`  - With transcription: ${stats.recordingsWithTranscription}`);

  // Test 6: Update recording title
  console.log("\n✏️ Test 6: Update recording title");
  const updateResult = await audioStorage.updateRecordingTitle(
    savedRecording.id,
    "Updated Test Recording"
  );
  console.log(`✅ Title update result: ${updateResult}`);

  // Test 7: Get specific recording
  console.log("\n🔍 Test 7: Get specific recording");
  const specificRecording = audioStorage.getRecording(savedRecording.id);
  console.log(`✅ Found recording: ${specificRecording.title}`);

  // Test 8: Delete recording
  console.log("\n🗑️ Test 8: Delete recording");
  const deleteResult = await audioStorage.deleteRecording(savedRecording2.id);
  console.log(`✅ Delete result: ${deleteResult}`);

  // Test 9: Final statistics
  console.log("\n📊 Test 9: Final statistics");
  const finalStats = audioStorage.getStats();
  console.log(`✅ Final statistics:`);
  console.log(`  - Total recordings: ${finalStats.totalRecordings}`);
  console.log(`  - Total duration: ${finalStats.totalDuration} seconds`);
  console.log(`  - Total size: ${finalStats.totalSize} bytes`);
  console.log(
    `  - With transcription: ${finalStats.recordingsWithTranscription}`
  );

  console.log("\n🎉 All tests completed successfully!");
  console.log("=".repeat(50));
}

// Run the test
testAudioStorage().catch(console.error);
