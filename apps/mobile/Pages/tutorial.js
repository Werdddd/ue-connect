import React, { useRef, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
  Platform,
  Dimensions,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const slides = [
  {
    key: 'slide1',
    title: 'Connect',
    description:
      'UE Connect is a mobile platform that streamlines event management, enhances RSO collaboration, and boosts student engagement at UE Caloocan.',
    image: require('../assets/slide1.png'), // Add your custom image
    gradient: ['#FF6B6B', '#FE070C'],
  },
  {
    key: 'slide2',
    title: 'Simplify',
    description:
      'Easily manage event proposals, approvals, and reports in one centralized platform for a hassle-free experience.',
    image: require('../assets/slide2.png'), // Add your custom image
    gradient: ['#34A853', '#34A853'],
  },
  {
    key: 'slide3',
    title: 'Engage',
    description:
      'Discover and join RSOs, attend events, and stay connected with campus activities through real-time updates.',
    image: require('../assets/slide3.png'), // Add your custom image
    gradient: ['#FFB347', '#FFB347'],
  },
  {
    key: 'slide4',
    title: 'Collaborate',
    description:
      'Seamlessly communicate with RSOs, coordinate with SAO, and plan successful events with built-in tools.',
    image: require('../assets/slide4.png'), // Add your custom image
    gradient: ['#1E88E5', '#1E88E5'],
  },
];

export default function Tutorial() {
  const navigation = useNavigation();
  const scrollViewRef = useRef();
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const handleStart = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      if (currentIndex < slides.length - 1) {
        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);
        scrollViewRef.current.scrollTo({ x: width * nextIndex, animated: true });
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      } else {
        navigation.navigate('Landing');
      }
    });
  };

  const handleSkip = () => {
    navigation.navigate('Landing');
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          {/* Skip Button
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity> */}

          <ScrollView
            horizontal
            pagingEnabled
            ref={scrollViewRef}
            scrollEnabled={false}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContainer}
          >
            {slides.map((item, index) => (
              <View style={styles.slide} key={item.key}>
                <Animated.View style={[styles.slideContent, { opacity: fadeAnim }]}>
                  {/* Image Container with gradient background */}
                  <View style={styles.imageContainer}>
                    
                      <Image
                        source={item.image}
                        style={styles.slideImage}
                        resizeMode="contain"
                      />
                 
                  </View>

                  {/* Content Section */}
                  <View style={styles.contentSection}>
                    {/* Pagination Dots */}
                    <View style={styles.bulletsContainer}>
                      {slides.map((_, idx) => (
                        <View
                          key={idx}
                          style={[
                            styles.bullet,
                            currentIndex === idx && styles.activeBullet,
                            currentIndex === idx && {
                              backgroundColor: item.gradient[1],
                            },
                          ]}
                        />
                      ))}
                    </View>

                    <Text style={[styles.title, { color: item.gradient[1] }]}>
                      {item.title}
                    </Text>
                    <Text style={styles.description}>{item.description}</Text>
                  </View>
                </Animated.View>
              </View>
            ))}
          </ScrollView>

          {/* Bottom Navigation */}
          <View style={styles.bottomContainer}>
            <TouchableOpacity
              onPress={handleStart}
              style={[
                styles.button,
                {
                  backgroundColor: slides[currentIndex].gradient[1],
                },
              ]}
            >
              <Text style={styles.buttonText}>
                {currentIndex < slides.length - 1 ? 'Next' : 'Get Started'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexDirection: 'row',
  },
  slide: {
    width,
    flex: 1,
  },
  slideContent: {
    flex: 1,
    alignItems: 'center',
  },
  skipButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 20,
    zIndex: 10,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  skipText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  imageContainer: {
    width: width,
    height: height * 0.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  gradientBackground: {
    width: width * 0.85,
    height: '85%',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  slideImage: {
    width: '80%',
    height: '80%',
  },
  contentSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 30,
    paddingTop: 5,
  },
  bulletsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 4,
  },
  activeBullet: {
    width: 24,
    backgroundColor: '#FE070C',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  description: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 70,
    left: 30,
    right: 30,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});