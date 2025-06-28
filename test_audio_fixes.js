import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";

// Test audio configuration fix
async function testAudioConfiguration() {
  console.log("🔧 Testing audio configuration...");

  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });

    console.log("✅ Audio configuration successful");
    return true;
  } catch (error) {
    console.error("❌ Audio configuration failed:", error);
    return false;
  }
}

// Test file system operations
async function testFileSystem() {
  console.log("📁 Testing file system operations...");

  try {
    const tempDir = FileSystem.cacheDirectory;
    const testFileName = `test_audio_${Date.now()}.m4a`;
    const testFilePath = `${tempDir}${testFileName}`;

    console.log("📁 Test file path:", testFilePath);
    console.log(
      "📁 Absolute path:",
      await FileSystem.getInfoAsync(testFilePath)
    );

    // Create a test file
    const testData = "test audio data";
    await FileSystem.writeAsStringAsync(testFilePath, testData, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const fileInfo = await FileSystem.getInfoAsync(testFilePath);
    console.log("✅ File created successfully:", fileInfo);

    // Clean up
    await FileSystem.deleteAsync(testFilePath);
    console.log("✅ File cleaned up");

    return true;
  } catch (error) {
    console.error("❌ File system test failed:", error);
    return false;
  }
}

// Test server connection
async function testServerConnection() {
  console.log("🌐 Testing server connection...");

  try {
    const response = await fetch("http://localhost:5000/health", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Server health check successful:", data);
      return true;
    } else {
      console.error("❌ Server health check failed:", response.status);
      return false;
    }
  } catch (error) {
    console.error("❌ Server connection failed:", error);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log("🧪 Running audio and server tests...\n");

  const results = {
    audioConfig: await testAudioConfiguration(),
    fileSystem: await testFileSystem(),
    serverConnection: await testServerConnection(),
  };

  console.log("\n📊 Test Results:");
  console.log(
    "Audio Configuration:",
    results.audioConfig ? "✅ PASS" : "❌ FAIL"
  );
  console.log("File System:", results.fileSystem ? "✅ PASS" : "❌ FAIL");
  console.log(
    "Server Connection:",
    results.serverConnection ? "✅ PASS" : "❌ FAIL"
  );

  const allPassed = Object.values(results).every((result) => result);
  console.log(
    "\n🎯 Overall Result:",
    allPassed ? "✅ ALL TESTS PASSED" : "❌ SOME TESTS FAILED"
  );

  return allPassed;
}

// Export for use in other files
export {
  testAudioConfiguration,
  testFileSystem,
  testServerConnection,
  runTests,
};

// Run tests if this file is executed directly
if (typeof window !== "undefined") {
  runTests();
}
