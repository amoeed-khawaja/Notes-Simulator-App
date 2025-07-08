import AsyncStorage from "@react-native-async-storage/async-storage";

class AudioStorage {
  constructor() {
    this.recordings = [];
    this.storageKey = "audio_recordings";
  }

  // Load recordings from AsyncStorage on app start
  async loadRecordings() {
    try {
      const storedRecordings = await AsyncStorage.getItem(this.storageKey);
      if (storedRecordings) {
        this.recordings = JSON.parse(storedRecordings);
      }
      return this.recordings;
    } catch (error) {
      console.error("Error loading recordings:", error);
      return [];
    }
  }

  // Save a new recording
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
        audioData: recording.audioData || null, // Base64 audio data
      };

      this.recordings.unshift(newRecording); // Add to beginning of array
      await this.persistRecordings();
      return newRecording;
    } catch (error) {
      console.error("Error saving recording:", error);
      throw error;
    }
  }

  // Get all recordings
  getRecordings() {
    return this.recordings;
  }

  // Get a specific recording by ID
  getRecording(id) {
    return this.recordings.find((recording) => recording.id === id);
  }

  // Delete a recording
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

  // Update recording title
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

  // Add transcription to recording
  async addTranscription(id, transcription) {
    try {
      const recording = this.recordings.find((r) => r.id === id);
      if (recording) {
        recording.transcription = transcription;
        await this.persistRecordings();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error adding transcription:", error);
      return false;
    }
  }

  // Persist recordings to AsyncStorage
  async persistRecordings() {
    try {
      await AsyncStorage.setItem(
        this.storageKey,
        JSON.stringify(this.recordings)
      );
    } catch (error) {
      console.error("Error persisting recordings:", error);
      throw error;
    }
  }

  // Clear all recordings
  async clearAllRecordings() {
    try {
      this.recordings = [];
      await AsyncStorage.removeItem(this.storageKey);
      return true;
    } catch (error) {
      console.error("Error clearing recordings:", error);
      return false;
    }
  }

  // Get recording statistics
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

// Create a singleton instance
const audioStorage = new AudioStorage();

export default audioStorage;
