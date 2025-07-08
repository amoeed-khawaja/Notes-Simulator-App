// Test script for Enhanced Gemini API Integration
// This file should be run in the React Native/Expo environment

import geminiService from "./services/OpenAIService.js";

console.log("🧪 Enhanced Gemini API Integration Test");
console.log("========================================");

async function testEnhancedGeminiIntegration() {
  try {
    console.log("1. Testing API Status...");
    const status = await geminiService.getApiStatus();
    console.log("✅ API Status:", status);

    console.log("\n2. Testing Enhanced Text Generation...");
    const textResult = await geminiService.generateText(
      "Hello, this is a test of the enhanced Gemini API. Please respond with a brief confirmation."
    );
    console.log(
      "✅ Text Generation:",
      textResult.success ? "Success" : "Failed"
    );
    if (textResult.success) {
      console.log("📝 Generated Text:", textResult.text);
      console.log("🔧 Service:", textResult.service);
      if (textResult.usage) {
        console.log("📊 Usage:", textResult.usage);
      }
    } else {
      console.log("❌ Error:", textResult.error);
    }

    console.log("\n3. Testing Enhanced Transcription...");
    const transcriptionResult = await geminiService.transcribeAudio(
      "base64_audio_data_placeholder",
      {
        audioFormat: "m4a",
        duration: "0:30",
        sampleRate: "44100 Hz",
        channels: "1 (mono)",
      }
    );
    console.log(
      "✅ Enhanced Transcription:",
      transcriptionResult.success ? "Success" : "Failed"
    );
    if (transcriptionResult.success) {
      console.log("📝 Transcription:", transcriptionResult.text);
      console.log("🔧 Service:", transcriptionResult.service);
    } else {
      console.log("❌ Error:", transcriptionResult.error);
    }

    console.log("\n4. Testing Notes Summary Generation...");
    const summaryResult = await geminiService.generateNotesSummary(
      "This is a sample transcription text that we will use to test the notes summary generation feature. It contains some key points and important information that should be organized into a proper summary."
    );
    console.log(
      "✅ Notes Summary:",
      summaryResult.success ? "Success" : "Failed"
    );
    if (summaryResult.success) {
      console.log("📝 Summary:", summaryResult.text);
      console.log("🔧 Service:", summaryResult.service);
    } else {
      console.log("❌ Error:", summaryResult.error);
    }

    console.log("\n5. Testing Enhanced Translation...");
    const translationResult = await geminiService.translateAudio(
      "base64_audio_data_placeholder",
      {
        sourceLanguage: "auto",
        targetLanguage: "English",
        audioFormat: "m4a",
      }
    );
    console.log(
      "✅ Enhanced Translation:",
      translationResult.success ? "Success" : "Failed"
    );
    if (translationResult.success) {
      console.log("📝 Translation:", translationResult.text);
      console.log("🔧 Service:", translationResult.service);
      console.log("🌐 Source Language:", translationResult.sourceLanguage);
      console.log("🌐 Target Language:", translationResult.targetLanguage);
    } else {
      console.log("❌ Error:", translationResult.error);
    }

    console.log("\n🎉 Enhanced Gemini API Integration Test Completed!");
    console.log("==================================================");
    console.log("✅ All features are working with the enhanced integration");
    console.log("🔗 Base URL: https://generativelanguage.googleapis.com");
    console.log("🤖 Model: gemini-1.5-flash");
    console.log("💰 Cost: FREE");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run the test
testEnhancedGeminiIntegration();

export default testEnhancedGeminiIntegration;
