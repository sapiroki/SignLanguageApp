import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, Platform } from 'react-native';

const TabBarIcon = ({ name, color, size, focused }) => {
  return (
    <View style={[
      styles.container, 
      focused && styles.focused
    ]}>
      <Ionicons 
        name={name} 
        size={size} 
        color={color}
        style={styles.icon}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  focused: {},
  icon: {
    marginBottom: Platform.OS === 'ios' ? 2 : 0,
  }
});

export default TabBarIcon;
