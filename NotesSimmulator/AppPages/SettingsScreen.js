import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
} from "react-native";

const SettingsScreen = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(true);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  // Data management handlers
  const handleClearData = () => {
    Alert.alert("Clear All Data", "This action is irreversible.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: () => {
          Alert.alert("Success", "All data has been cleared!");
        },
      },
    ]);
  };

  const handleExportData = () => {
    Alert.alert("Export Data", "Your notes have been exported successfully!");
  };

  const handleAbout = () => {
    Alert.alert(
      "About Notes Simulator",
      "Version 1.0.0\n\nA simple and elegant notes app built with React Native and Expo.\n\nFeatures:\n• AI-powered transcription using Google Speech-to-Text\n• Multiple transcription services\n• Cross-platform support",
      [{ text: "OK" }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B192E" />
      <ScrollView style={styles.scrollContainer}>
        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Notifications</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: "#767577", true: "#64FFDA" }}
              thumbColor={notificationsEnabled ? "#0B192E" : "#f4f3f4"}
            />
          </View>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Dark Mode</Text>
            <Switch
              value={darkModeEnabled}
              onValueChange={setDarkModeEnabled}
              trackColor={{ false: "#767577", true: "#64FFDA" }}
              thumbColor={darkModeEnabled ? "#0B192E" : "#f4f3f4"}
            />
          </View>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Auto Save</Text>
            <Text style={styles.settingDescription}>
              Automatically save notes as you type
            </Text>
            <Switch
              value={autoSaveEnabled}
              onValueChange={setAutoSaveEnabled}
              trackColor={{ false: "#767577", true: "#64FFDA" }}
              thumbColor={autoSaveEnabled ? "#0B192E" : "#f4f3f4"}
            />
          </View>
        </View>
        {/* Data Management Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleExportData}
          >
            <Text style={styles.settingLabel}>Export Notes</Text>
            <Text style={styles.settingDescription}>
              Export all notes to file
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleClearData}
          >
            <Text style={[styles.settingLabel, styles.dangerText]}>
              Clear All Data
            </Text>
            <Text style={styles.settingDescription}>
              Delete all notes permanently
            </Text>
          </TouchableOpacity>
        </View>
        {/* App Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Information</Text>
          <TouchableOpacity style={styles.settingItem} onPress={handleAbout}>
            <Text style={styles.settingLabel}>About</Text>
            <Text style={styles.settingDescription}>
              App version and information
            </Text>
          </TouchableOpacity>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
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
  scrollContainer: {
    flex: 1,
  },
  section: {
    margin: 20,
    padding: 20,
    backgroundColor: "#112240",
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#E6F1FF",
    marginBottom: 20,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  settingLabel: {
    fontSize: 18,
    color: "#A8B2D1",
  },
  settingDescription: {
    fontSize: 14,
    color: "#7f8c8d",
  },
  dangerText: {
    color: "#e74c3c",
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  infoLabel: {
    fontSize: 18,
    color: "#A8B2D1",
  },
  infoValue: {
    fontSize: 18,
    color: "#E6F1FF",
  },
});

export default SettingsScreen;
