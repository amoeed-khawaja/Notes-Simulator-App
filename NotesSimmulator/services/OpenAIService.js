import * as FileSystem from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";

const GEMINI_API_KEY = "AIzaSyBb4b8ckEdQJG9wtFg7hdoC3tYtHKgV1pM";
const GEMINI_API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

class GeminiService {
  constructor() {
    this.apiKey = GEMINI_API_KEY;
  }

  // Load API key from secure storage (for compatibility)
  async loadApiKey() {
    try {
      const savedApiKey = await AsyncStorage.getItem("gemini_api_key");
      if (savedApiKey) {
        this.apiKey = savedApiKey;
        console.log("✅ Gemini API key loaded from storage");
      } else {
        console.log("🔑 Using default Gemini API key");
      }
    } catch (error) {
      console.error("❌ Failed to load API key:", error);
    }
  }

  // Get current API key info (masked for security)
  getApiKeyInfo() {
    return {
      isSet: true,
      isDefault: true,
      maskedKey: "AIzaSy...",
      status: "Using provided Gemini API key",
    };
  }

  // Reset to default API key
  async resetToDefault() {
    try {
      this.apiKey = GEMINI_API_KEY;
      await AsyncStorage.setItem("gemini_api_key", GEMINI_API_KEY);
      console.log("✅ API key reset to default");
      return { success: true };
    } catch (error) {
      console.error("❌ Failed to reset API key:", error);
      return { success: false, error: error.message };
    }
  }

  // Test API key connection
  async testApiKey() {
    try {
      // Test with a simple text prompt to verify Gemini API works
      const testPrompt =
        "Hello, this is a test of the Gemini API. Please respond with 'Gemini API is working correctly' if you can see this message.";

      const result = await this.generateText(testPrompt);

      return {
        success: result.success,
        message: result.success
          ? "Gemini API is working correctly"
          : result.error,
        models: 1, // Gemini has one main model
        organization: "Google Gemini",
        endpoint: GEMINI_API_ENDPOINT.split("?")[0], // Show base endpoint without key
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        status: 500,
      };
    }
  }

  // Get pricing information
  getPricingInfo() {
    return {
      "Gemini API": "Free tier available with generous limits",
      "Google Cloud Speech-to-Text": "Paid service - $0.006 per minute",
    };
  }

  // Generate text using Gemini API (free)
  async generateText(prompt, options = {}) {
    try {
      console.log("🤖 Generating text with Gemini API...");

      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: options.temperature || 0.7,
          topK: options.topK || 40,
          topP: options.topP || 0.95,
          maxOutputTokens: options.maxOutputTokens || 2048,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
        ],
      };

      console.log("🧠 Sending to Gemini API...");

      const response = await fetch(GEMINI_API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("❌ API Error Response:", result);
        throw new Error(result.error?.message || "Gemini API error");
      }

      const generatedText =
        result.candidates?.[0]?.content?.parts?.[0]?.text || "";

      console.log("✅ Gemini text generation completed:", generatedText);

      return {
        success: true,
        text: generatedText,
        service: "gemini_text_generation",
        raw: result,
        usage: result.usageMetadata,
      };
    } catch (error) {
      console.error("❌ Gemini text generation error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Generate notes summary using Gemini
  async generateNotesSummary(transcriptionText, options = {}) {
    try {
      console.log("📝 Generating notes summary with Gemini...");

      const prompt = `You are an expert note-taking assistant. I have a transcription that I'd like you to convert into well-organized notes.

Transcription:
"${transcriptionText}"

Please create a comprehensive summary that includes:
1. Key points and main ideas
2. Important details and supporting information
3. Action items or tasks mentioned
4. Questions or topics that need follow-up
5. Any relevant context or background information

Format the notes in a clear, organized structure that's easy to read and reference later.`;

      const result = await this.generateText(prompt, {
        temperature: 0.5,
        maxOutputTokens: 2048,
      });

      if (result.success) {
        console.log("✅ Notes summary generated");
        return {
          success: true,
          text: result.text,
          service: "gemini_notes_summary",
          raw: result,
          usage: result.usage,
        };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("❌ Notes summary generation error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // New method: Get API status and limits
  async getApiStatus() {
    try {
      const testResult = await this.testApiKey();
      return {
        success: testResult.success,
        status: testResult.success ? "Active" : "Inactive",
        endpoint: GEMINI_API_ENDPOINT.split("?")[0],
        model: "gemini-1.5-flash",
        service: "Google Generative Language API",
        message: testResult.message,
      };
    } catch (error) {
      return {
        success: false,
        status: "Error",
        error: error.message,
      };
    }
  }
}

const geminiService = new GeminiService();
export default geminiService;
