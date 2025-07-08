import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import Icon from "react-native-vector-icons/Ionicons";

import HomePage from "./AppPages/HomePage";
import NotesListScreen from "./AppPages/NotesListScreen";
import RecordingsScreen from "./AppPages/RecordingsScreen";
import RecordingDetailScreen from "./AppPages/RecordingDetailScreen";
import ProfileScreen from "./AppPages/ProfileScreen";
import SettingsScreen from "./AppPages/SettingsScreen";
import NewRecordingScreen from "./AppPages/NewRecordingScreen";

const Tab = createBottomTabNavigator();
const RecordingsStack = createStackNavigator();

const RecordingsStackScreen = () => (
  <RecordingsStack.Navigator screenOptions={{ headerShown: false }}>
    <RecordingsStack.Screen
      name="RecordingsMain"
      component={RecordingsScreen}
    />
    <RecordingsStack.Screen
      name="NewRecording"
      component={NewRecordingScreen}
    />
    <RecordingsStack.Screen
      name="RecordingDetail"
      component={RecordingDetailScreen}
    />
  </RecordingsStack.Navigator>
);

const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#112240",
          borderTopWidth: 0,
        },
        tabBarActiveTintColor: "#64FFDA",
        tabBarInactiveTintColor: "#A8B2D1",
        tabBarLabelStyle: {
          fontSize: 13,
          fontWeight: "bold",
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Recordings") {
            iconName = focused ? "mic" : "mic-outline";
          } else if (route.name === "Notes") {
            iconName = focused ? "document-text" : "document-text-outline";
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline";
          }
          return <Icon name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomePage} />
      <Tab.Screen name="Recordings" component={RecordingsStackScreen} />
      <Tab.Screen name="Notes" component={NotesListScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;
