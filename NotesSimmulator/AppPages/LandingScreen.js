import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from "react-native";

const LandingScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B192E" />

      <View style={styles.content}>
        {/* Logo */}
        <Image
          source={require("../assets/Logo/Logo.png")}
          style={styles.logo}
        />

        <Text style={styles.title}>Polar Notes</Text>
        <Text style={styles.subtitle}>
          Capture your thoughts, sharp as ice.
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.registerButton]}
          onPress={() => navigation.navigate("Register")}
        >
          <Text style={styles.buttonText}>Register</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.loginButton]}
          onPress={() => navigation.navigate("Login")}
        >
          <Text style={styles.loginButton}>Login</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B192E",
    justifyContent: "space-between",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  logo: {
    width: 200,
    height: 200,
    resizeMode: "contain",
    marginBottom: 20,
  },
  title: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#E6F1FF",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: "#A8B2D1",
    textAlign: "center",
  },
  buttonContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#112240",
  },
  button: {
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  loginButton: {
    backgroundColor: "#64FFDA",
    color: "112240",
    fontSize: 19,
    fontWeight: "bold",
  },
  registerButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#64FFDA",
  },
  buttonText: {
    color: "#64FFDA",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default LandingScreen;
