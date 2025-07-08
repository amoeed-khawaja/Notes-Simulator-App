import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  StatusBar,
  Alert,
  TextInput,
  Modal,
} from "react-native";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import Icon from "react-native-vector-icons/Ionicons";
import audioStorage from "../services/AudioStorage";

const RecordingsScreen = ({ navigation }) => {
  const [recordings, setRecordings] = useState([]);
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingId, setPlayingId] = useState(null);
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [editingRecording, setEditingRecording] = useState(null);
  const [newTitle, setNewTitle] = useState("");
  const [stats, setStats] = useState({
    totalRecordings: 0,
    totalDuration: 0,
    totalSize: 0,
    recordingsWithTranscription: 0,
  });

  useEffect(() => {
    loadRecordings();

    // Add focus listener to refresh recordings when screen comes into focus
    const unsubscribe = navigation.addListener("focus", () => {
      loadRecordings();
    });

    // Cleanup sound on unmount
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
      unsubscribe();
    };
  }, [navigation]);

  const loadRecordings = async () => {
    try {
      const savedRecordings = await audioStorage.loadRecordings();
      setRecordings(savedRecordings);

      // Update statistics
      const recordingStats = audioStorage.getStats();
      setStats(recordingStats);
    } catch (error) {
      console.error("Error loading recordings:", error);
    }
  };

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const formatTotalDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  const playRecording = async (recording) => {
    try {
      console.log("▶️ Starting playback for:", recording.title);
      console.log("📊 Recording data:", {
        id: recording.id,
        hasAudioData: !!recording.audioData,
        audioDataLength: recording.audioData?.length || 0,
        duration: recording.duration,
        uri: recording.uri,
      });

      // Configure audio to use loudspeaker
      console.log("🔊 Configuring audio for loudspeaker...");
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false, // This ensures loudspeaker on Android
      });

      // Stop current playback if any
      if (sound) {
        console.log("⏹️ Stopping current playback");
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
      }

      // If clicking the same recording that's playing, stop it
      if (playingId === recording.id && isPlaying) {
        console.log("⏸️ Stopping playback");
        setIsPlaying(false);
        setPlayingId(null);
        return;
      }

      // Determine audio source
      let audioUri = null;

      // First try the saved file URI
      if (recording.uri) {
        const fileInfo = await FileSystem.getInfoAsync(recording.uri);
        if (fileInfo.exists) {
          audioUri = recording.uri;
          console.log("✅ Using saved file URI:", audioUri);
        } else {
          console.log("⚠️ Saved file not found, will try base64 conversion");
        }
      }

      // If no valid URI, try converting base64 data
      if (!audioUri && recording.audioData) {
        try {
          console.log("💾 Converting base64 data to file...");
          audioUri = await convertBase64ToFile(
            recording.audioData,
            recording.id
          );
          console.log("✅ Base64 converted to file:", audioUri);
        } catch (conversionError) {
          console.error("❌ Base64 conversion failed:", conversionError);
          Alert.alert(
            "Playback Error",
            "Failed to prepare audio for playback. The recording may be corrupted."
          );
          return;
        }
      }

      // If still no audio source, show error
      if (!audioUri) {
        Alert.alert(
          "Playback Error",
          "No audio data found for this recording."
        );
        return;
      }

      console.log("🎵 Creating sound object with loudspeaker configuration...");

      // Create the sound object with loudspeaker settings
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        {
          shouldPlay: false,
          volume: 1.0, // Full volume
          rate: 1.0, // Normal playback speed
        },
        (status) => {
          console.log("🎵 Initial status callback:", status);
          if (status.didJustFinish) {
            console.log("⏹️ Playback finished in callback");
            setIsPlaying(false);
            setPlayingId(null);
          }
        }
      );

      // Set up status update callback
      newSound.setOnPlaybackStatusUpdate((status) => {
        console.log("🎵 Status update:", {
          isPlaying: status.isPlaying,
          isLoaded: status.isLoaded,
          error: status.error,
          didJustFinish: status.didJustFinish,
        });

        if (status.didJustFinish) {
          console.log("⏹️ Playback finished");
          setIsPlaying(false);
          setPlayingId(null);
        }

        if (status.error) {
          console.error("🎵 Playback error:", status.error);
          setIsPlaying(false);
          setPlayingId(null);
          Alert.alert(
            "Playback Error",
            `Audio playback failed: ${status.error}`
          );
        }
      });

      // Store the sound object and start playback
      setSound(newSound);
      setIsPlaying(true);
      setPlayingId(recording.id);

      console.log("▶️ Starting playback on LOUDSPEAKER...");
      await newSound.playAsync();
      console.log("✅ Playback started successfully on LOUDSPEAKER");
    } catch (error) {
      console.error("❌ Error playing recording:", error);
      setIsPlaying(false);
      setPlayingId(null);

      let errorMessage = "Failed to play recording.";

      if (error.message.includes("file")) {
        errorMessage = "Audio file format not supported.";
      } else if (error.message.includes("network")) {
        errorMessage = "Network error. Please check your connection.";
      } else if (error.message.includes("permission")) {
        errorMessage = "Audio playback permission denied.";
      } else {
        errorMessage = `Playback error: ${error.message}`;
      }

      Alert.alert("Playback Error", errorMessage);
    }
  };

  const convertBase64ToFile = async (base64Data, recordingId) => {
    try {
      console.log("💾 Converting base64 to file for playback...");
      console.log("📊 Base64 data length:", base64Data.length);
      console.log("🆔 Recording ID:", recordingId);

      // Validate base64 data
      if (!base64Data || base64Data.length < 100) {
        throw new Error("Invalid or empty audio data");
      }

      // Try multiple formats for maximum compatibility
      const formats = ["m4a", "wav", "mp3"];
      let tempFilePath = null;

      for (const format of formats) {
        try {
          const tempDir = FileSystem.cacheDirectory;
          const tempFileName = `temp_audio_${recordingId}_${Date.now()}.${format}`;
          tempFilePath = `${tempDir}${tempFileName}`;

          console.log(`💾 Trying format: ${format}`);
          console.log(`📁 File path: ${tempFilePath}`);

          // Write base64 data to file
          await FileSystem.writeAsStringAsync(tempFilePath, base64Data, {
            encoding: FileSystem.EncodingType.Base64,
          });

          // Verify file was created
          const fileInfo = await FileSystem.getInfoAsync(tempFilePath);
          console.log("📁 File info:", {
            exists: fileInfo.exists,
            size: fileInfo.size,
            uri: fileInfo.uri,
          });

          if (fileInfo.exists && fileInfo.size > 0) {
            console.log(`✅ Successfully created ${format} file`);
            return tempFilePath;
          } else {
            console.log(`❌ Failed to create ${format} file`);
            // Clean up failed file
            try {
              await FileSystem.deleteAsync(tempFilePath);
            } catch (cleanupError) {
              console.warn("⚠️ Failed to clean up failed file:", cleanupError);
            }
          }
        } catch (formatError) {
          console.log(
            `❌ Failed to create ${format} file:`,
            formatError.message
          );
          // Continue to next format
        }
      }

      // If all formats failed
      throw new Error("Failed to create audio file in any supported format");
    } catch (error) {
      console.error("❌ Error converting base64 to file:", error);
      throw error;
    }
  };

  const cleanupTempFile = async (fileUri) => {
    try {
      await FileSystem.deleteAsync(fileUri);
      console.log("🧹 Temporary file cleaned up");
    } catch (error) {
      console.warn("⚠️ Failed to clean up temporary file:", error);
    }
  };

  const deleteRecording = async (recording) => {
    Alert.alert(
      "Delete Recording",
      `Are you sure you want to delete "${recording.title}"?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await audioStorage.deleteRecording(recording.id);
              await loadRecordings(); // Reload the list
              Alert.alert("Success", "Recording deleted successfully");
            } catch (error) {
              console.error("Error deleting recording:", error);
              Alert.alert("Error", "Failed to delete recording");
            }
          },
        },
      ]
    );
  };

  const showRenameModal = (recording) => {
    setEditingRecording(recording);
    setNewTitle(recording.title);
    setRenameModalVisible(true);
  };

  const saveNewTitle = async () => {
    if (!newTitle.trim()) {
      Alert.alert("Error", "Title cannot be empty");
      return;
    }

    try {
      await audioStorage.updateRecordingTitle(
        editingRecording.id,
        newTitle.trim()
      );
      await loadRecordings(); // Reload the list
      setRenameModalVisible(false);
      setEditingRecording(null);
      setNewTitle("");
      Alert.alert("Success", "Recording title updated successfully");
    } catch (error) {
      console.error("Error updating title:", error);
      Alert.alert("Error", "Failed to update title");
    }
  };

  const showRecordingOptions = (recording) => {
    Alert.alert(recording.title, "Choose an action:", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Play",
        onPress: () => playRecording(recording),
      },
      {
        text: "Debug Info",
        onPress: () => {
          console.log("🔍 Debug info for recording:", recording.title);
          console.log("📊 Recording details:", {
            id: recording.id,
            title: recording.title,
            duration: recording.duration,
            size: recording.size,
            hasAudioData: !!recording.audioData,
            audioDataLength: recording.audioData?.length || 0,
            hasTranscription: !!recording.transcription,
            uri: recording.uri,
          });

          Alert.alert(
            "Debug Info",
            `Title: ${recording.title}\nDuration: ${
              recording.duration
            }s\nSize: ${
              recording.size
            } bytes\nHas Audio Data: ${!!recording.audioData}\nAudio Data Length: ${
              recording.audioData?.length || 0
            }\nHas Transcription: ${!!recording.transcription}`,
            [{ text: "OK" }]
          );
        },
      },
      {
        text: "Rename",
        onPress: () => showRenameModal(recording),
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteRecording(recording),
      },
    ]);
  };

  const renderRecordingItem = ({ item }) => (
    <TouchableOpacity
      style={styles.recordingItem}
      onPress={() =>
        navigation.navigate("RecordingDetail", { recording: item })
      }
    >
      <Icon name="mic-circle-outline" size={40} color="#64FFDA" />
      <View style={styles.recordingInfo}>
        <Text style={styles.recordingTitle}>{item.title}</Text>
        <Text style={styles.recordingMeta}>
          {formatDate(item.timestamp)} • {formatDuration(item.duration)}
        </Text>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.playButton}
          onPress={(e) => {
            e.stopPropagation(); // Prevent navigation when play button is pressed
            playRecording(item);
          }}
        >
          <Icon
            name={
              playingId === item.id && isPlaying
                ? "pause-circle-outline"
                : "play-circle-outline"
            }
            size={30}
            color="#E6F1FF"
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.optionsButton}
          onPress={(e) => {
            e.stopPropagation(); // Prevent navigation when options button is pressed
            showRecordingOptions(item);
          }}
        >
          <Icon name="ellipsis-vertical" size={20} color="#A8B2D1" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderStats = () => {
    if (recordings.length === 0) return null;

    return (
      <View style={styles.statsContainer}>
        <Text style={styles.statsTitle}>📊 Recording Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.totalRecordings}</Text>
            <Text style={styles.statLabel}>Recordings</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {formatTotalDuration(stats.totalDuration)}
            </Text>
            <Text style={styles.statLabel}>Total Duration</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {formatFileSize(stats.totalSize)}
            </Text>
            <Text style={styles.statLabel}>Total Size</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {stats.recordingsWithTranscription}
            </Text>
            <Text style={styles.statLabel}>With Transcription</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B192E" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.newRecordingButton}
          onPress={() => navigation.navigate("NewRecording")}
        >
          <Icon name="add" size={24} color="#0B192E" />
          <Text style={styles.newRecordingButtonText}>New Recording</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={recordings}
        renderItem={renderRecordingItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={renderStats}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No recordings yet.</Text>
            <Text style={styles.emptySubtext}>
              Press "New Recording" to start.
            </Text>
          </View>
        }
      />

      {/* Rename Modal */}
      <Modal
        visible={renameModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setRenameModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rename Recording</Text>
            <TextInput
              style={styles.textInput}
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="Enter new title"
              placeholderTextColor="#A8B2D1"
              autoFocus={true}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setRenameModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveNewTitle}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B192E",
  },
  header: {
    padding: 20,
    alignItems: "center",
  },
  newRecordingButton: {
    flexDirection: "row",
    backgroundColor: "#64FFDA",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    alignItems: "center",
  },
  newRecordingButtonText: {
    color: "#0B192E",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  recordingItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#112240",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  recordingInfo: {
    flex: 1,
    marginLeft: 15,
  },
  recordingTitle: {
    color: "#E6F1FF",
    fontSize: 16,
    fontWeight: "600",
  },
  recordingMeta: {
    color: "#A8B2D1",
    fontSize: 12,
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  playButton: {
    marginRight: 10,
  },
  optionsButton: {
    padding: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 100,
  },
  emptyText: {
    color: "#E6F1FF",
    fontSize: 18,
    fontWeight: "bold",
  },
  emptySubtext: {
    color: "#A8B2D1",
    fontSize: 14,
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#112240",
    borderRadius: 12,
    padding: 20,
    width: "80%",
    maxWidth: 300,
  },
  modalTitle: {
    color: "#E6F1FF",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  textInput: {
    backgroundColor: "#0B192E",
    borderRadius: 8,
    padding: 12,
    color: "#E6F1FF",
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: "#FF6B6B",
  },
  saveButton: {
    backgroundColor: "#64FFDA",
  },
  cancelButtonText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontWeight: "bold",
  },
  saveButtonText: {
    color: "#0B192E",
    textAlign: "center",
    fontWeight: "bold",
  },
  statsContainer: {
    padding: 20,
    backgroundColor: "#112240",
    borderRadius: 12,
    marginBottom: 20,
  },
  statsTitle: {
    color: "#E6F1FF",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    color: "#E6F1FF",
    fontSize: 16,
    fontWeight: "bold",
  },
  statLabel: {
    color: "#A8B2D1",
    fontSize: 12,
  },
});

export default RecordingsScreen;
