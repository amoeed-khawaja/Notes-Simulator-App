import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
} from "react-native";

const NoteDetailScreen = ({ route, navigation }) => {
  const { note } = route.params;

  const handleDelete = () => {
    Alert.alert("Delete Note", "Are you sure you want to delete this note?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          // Here you would typically delete from database
          Alert.alert("Success", "Note deleted successfully!");
          navigation.goBack();
        },
      },
    ]);
  };

  const handleEdit = () => {
    // Navigate to edit screen (you can reuse AddNoteScreen for editing)
    navigation.navigate("AddNote", { note });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B192E" />

      <ScrollView style={styles.scrollContainer}>
        <View style={styles.noteContainer}>
          <Text style={styles.noteTitle}>{note.title}</Text>
          <Text style={styles.noteDate}>Created: {note.date}</Text>
          <View style={styles.separator} />
          <Text style={styles.noteContent}>{note.content}</Text>
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.editButton]}
          onPress={handleEdit}
        >
          <Text style={styles.buttonText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.deleteButton]}
          onPress={handleDelete}
        >
          <Text style={styles.buttonText}>Delete</Text>
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
  scrollContainer: {
    flex: 1,
  },
  noteContainer: {
    padding: 20,
  },
  noteTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#E6F1FF",
    marginBottom: 10,
  },
  noteDate: {
    fontSize: 14,
    color: "#A8B2D1",
    marginBottom: 20,
  },
  separator: {
    height: 1,
    backgroundColor: "#112240",
    marginBottom: 20,
  },
  noteContent: {
    fontSize: 18,
    color: "#A8B2D1",
    lineHeight: 26,
  },
  buttonContainer: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "#112240",
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 10,
  },
  editButton: {
    backgroundColor: "#64FFDA",
  },
  deleteButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#e74c3c",
  },
  buttonText: {
    color: "#0B192E",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default NoteDetailScreen;
