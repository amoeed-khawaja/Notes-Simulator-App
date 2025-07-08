import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  ScrollView,
} from "react-native";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import Icon from "react-native-vector-icons/Ionicons";

const RecordingDetailScreen = ({ route, navigation }) => {
  const { recording } = route.params;
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // Set up navigation title
    navigation.setOptions({
      title: recording.title,
      headerStyle: {
        backgroundColor: "#0B192E",
      },
      headerTintColor: "#E6F1FF",
    });

    // Cleanup sound on unmount
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [navigation, recording, sound]);

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
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

  const playRecording = async () => {
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

      // If already playing, just stop
      if (isPlaying) {
        console.log("⏸️ Stopping playback");
        setIsPlaying(false);
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
        }

        if (status.error) {
          console.error("🎵 Playback error:", status.error);
          setIsPlaying(false);
          Alert.alert(
            "Playback Error",
            `Audio playback failed: ${status.error}`
          );
        }
      });

      // Store sound and start playback
      setSound(newSound);

      console.log("▶️ Starting playback on LOUDSPEAKER...");
      await newSound.playAsync();
      setIsPlaying(true);

      console.log("🎉 PLAYBACK STARTED SUCCESSFULLY ON LOUDSPEAKER!");
    } catch (error) {
      console.error("❌ CRITICAL PLAYBACK ERROR:", error);
      setIsPlaying(false);
      setSound(null);

      Alert.alert(
        "Playback Failed",
        `Error: ${error.message}\n\nPlease try again or restart the app.`
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B192E" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        {/* Recording Header */}
        <View style={styles.header}>
          <Icon name="mic-circle-outline" size={80} color="#64FFDA" />
          <Text style={styles.title}>{recording.title}</Text>
          <Text style={styles.date}>{formatDate(recording.timestamp)}</Text>
        </View>

        {/* Recording Info */}
        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <Icon name="time-outline" size={20} color="#A8B2D1" />
            <Text style={styles.infoText}>
              Duration: {formatDuration(recording.duration)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Icon name="folder-outline" size={20} color="#A8B2D1" />
            <Text style={styles.infoText}>
              Size: {formatFileSize(recording.size)}
            </Text>
          </View>
        </View>

        {/* Play Button */}
        <View style={styles.playContainer}>
          <TouchableOpacity style={styles.playButton} onPress={playRecording}>
            <Icon
              name={isPlaying ? "pause-circle-outline" : "play-circle-outline"}
              size={80}
              color="#64FFDA"
            />
          </TouchableOpacity>
          <Text style={styles.playText}>
            {isPlaying ? "Tap to pause" : "Tap to play"}
          </Text>
        </View>

        {/* Transcription Section */}
        <View style={styles.transcriptionContainer}>
          <View style={styles.sectionHeader}>
            <Icon name="document-text-outline" size={24} color="#64FFDA" />
            <Text style={styles.sectionTitle}>Transcription</Text>
          </View>

          {recording.transcription ? (
            <View style={styles.transcriptionContent}>
              <Text style={styles.transcriptionText}>
                {recording.transcription}
              </Text>
            </View>
          ) : (
            <View style={styles.noTranscription}>
              <Icon name="document-outline" size={40} color="#A8B2D1" />
              <Text style={styles.noTranscriptionText}>
                No transcription available
              </Text>
              <Text style={styles.noTranscriptionSubtext}>
                This recording hasn't been transcribed yet.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B192E",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  title: {
    color: "#E6F1FF",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 15,
    textAlign: "center",
  },
  date: {
    color: "#A8B2D1",
    fontSize: 14,
    marginTop: 5,
  },
  infoContainer: {
    backgroundColor: "#112240",
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  infoText: {
    color: "#E6F1FF",
    fontSize: 16,
    marginLeft: 10,
  },
  playContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  playButton: {
    marginBottom: 10,
  },
  playText: {
    color: "#A8B2D1",
    fontSize: 14,
  },
  transcriptionContainer: {
    backgroundColor: "#112240",
    borderRadius: 12,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    color: "#E6F1FF",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
  },
  transcriptionContent: {
    backgroundColor: "#0B192E",
    borderRadius: 8,
    padding: 15,
  },
  transcriptionText: {
    color: "#E6F1FF",
    fontSize: 16,
    lineHeight: 24,
  },
  noTranscription: {
    alignItems: "center",
    padding: 30,
  },
  noTranscriptionText: {
    color: "#A8B2D1",
    fontSize: 16,
    marginTop: 10,
  },
  noTranscriptionSubtext: {
    color: "#8892B0",
    fontSize: 14,
    marginTop: 5,
    textAlign: "center",
  },
});

export default RecordingDetailScreen;
