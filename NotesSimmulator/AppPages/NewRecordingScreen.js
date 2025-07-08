import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Animated,
  Alert,
  PermissionsAndroid,
  Platform,
} from "react-native";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import Icon from "react-native-vector-icons/Ionicons";
import audioStorage from "../services/AudioStorage";
import geminiService from "../services/OpenAIService";

const NewRecordingScreen = ({ navigation }) => {
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [permissionResponse, requestPermission] = Audio.usePermissions();
  const [audioLevels, setAudioLevels] = useState([]);
  const [audioData, setAudioData] = useState(null);
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [sessionId, setSessionId] = useState("");

  // Flask server configuration
  // const FLASK_SERVER_URL = "http://192.168.1.6:5000"; // Home IP

  // const FLASK_SERVER_URL = "http://192.168.1.105:5000"; // Academy IP

  const FLASK_SERVER_URL = "http://192.168.1.11:5000"; //Home 2

  // Create animated values for 40 waveform bars
  const [animatedWidths] = useState(() =>
    Array(40)
      .fill(0)
      .map(() => new Animated.Value(0))
  );

  useEffect(() => {
    checkMicrophonePermission();
    // Generate session ID for this recording session
    setSessionId(`session_${Date.now()}`);
  }, []);

  useEffect(() => {
    return recording
      ? () => {
          recording.stopAndUnloadAsync();
        }
      : undefined;
  }, [recording]);

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  useEffect(() => {
    // Animate each bar based on audio levels with faster response
    animatedWidths.forEach((anim, index) => {
      const targetValue = audioLevels[index] || 0;

      Animated.timing(anim, {
        toValue: targetValue,
        duration: 50, // Faster duration for more responsive animation
        useNativeDriver: false,
      }).start();
    });
  }, [audioLevels, animatedWidths]);

  // Check and request microphone permission
  const checkMicrophonePermission = async () => {
    console.log("🔍 Checking microphone permission...");

    try {
      if (Platform.OS === "android") {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: "Microphone Permission",
            message:
              "This app needs access to your microphone to record audio.",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK",
          }
        );

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log("✅ Android microphone permission granted");
          setHasPermission(true);
        } else {
          console.log("❌ Android microphone permission denied");
          setHasPermission(false);
          Alert.alert(
            "Permission Required",
            "Microphone permission is required to record audio. Please enable it in Settings."
          );
        }
      } else {
        // iOS permission handling
        const { status } = await Audio.requestPermissionsAsync();
        if (status === "granted") {
          console.log("✅ iOS microphone permission granted");
          setHasPermission(true);
        } else {
          console.log("❌ iOS microphone permission denied");
          setHasPermission(false);
          Alert.alert(
            "Permission Required",
            "Microphone permission is required to record audio. Please enable it in Settings."
          );
        }
      }
    } catch (error) {
      console.error("❌ Error checking microphone permission:", error);
      setHasPermission(false);
    }
  };

  // Function to convert audio to base64 string
  const audioToBase64 = async (audioUri) => {
    try {
      console.log("🔄 Converting audio to base64...");

      // Read the audio file as base64
      const response = await fetch(audioUri);
      const blob = await response.blob();

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64String = reader.result.split(",")[1]; // Remove data:audio/m4a;base64, prefix
          console.log("✅ Audio converted to base64 successfully");
          resolve(base64String);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("❌ Error converting audio to base64:", error);
      throw error;
    }
  };

  // New function: Generate notes summary using Gemini
  async function generateNotesSummaryWithGemini(transcriptionText) {
    if (!transcriptionText || transcriptionText.trim() === "") {
      console.log("❌ No transcription text to summarize");
      Alert.alert(
        "No Content",
        "Please transcribe some audio first before generating a summary."
      );
      return;
    }

    console.log("📝 Generating notes summary with Gemini...");
    setIsTranscribing(true);

    try {
      const result = await geminiService.generateNotesSummary(
        transcriptionText
      );

      if (result.success) {
        console.log("✅ Notes summary generated");

        // Show the summary in an alert
        const usageInfo = result.usage
          ? `\n\nAPI Usage: ${JSON.stringify(result.usage)}`
          : "";
        Alert.alert(
          "Notes Summary Generated (Free)",
          `Summary:\n\n${result.text}\n\nService: Google Generative Language API (Free)${usageInfo}`,
          [
            {
              text: "Copy to Clipboard",
              onPress: () => {
                // You can add clipboard functionality here if needed
                console.log("Summary copied to clipboard");
              },
            },
            {
              text: "OK",
              style: "cancel",
            },
          ]
        );
      } else {
        console.log("❌ Notes summary generation failed:", result.error);
        Alert.alert(
          "Summary Generation Error",
          result.error || "Failed to generate notes summary"
        );
      }
    } catch (error) {
      console.error("❌ Error generating notes summary:", error);
      Alert.alert(
        "Summary Generation Error",
        "Failed to generate notes summary. Please try again."
      );
    } finally {
      setIsTranscribing(false);
    }
  }

  // Function to save transcription to Flask server
  async function saveTranscriptionToServer(
    transcriptionText,
    confidence = 0.0
  ) {
    if (!transcriptionText || transcriptionText.trim() === "") {
      console.log("❌ No transcription text to save");
      return;
    }

    console.log("💾 Saving transcription to server...");
    console.log("📝 Transcription:", transcriptionText);

    try {
      const response = await fetch(`${FLASK_SERVER_URL}/save-transcription`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcription: transcriptionText,
          session_id: sessionId,
          confidence: confidence,
          timestamp: new Date().toISOString(),
        }),
      });

      console.log("💾 Response status:", response.status);
      const data = await response.json();
      console.log("💾 Server response:", data);

      if (data.status === "success") {
        console.log("✅ Transcription saved successfully");
        setTranscription(transcriptionText);
        Alert.alert(
          "Transcription Saved",
          `Transcription: ${transcriptionText}\n\nWords: ${data.word_count}\nCharacters: ${data.character_count}`
        );
      } else {
        console.log("❌ Failed to save transcription:", data.message);
        Alert.alert(
          "Save Error",
          data.message || "Failed to save transcription"
        );
      }
    } catch (error) {
      console.error("❌ Error saving transcription:", error);
      Alert.alert(
        "Save Error",
        "Failed to save transcription. Please try again."
      );
    }
  }

  // Function to start real-time transcription using browser Speech Recognition
  async function startRealTimeTranscription() {
    console.log("🎤 Starting real-time transcription...");

    if (!hasPermission) {
      console.log("❌ No microphone permission");
      Alert.alert(
        "Permission Required",
        "Microphone permission is required. Please grant permission and try again.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Grant Permission", onPress: checkMicrophonePermission },
        ]
      );
      return;
    }

    try {
      // Check if Speech Recognition is available
      if (
        !("webkitSpeechRecognition" in window) &&
        !("SpeechRecognition" in window)
      ) {
        Alert.alert(
          "Not Supported",
          "Speech Recognition is not supported in this browser. Please use Chrome or Edge."
        );
        return;
      }

      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        console.log("🎤 Speech recognition started");
        setIsListening(true);
        setIsTranscribing(true);
        setInterimTranscript("");
        setFinalTranscript("");
      };

      recognition.onresult = (event) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPart = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcriptPart;
          } else {
            interimTranscript += transcriptPart;
          }
        }

        setInterimTranscript(interimTranscript);
        setFinalTranscript(finalTranscript);

        // Update the main transcription display
        const fullTranscript =
          finalTranscript + (interimTranscript ? ` ${interimTranscript}` : "");
        setTranscription(fullTranscript);

        console.log("📝 Final transcript:", finalTranscript);
        console.log("📝 Interim transcript:", interimTranscript);
      };

      recognition.onerror = (event) => {
        console.error("❌ Speech recognition error:", event.error);
        setIsListening(false);
        setIsTranscribing(false);
        Alert.alert("Transcription Error", `Error: ${event.error}`);
      };

      recognition.onend = () => {
        console.log("🛑 Speech recognition ended");
        setIsListening(false);
        setIsTranscribing(false);

        // Save final transcription if there is any
        if (finalTranscript.trim()) {
          saveTranscriptionToServer(finalTranscript.trim());
        }
      };

      // Start recognition
      recognition.start();
    } catch (error) {
      console.error("❌ Error starting speech recognition:", error);
      Alert.alert(
        "Transcription Error",
        "Failed to start speech recognition. Please try again."
      );
    }
  }

  // Function to stop real-time transcription
  function stopRealTimeTranscription() {
    console.log("🛑 Stopping real-time transcription...");
    setIsListening(false);
    setIsTranscribing(false);

    // The recognition will automatically stop and trigger onend
    // which will save the transcription
  }

  async function startRecording() {
    if (!hasPermission) {
      console.log("❌ No microphone permission");
      Alert.alert(
        "Permission Required",
        "Microphone permission is required. Please grant permission and try again.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Grant Permission", onPress: checkMicrophonePermission },
        ]
      );
      return;
    }

    console.log("🎤 Starting recording...");
    try {
      console.log("🎤 Setting audio mode...");
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log("🎤 Creating recording with WAV format...");
      // Use WAV format for better compatibility with transcription services
      const { recording } = await Audio.Recording.createAsync(
        {
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
          android: {
            ...Audio.RecordingOptionsPresets.HIGH_QUALITY.android,
            extension: ".wav",
            outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_WAV,
            audioEncoder:
              Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_PCM_16BIT,
          },
          ios: {
            ...Audio.RecordingOptionsPresets.HIGH_QUALITY.ios,
            extension: ".wav",
            outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_LINEARPCM,
            audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
            sampleRate: 44100,
            numberOfChannels: 1,
            bitRate: 128000,
            linearPCMBitDepth: 16,
            linearPCMIsBigEndian: false,
            linearPCMIsFloat: false,
          },
        },
        undefined,
        50 // More frequent status updates for better audio visualization
      );

      // Reset audio levels BEFORE starting recording
      setAudioLevels([]);

      console.log("🎤 Setting up recording status updates...");
      recording.setOnRecordingStatusUpdate((status) => {
        if (status.isRecording) {
          setDuration(status.durationMillis);
          if (status.metering !== undefined) {
            // Real-time audio level calculation for immediate visual response
            // Convert metering value (typically -160 to 0 dB) to a 0-100 scale
            const normalizedLevel = Math.max(
              0,
              Math.min(100, ((status.metering + 160) / 160) * 100)
            );

            // Apply exponential scaling for better visual response to quiet sounds
            const scaledLevel = Math.pow(normalizedLevel / 100, 0.7) * 100;

            // Add minimal randomness for natural wave effect (reduced for better sync)
            const randomFactor = 0.9 + Math.random() * 0.2; // 0.9 to 1.1
            const finalLevel = Math.min(100, scaledLevel * randomFactor);

            console.log(
              "🎤 Audio level:",
              finalLevel.toFixed(2),
              "dB:",
              status.metering,
              "Array length:",
              audioLevels.length
            );

            // Update audio levels immediately for real-time response
            setAudioLevels((prev) => {
              const newLevels = [...prev, finalLevel];
              const result = newLevels.slice(-40); // Keep only the last 40 values
              console.log(
                "📊 Updated audio levels array length:",
                result.length
              );
              return result;
            });
          }
        }
      });

      setRecording(recording);
      setIsRecording(true);
      setIsPreviewMode(false);
      setAudioData(null);
      setSound(null);
      setIsPlaying(false);
      setTranscription(""); // Clear previous transcription
      console.log("✅ Recording started successfully in WAV format");
    } catch (err) {
      console.error("❌ Failed to start recording:", err);
      Alert.alert(
        "Recording Error",
        "Failed to start recording. Please try again."
      );
    }
  }

  async function stopRecording() {
    console.log("🛑 Stopping recording...");
    setIsRecording(false);

    try {
      await recording.stopAndUnloadAsync();

      // Get the recording URI
      const uri = recording.getURI();
      console.log("📁 Recording URI:", uri);

      // Convert audio to base64 string
      const base64Audio = await audioToBase64(uri);
      setAudioData(base64Audio);

      console.log("✅ Recording stopped and converted to base64");
      console.log("📊 Audio data length:", base64Audio.length);

      // Automatically go to preview mode without showing alert
      setIsPreviewMode(true);
    } catch (error) {
      console.error("❌ Error stopping recording:", error);
      Alert.alert(
        "Recording Error",
        "Failed to stop recording. Please try again."
      );
    }
  }

  async function saveRecording(name) {
    console.log("💾 Save recording called with name:", name);
    console.log("💾 Audio data available:", audioData ? "Yes" : "No");
    console.log("💾 Audio data length:", audioData?.length || 0);
    console.log("💾 Recording duration:", duration);
    console.log("💾 Recording URI:", recording?.getURI());

    if (!audioData) {
      Alert.alert("Error", "No audio data to save");
      return;
    }

    if (!recording) {
      Alert.alert("Error", "No recording object available");
      return;
    }

    try {
      // Show saving progress
      Alert.alert(
        "Saving Recording",
        "Saving recording and transcribing audio...",
        [],
        { cancelable: false }
      );

      // Get recording duration
      const recordingDuration = Math.floor(duration / 1000); // Convert to seconds

      console.log("💾 Preparing recording data for storage...");

      // Save audio file to device storage for reliable playback
      const documentsDir = FileSystem.documentDirectory;
      const fileName = `recording_${Date.now()}.wav`;
      const filePath = `${documentsDir}${fileName}`;

      console.log("💾 Saving audio file to:", filePath);

      // Write base64 audio data to file
      await FileSystem.writeAsStringAsync(filePath, audioData, {
        encoding: FileSystem.EncodingType.Base64,
      });

      console.log("✅ Audio file saved successfully");

      // Automatically transcribe the audio
      console.log("🧠 Starting automatic transcription...");
      let finalTranscription = "";

      try {
        const transcriptionResult = await transcribeAudioWithOpenAIWhisper(
          audioData,
          "wav"
        );
        if (transcriptionResult && transcriptionResult.success) {
          finalTranscription = transcriptionResult.transcription;
          console.log(
            "✅ Automatic transcription completed:",
            finalTranscription
          );
        } else {
          console.log(
            "⚠️ Automatic transcription failed, continuing without transcription"
          );
        }
      } catch (transcriptionError) {
        console.error("❌ Automatic transcription error:", transcriptionError);
        // Continue saving without transcription
      }

      // Save to audio storage with file path and transcription
      const savedRecording = await audioStorage.saveRecording({
        title: name || `Recording ${Date.now()}`,
        uri: filePath, // Use the saved file path
        duration: recordingDuration,
        size: audioData.length,
        transcription: finalTranscription,
        audioData: audioData, // Keep base64 for backup
      });

      console.log("✅ Recording saved successfully:", {
        id: savedRecording.id,
        title: savedRecording.title,
        duration: savedRecording.duration,
        size: savedRecording.size,
        hasAudioData: !!savedRecording.audioData,
        audioDataLength: savedRecording.audioData?.length || 0,
        filePath: savedRecording.uri,
        hasTranscription: !!finalTranscription,
      });

      Alert.alert(
        "Success",
        `Recording "${savedRecording.title}" saved successfully!${
          finalTranscription
            ? "\n\nTranscription completed automatically."
            : "\n\nTranscription failed, but recording was saved."
        }`,
        [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error("❌ Error saving recording:", error);
      Alert.alert("Error", "Failed to save recording. Please try again.");
    }
  }

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

  const getTimerText = () => {
    const totalSeconds = Math.floor(duration / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  async function playRecording() {
    if (!audioData) {
      console.log("❌ No audio data available for playback");
      Alert.alert("No Audio", "No recording available to play.");
      return;
    }

    console.log("▶️ Starting BULLETPROOF playback with LOUDSPEAKER...");
    console.log("📊 Audio data length:", audioData.length);

    try {
      // Configure audio to use loudspeaker
      console.log("🔊 Configuring audio for loudspeaker...");
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false, // This ensures loudspeaker on Android
      });

      // Stop any current playback
      if (sound) {
        console.log("⏹️ Stopping current playback");
        try {
          await sound.stopAsync();
          await sound.unloadAsync();
        } catch (stopError) {
          console.warn("⚠️ Error stopping previous sound:", stopError);
        }
        setSound(null);
      }

      // If already playing, just stop
      if (isPlaying) {
        console.log("⏸️ Stopping playback");
        setIsPlaying(false);
        return;
      }

      // SIMPLE APPROACH: Use the original recording URI if available
      let audioUri = null;

      if (recording && recording.getURI) {
        try {
          audioUri = recording.getURI();
          console.log("🎵 Using original recording URI:", audioUri);

          // Test if the URI is accessible
          const { sound: testSound } = await Audio.Sound.createAsync(
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

        try {
          // Simple approach: just use m4a format
          const tempDir = FileSystem.cacheDirectory;
          const tempFileName = `playback_${Date.now()}.m4a`;
          audioUri = `${tempDir}${tempFileName}`;

          console.log("📁 Creating file at:", audioUri);

          // Write base64 data
          await FileSystem.writeAsStringAsync(audioUri, audioData, {
            encoding: FileSystem.EncodingType.Base64,
          });

          // Verify file
          const fileInfo = await FileSystem.getInfoAsync(audioUri);
          if (!fileInfo.exists || fileInfo.size === 0) {
            throw new Error("Failed to create audio file");
          }

          console.log(
            "✅ Audio file created successfully:",
            fileInfo.size,
            "bytes"
          );
        } catch (fileError) {
          console.error("❌ File creation failed:", fileError);
          throw new Error("Failed to create audio file for playback");
        }
      }

      console.log("🎵 Creating sound object with loudspeaker configuration...");

      // Create sound object with loudspeaker configuration
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        {
          shouldPlay: false,
          progressUpdateIntervalMillis: 100,
          positionMillis: 0,
          isLooping: false,
          volume: 1.0, // Full volume
          rate: 1.0, // Normal playback speed
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
        `Error: ${error.message}\n\nPlease try recording again or restart the app.`
      );
    }
  }

  async function transcribeAudioWithOpenAIWhisper(
    base64Audio,
    audioFormat = "wav"
  ) {
    if (!base64Audio) {
      console.log("❌ No audio data to transcribe");
      Alert.alert(
        "Error",
        "No audio data available for Whisper transcription."
      );
      return { success: false, message: "No audio data available" };
    }
    console.log(
      "Calling Whisper with base64Audio (first 100 chars):",
      base64Audio.slice(0, 100)
    );
    console.log("🤖 Transcribing audio with OpenAI Whisper...");
    setIsTranscribing(true);

    try {
      // Add timeout to the request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout for Whisper

      const response = await fetch(`${FLASK_SERVER_URL}/transcribe-audio`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          audio_data: base64Audio,
          audio_format: audioFormat,
          service: "openai_whisper",
          timestamp: new Date().toISOString(),
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log("🤖 Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("🤖 Server error response:", errorText);
        throw new Error(
          `HTTP error! status: ${response.status} - ${errorText}`
        );
      }

      const data = await response.json();
      console.log("🤖 Server response:", data);

      if (data.status === "success") {
        console.log("✅ OpenAI Whisper transcription completed");
        setTranscription(data.transcription);

        // Return success result for automatic transcription
        return {
          success: true,
          transcription: data.transcription,
          wordCount: data.word_count,
          characterCount: data.character_count,
          service: data.service,
        };
      } else {
        console.log("❌ OpenAI Whisper transcription failed:", data.message);

        // Return failure result for automatic transcription
        return {
          success: false,
          message:
            data.message || "Failed to transcribe audio with OpenAI Whisper",
        };
      }
    } catch (error) {
      console.error("❌ Error transcribing with OpenAI Whisper:", error);

      let errorMessage = "Failed to transcribe audio.";

      if (error.name === "AbortError") {
        errorMessage =
          "Transcription timed out. Please try with a shorter recording.";
      } else if (error.message.includes("Network request failed")) {
        errorMessage =
          "Failed to connect to Whisper server.\n\nTry these solutions:\n1. Make sure Flask server is running\n2. Both devices must be on same WiFi\n3. Use tunnel mode: npx expo start --tunnel\n4. Check firewall settings";
      } else if (error.message.includes("HTTP error")) {
        errorMessage = `Server error: ${error.message}\n\nTry using browser speech recognition instead.`;
      }

      // For manual transcription, show alert with options
      if (!isPreviewMode) {
        Alert.alert("Transcription Error", errorMessage, [
          {
            text: "Try Browser Speech",
            onPress: () => transcribeWithBrowserSpeech(),
          },
          {
            text: "Try SpeechBrain",
            onPress: () => transcribeAudioWithSpeechBrain(base64Audio, "wav"),
          },
          {
            text: "Try Again",
            onPress: () => transcribeAudioWithOpenAIWhisper(base64Audio, "wav"),
          },
          {
            text: "Skip Transcription",
            style: "cancel",
          },
        ]);
      }

      // Return failure result for automatic transcription
      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      setIsTranscribing(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B192E" />

      {/* Permission Status */}
      {!hasPermission && (
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>
            Microphone permission required
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={checkMicrophonePermission}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      )}

      <View
        style={[
          styles.waveformContainer,
          isRecording && styles.recordingActive,
        ]}
      >
        {isRecording && (
          <View style={styles.recordingIndicator}>
            <Text style={styles.recordingIndicatorText}>
              🎤 RECORDING ({audioLevels.length} levels)
            </Text>
          </View>
        )}
        {Array(40)
          .fill(0)
          .map((_, i) => {
            const audioLevel = audioLevels[i] || 0;
            // Show some default bars when not recording
            const defaultHeight = isRecording ? 4 : Math.random() * 20 + 4;
            const height = isRecording
              ? Math.max(4, audioLevel * 0.8)
              : defaultHeight;
            const opacity = isRecording ? Math.max(0.2, audioLevel / 100) : 0.3;
            const backgroundColor = isRecording
              ? audioLevel > 50
                ? "#00FF88"
                : "#64FFDA"
              : "#64FFDA";

            return (
              <Animated.View
                key={i}
                style={[
                  styles.waveformBar,
                  {
                    height: height,
                    opacity: opacity,
                    backgroundColor: backgroundColor,
                  },
                ]}
              />
            );
          })}
      </View>
      <Text style={styles.timerText}>{getTimerText()}</Text>

      {/* Real-time Transcription Display */}
      {isListening && (
        <View style={styles.transcriptionContainer}>
          <Text style={styles.transcriptionTitle}>
            🎤 Real-time Transcription:
          </Text>
          {finalTranscript ? (
            <Text style={styles.finalTranscriptText}>
              <Text style={styles.finalLabel}>Final: </Text>
              {finalTranscript}
            </Text>
          ) : null}
          {interimTranscript ? (
            <Text style={styles.interimTranscriptText}>
              <Text style={styles.interimLabel}>Interim: </Text>
              {interimTranscript}
            </Text>
          ) : null}
        </View>
      )}

      {isPreviewMode && (
        <View style={styles.previewContainer}>
          <Text style={styles.previewText}>Recording Complete!</Text>

          <TouchableOpacity style={styles.playButton} onPress={playRecording}>
            <Icon
              name={isPlaying ? "pause-circle-outline" : "play-circle-outline"}
              size={60}
              color="#64FFDA"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={() => {
              Alert.prompt(
                "Save Recording",
                "Enter a name for your recording:",
                [
                  {
                    text: "Cancel",
                    style: "cancel",
                  },
                  {
                    text: "Save",
                    onPress: (recordingName) => {
                      if (recordingName && recordingName.trim()) {
                        saveRecording(recordingName.trim());
                      } else {
                        Alert.alert(
                          "Error",
                          "Please enter a valid name for the recording."
                        );
                      }
                    },
                  },
                ],
                "plain-text",
                "My Recording"
              );
            }}
          >
            <Text style={styles.saveButtonText}>Save Recording</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => {
              Alert.alert(
                "Delete Recording",
                "Are you sure you want to delete this recording?",
                [
                  {
                    text: "Cancel",
                    style: "cancel",
                  },
                  {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => {
                      // Reset the screen state
                      setAudioData(null);
                      setTranscription("");
                      setIsPreviewMode(false);
                      setDuration(0);
                      setSound(null);
                      setIsPlaying(false);
                      Alert.alert("Deleted", "Recording deleted successfully.");
                    },
                  },
                ]
              );
            }}
          >
            <Text style={styles.deleteButtonText}>Delete Recording</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.controls}>
        {!isPreviewMode && (
          <>
            {/* Audio Recording Button */}
            <TouchableOpacity
              style={[
                styles.micButton,
                !hasPermission && styles.disabledButton,
              ]}
              onPress={isRecording ? stopRecording : startRecording}
              disabled={!hasPermission}
            >
              <Icon
                name={
                  isRecording ? "stop-circle-outline" : "mic-circle-outline"
                }
                size={80}
                color={hasPermission ? "#64FFDA" : "#666"}
              />
            </TouchableOpacity>

            {/* Real-time Transcription Button */}
            <TouchableOpacity
              style={[
                styles.transcribeButton,
                !hasPermission && styles.disabledButton,
                isListening && styles.listeningButton,
              ]}
              onPress={
                isListening
                  ? stopRealTimeTranscription
                  : startRealTimeTranscription
              }
              disabled={!hasPermission}
            >
              <Text style={styles.transcribeButtonText}>
                {isListening
                  ? "🛑 Stop Transcription"
                  : "🎤 Start Real-time Transcription"}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B192E",
    justifyContent: "space-between",
    alignItems: "center",
  },
  permissionContainer: {
    position: "absolute",
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: "#FF6B6B",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    zIndex: 1000,
  },
  permissionText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  permissionButton: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  permissionButtonText: {
    color: "#FF6B6B",
    fontSize: 14,
    fontWeight: "bold",
  },
  waveformContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 200,
    width: "90%",
    marginTop: 40,
    backgroundColor: "#112240",
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
  },
  recordingActive: {
    borderWidth: 2,
    borderColor: "#FF6B6B",
    shadowColor: "#FF6B6B",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  recordingIndicator: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "#FF6B6B",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    zIndex: 10,
  },
  recordingIndicatorText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  waveformBar: {
    width: 3,
    backgroundColor: "#64FFDA",
    marginHorizontal: 1,
    borderRadius: 3,
    shadowColor: "#64FFDA",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 3,
  },
  timerText: {
    color: "#E6F1FF",
    fontSize: 48,
    fontWeight: "200",
    fontFamily: "monospace",
  },
  transcriptionContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: "#112240",
    borderRadius: 10,
    width: "90%",
  },
  transcriptionTitle: {
    color: "#E6F1FF",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  transcriptionText: {
    color: "#E6F1FF",
    fontSize: 16,
  },
  finalTranscriptText: {
    color: "#64FFDA",
    fontSize: 16,
    marginBottom: 5,
  },
  interimTranscriptText: {
    color: "#8892B0",
    fontSize: 14,
    fontStyle: "italic",
  },
  finalLabel: {
    fontWeight: "bold",
  },
  interimLabel: {
    fontWeight: "bold",
  },
  previewContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  previewText: {
    color: "#E6F1FF",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
  },
  playButton: {
    marginBottom: 20,
  },
  transcribeButton: {
    backgroundColor: "#64FFDA",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    marginBottom: 10,
  },
  listeningButton: {
    backgroundColor: "#FF6B6B",
  },
  disabledButton: {
    backgroundColor: "#444",
  },
  transcribeButtonText: {
    color: "#0B192E",
    fontSize: 16,
    fontWeight: "bold",
  },

  saveButton: {
    backgroundColor: "#64FFDA",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  saveButtonText: {
    color: "#0B192E",
    fontSize: 16,
    fontWeight: "bold",
  },
  deleteButton: {
    backgroundColor: "#FF6B6B",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    marginTop: 10,
  },
  deleteButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  controls: {
    marginBottom: 40,
    alignItems: "center",
  },
  micButton: {
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },

  transcriptionStatusContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: "#112240",
    borderRadius: 10,
    width: "90%",
  },
  transcriptionStatusText: {
    color: "#E6F1FF",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  transcriptionStatusSubtext: {
    color: "#8892B0",
    fontSize: 14,
    fontStyle: "italic",
  },

  geminiButton: {
    backgroundColor: "#FF6B6B",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    marginBottom: 10,
  },
  geminiButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  translateButton: {
    backgroundColor: "#FF6B6B",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    marginBottom: 10,
  },
  translateButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  summaryButton: {
    backgroundColor: "#FF6B6B",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    marginBottom: 10,
  },
  summaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  whisperButton: {
    backgroundColor: "#64FFDA",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    marginBottom: 10,
  },
  whisperButtonText: {
    color: "#0B192E",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default NewRecordingScreen;
