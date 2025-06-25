// Test script for file system functionality
const FileSystem = require("expo-file-system");

async function testFileSystem() {
  console.log("🧪 Testing File System functionality...");

  try {
    // Get documents directory
    const documentsDir = FileSystem.documentDirectory;
    console.log("📁 Documents directory:", documentsDir);

    // Create a test file
    const testFileName = `test_${Date.now()}.txt`;
    const testFilePath = `${documentsDir}${testFileName}`;
    const testContent = "This is a test file for Notes Simulator";

    console.log("📝 Creating test file:", testFilePath);
    await FileSystem.writeAsStringAsync(testFilePath, testContent);
    console.log("✅ Test file created successfully");

    // Read the test file
    const readContent = await FileSystem.readAsStringAsync(testFilePath);
    console.log("📖 File content:", readContent);

    // List files in documents directory
    const files = await FileSystem.readDirectoryAsync(documentsDir);
    console.log("📋 Files in documents directory:", files);

    // Clean up test file
    await FileSystem.deleteAsync(testFilePath);
    console.log("🗑️ Test file deleted");

    console.log("🎉 File system test completed successfully!");
  } catch (error) {
    console.error("❌ File system test failed:", error);
  }
}

// Note: This test would need to be run in the React Native environment
// For now, it's just a reference for the expected functionality
console.log("This test should be run in the React Native app environment");
