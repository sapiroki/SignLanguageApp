import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Text, Pressable } from 'react-native';
import { Video } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const VideoPlayer = ({ 
  videoUrl, 
  style = {},
  resizeMode = "contain", 
  compact = false,
  showControls = true,
  muted = false,
  autoPlay = null,
  disableFullscreenTouch = false
}) => {
  const video = useRef(null);
  const [status, setStatus] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [shouldAutoPlay, setShouldAutoPlay] = useState(null);
  const [preferenceLoaded, setPreferenceLoaded] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    const loadAutoPlayPreference = async () => {
      try {
        if (autoPlay !== null) {
          setShouldAutoPlay(autoPlay);
          setPreferenceLoaded(true);
          return;
        }
        
        const autoPlayStr = await AsyncStorage.getItem('autoPlayVideos');
        setShouldAutoPlay(autoPlayStr === 'true');
        setPreferenceLoaded(true);
      } catch (error) {
        console.error('Error loading auto-play preference:', error);
        setShouldAutoPlay(false);
        setPreferenceLoaded(true);
      }
    };
    
    loadAutoPlayPreference();
  }, [autoPlay]);

  useEffect(() => {
    if (preferenceLoaded && status.isLoaded && !status.isPlaying && shouldAutoPlay) {
      playVideo();
    }
  }, [preferenceLoaded, status.isLoaded, shouldAutoPlay]);

  const handlePlaybackStatusUpdate = (status) => {
    setStatus(status);
    if (status.isLoaded) {
      setIsLoading(false);
    }
  };

  const handleError = (error) => {
    console.error("Video error:", error);
    setIsLoading(false);
  };

  const playVideo = async () => {
    if (video.current) {
      try {
        await video.current.playAsync();
      } catch (error) {
        console.error("Error playing video:", error);
      }
    }
  };
  
  const pauseVideo = async () => {
    if (video.current) {
      try {
        await video.current.pauseAsync();
      } catch (error) {
        console.error("Error pausing video:", error);
      }
    }
  };

  const togglePlayback = async (e) => {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    
    if (status.isPlaying) {
      await pauseVideo();
    } else {
      await playVideo();
    }
  };

  const togglePlaybackSpeed = async (e) => {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    
    const newRate = playbackRate === 1.0 ? 0.5 : 1.0;
    setPlaybackRate(newRate);
    
    if (video.current) {
      try {
        await video.current.setRateAsync(newRate, true);
      } catch (error) {
        console.error("Error setting playback rate:", error);
      }
    }
  };

  const restartVideo = async (e) => {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    
    if (video.current) {
      try {
        await video.current.setPositionAsync(0);
        if (!status.isPlaying) {
          await playVideo();
        }
      } catch (error) {
        console.error("Error restarting video:", error);
      }
    }
  };

  const isUriString = typeof videoUrl === 'string';

  return (
    <View style={[styles.container, style]}>
      {videoUrl ? (
        <>
          <Video
            ref={video}
            style={styles.video}
            source={isUriString ? { uri: videoUrl } : videoUrl}
            useNativeControls={false}
            resizeMode={resizeMode}
            isLooping
            rate={playbackRate}
            isMuted={muted}
            shouldCorrectPitch={true}
            onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
            onLoad={() => setIsLoading(false)}
            onError={handleError}
          />
          
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          )}
          
          {playbackRate === 0.5 && !compact && (
            <View style={styles.speedIndicator}>
              <Text style={styles.speedIndicatorText}>0.5×</Text>
            </View>
          )}
          
          {showControls && !isLoading && (
            <View 
              style={[
                styles.controlsContainer,
                compact && styles.compactControlsContainer
              ]}
              pointerEvents="box-none"
            >
              {!compact && (
                <TouchableOpacity 
                  style={styles.controlButton}
                  onPress={restartVideo}
                  activeOpacity={0.7}
                >
                  <Ionicons name="refresh" size={22} color="#fff" />
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={[
                  styles.controlButton, 
                  compact && styles.compactControlButton
                ]} 
                onPress={togglePlayback}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name={status.isPlaying ? "pause" : "play"} 
                  size={compact ? 14 : 22} 
                  color="#fff" 
                />
              </TouchableOpacity>
              
              {!compact && (
                <TouchableOpacity 
                  style={[
                    styles.controlButton,
                    playbackRate === 0.5 && styles.activeSpeedButton
                  ]} 
                  onPress={togglePlaybackSpeed}
                  activeOpacity={0.7}
                >
                  <Text style={styles.speedText}>
                    {playbackRate === 0.5 ? "0.5×" : "1×"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          
          {compact && !isLoading && !disableFullscreenTouch && (
            <Pressable
              style={styles.fullSizeButton}
              onPress={(e) => {
                e.stopPropagation();
                togglePlayback();
              }}
            />
          )}
        </>
      ) : (
        <View style={styles.placeholderContainer}>
          <Ionicons name="videocam-off" size={compact ? 30 : 50} color="#fff" />
          {!compact && <Text style={styles.placeholderText}>No video available</Text>}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  controlsContainer: {
    position: 'absolute',
    left: 10,
    top: 0,
    bottom: 0,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    pointerEvents: 'box-none',
  },
  compactControlsContainer: {
    width: 24,
    left: 4,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  compactControlButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginVertical: 4,
    borderWidth: 0,
  },
  placeholderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  placeholderText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
  fullSizeButton: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  speedIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(66, 165, 245, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  speedIndicatorText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  activeSpeedButton: {
    backgroundColor: 'rgba(66, 165, 245, 0.8)',
    borderColor: '#fff',
  },
  speedText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default VideoPlayer;
