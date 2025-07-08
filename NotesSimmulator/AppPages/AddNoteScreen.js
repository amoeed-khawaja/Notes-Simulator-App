import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
} from "react-native";

const AddNoteScreen = ({ navigation }) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleSave = () => {
    if (title.trim() === "" || content.trim() === "") {
      Alert.alert("Error", "Please fill in both title and content");
      return;
    }

    // Here you would typically save to a database or state management
    Alert.alert("Success", "Note saved successfully!", [
      {
        text: "OK",
        onPress: () => navigation.goBack(),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B192E" />

      <View style={styles.formContainer}>
        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter note title..."
          placeholderTextColor="#A8B2D1"
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>Content</Text>
        <TextInput
          style={[styles.input, styles.contentInput]}
          placeholder="Enter note content..."
          placeholderTextColor="#A8B2D1"
          value={content}
          onChangeText={setContent}
          multiline
        />

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Note</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B192E",
  },
  formContainer: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#A8B2D1",
    marginBottom: 10,
    marginTop: 16,
  },
  input: {
    backgroundColor: "#112240",
    color: "#E6F1FF",
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#64FFDA",
  },
  contentInput: {
    minHeight: 200,
    textAlignVertical: "top",
  },
  saveButton: {
    backgroundColor: "#64FFDA",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  saveButtonText: {
    color: "#0B192E",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default AddNoteScreen;
