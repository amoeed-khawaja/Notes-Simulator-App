import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from "react-native";

const HomePage = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B192E" />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to Polar Notes</Text>
          <Text style={styles.subtitle}>
            Use the top-left menu to navigate the app.
          </Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.contentText}>
            You can view your notes, add new ones, or change settings from the
            drawer menu.
          </Text>
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
    padding: 20,
    flexGrow: 1,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#E6F1FF",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    color: "#A8B2D1",
    textAlign: "center",
  },
  content: {
    backgroundColor: "#112240",
    borderRadius: 12,
    padding: 20,
  },
  contentText: {
    fontSize: 16,
    color: "#A8B2D1",
    textAlign: "center",
    lineHeight: 24,
  },
});

export default HomePage;
