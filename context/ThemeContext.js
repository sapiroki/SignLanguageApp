import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useMemo,
} from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const THEME_PREFERENCE_KEY = "theme_preference";

const lightTheme = {
  primary: "#4e92df", 
  primaryDark: "#3a78c2", 
  primaryLight: "#72aceb", 
  onPrimary: "#ffffff", 

  background: "#f5f7fa", 
  surface: "#ffffff", 
  onBackground: "#1a1a1a", 

  text: "#1a1a1a", 
  textSecondary: "#555555", 

  border: "#e1e4e8", 

  error: "#d32f2f", 
  onError: "#ffffff", 

  success: "#4caf50", 
  onSuccess: "#ffffff", 

  warning: "#ff9800", 
  onWarning: "#ffffff", 

  info: "#2196f3", 
  onInfo: "#ffffff", 

  modalBackground: "rgba(0, 0, 0, 0.5)",
  cardShadow: "#000000",
  tabBarBackground: "#ffffff",
};

const darkTheme = {
  primary: "#64b5f6", 
  primaryDark: "#4da6ff", 
  primaryLight: "#90caf9", 
  onPrimary: "#000000", 

  background: "#121212", 
  surface: "#1e1e1e", 
  onBackground: "#ffffff", 

  text: "#ffffff", 
  textSecondary: "#aaaaaa", 

  border: "#333333", 

  error: "#ef5350", 
  onError: "#000000", 

  success: "#81c784", 
  onSuccess: "#000000", 

  warning: "#ffb74d", 
  onWarning: "#000000", 

  info: "#64b5f6", 
  onInfo: "#000000", 

  modalBackground: "rgba(0, 0, 0, 0.7)",
  cardShadow: "#000000",
  tabBarBackground: "#1a1a1a",
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const deviceColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(deviceColorScheme === "dark");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const themePreference = await AsyncStorage.getItem(
          THEME_PREFERENCE_KEY
        );

        if (themePreference !== null) {
          setIsDarkMode(themePreference === "dark");
        } else {
          setIsDarkMode(deviceColorScheme === "dark");
        }
      } catch (error) {
        console.error("Error loading theme preference:", error);
        setIsDarkMode(deviceColorScheme === "dark");
      } finally {
        setIsLoading(false);
      }
    };

    loadThemePreference();
  }, [deviceColorScheme]);

  const toggleTheme = async () => {
    try {
      const newTheme = !isDarkMode;
      await AsyncStorage.setItem(
        THEME_PREFERENCE_KEY,
        newTheme ? "dark" : "light"
      );
      setIsDarkMode(newTheme);
    } catch (error) {
      console.error("Error saving theme preference:", error);
    }
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  const contextValue = useMemo(
    () => ({
      theme,
      isDarkMode,
      toggleTheme,
      isLoading,
    }),
    [theme, isDarkMode, isLoading]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {!isLoading && children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
