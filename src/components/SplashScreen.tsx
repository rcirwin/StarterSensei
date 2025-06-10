import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, Dimensions, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  interpolate,
  Easing,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

// Component for a single twinkling star in the background
const Star: React.FC<{
  initialX: number;
  initialY: number;
  size: number;
  duration: number;
  delay: number;
}> = ({ initialX, initialY, size, duration, delay }) => {
  const opacity = useSharedValue(0.1);

  useEffect(() => {
    opacity.value = withDelay(
      delay * 1000,
      withRepeat(
        withTiming(0.8, {
          duration: duration * 1000,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.star,
        {
          width: size,
          height: size,
          left: (initialX / 100) * width,
          top: (initialY / 100) * height,
        },
        animatedStyle,
      ]}
    />
  );
};

// Component for the star field background
const StarField: React.FC<{ numStars?: number }> = ({ numStars = 60 }) => {
  const stars = useMemo(() => {
    return Array.from({ length: numStars }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2.5 + 0.5, // 0.5px to 3px
      duration: Math.random() * 4 + 3, // 3s to 7s
      delay: Math.random() * 3,
    }));
  }, [numStars]);

  return (
    <View style={styles.starField}>
      {stars.map((star) => (
        <Star
          key={star.id}
          initialX={star.x}
          initialY={star.y}
          size={star.size}
          duration={star.duration}
          delay={star.delay}
        />
      ))}
    </View>
  );
};

// Main Splash Screen component
export const SplashScreen: React.FC = () => {
  const translateX = useSharedValue(-width * 0.2);
  const translateY = useSharedValue(height * 0.2);
  const rotate = useSharedValue(35);
  const scale = useSharedValue(0.6);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Start the flying animation after a short delay
    const timer = setTimeout(() => {
      // Animate to the center of the screen
      translateX.value = withTiming(0, {
        duration: 2500,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
      
      translateY.value = withTiming(0, {
        duration: 2500,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
      
      rotate.value = withTiming(0, {
        duration: 2500,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
      
      scale.value = withTiming(1, {
        duration: 2500,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
      
      opacity.value = withTiming(1, {
        duration: 2500,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#4B442A', '#7A702A']}
        start={{ x: 0, y: 1 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        <StarField numStars={60} />
        <Animated.View style={[styles.logoContainer, animatedStyle]}>
          <Image
            source={require('../../assets/Superbaking Icon Transparent.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  starField: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  star: {
    position: 'absolute',
    borderRadius: 50,
    backgroundColor: 'rgba(255, 248, 178, 0.8)', // yellow-100/80 equivalent
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  logo: {
    width: 180,
    height: 142, // Approximate aspect ratio based on the original code
  },
}); 