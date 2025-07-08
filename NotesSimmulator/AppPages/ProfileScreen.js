import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from "react-native";

const ProfileScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B192E" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.profileSection}>
          <View style={styles.avatar} />
          <Text style={styles.name}>John Doe</Text>
          <Text style={styles.email}>john.doe@email.com</Text>
        </View>
        <View style={styles.infoSection}>
          <Text style={styles.infoLabel}>Member since</Text>
          <Text style={styles.infoValue}>January 2024</Text>
        </View>
        <View style={styles.infoSection}>
          <Text style={styles.infoLabel}>Notes Created</Text>
          <Text style={styles.infoValue}>42</Text>
        </View>
        <View style={styles.infoSection}>
          <Text style={styles.infoLabel}>Recordings</Text>
          <Text style={styles.infoValue}>17</Text>
        </View>
        <View style={styles.bottomSection}>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.navigate("Settings")}
          >
            <Text style={styles.settingsButtonText}>Settings</Text>
          </TouchableOpacity>
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
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  profileSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#64FFDA",
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#E6F1FF",
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: "#A8B2D1",
    marginBottom: 16,
  },
  infoSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  infoLabel: {
    fontSize: 16,
    color: "#A8B2D1",
  },
  infoValue: {
    fontSize: 16,
    color: "#E6F1FF",
    fontWeight: "bold",
  },
  bottomSection: {
    marginTop: 40,
    width: "100%",
    alignItems: "center",
  },
  settingsButton: {
    backgroundColor: "#64FFDA",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  settingsButtonText: {
    color: "#0B192E",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default ProfileScreen;
