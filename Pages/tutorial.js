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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const slides = [
  {
    key: 'slide1',
    title: 'Connect',
    description:
      'UE Connect is a mobile platform that streamlines event management, enhances RSO collaboration, and boosts student engagement at UE Caloocan.',
  },
  {
    key: 'slide2',
    title: 'Simplify',
    description:
      'Easily manage event proposals, approvals, and reports in one centralized platform for a hassle-free experience.',
  },
  {
    key: 'slide3',
    title: 'Simplifye',
    description:
      'Easily manage event proposals, approvals, and reports in one centralized platform for a hassle-free experience.',
  },
  {
    key: 'slide4',
    title: 'Simplifyeee',
    description:
      'Easily manage event proposals, approvals, and reports in one centralized platform for a hassle-free experience.',
  },
];

export default function Tutorial() {
  const navigation = useNavigation();
  const scrollViewRef = useRef();
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleStart = () => {
    if (currentIndex < slides.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      scrollViewRef.current.scrollTo({ x: width * nextIndex, animated: true });
    } else {
      navigation.navigate('Landing');
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <ScrollView
            horizontal
            pagingEnabled
            ref={scrollViewRef}
            scrollEnabled={false} // disable manual swiping
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContainer}
          >
            {slides.map((item, index) => (
              <View style={styles.slide} key={item.key}>
                <Image
                  source={require('../assets/logo.png')}
                  style={styles.logo}
                />
                <View style={styles.bulletsContainer}>
                  {slides.map((_, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.bullet,
                        currentIndex === idx && styles.activeBullet,
                      ]}
                    />
                  ))}
                </View>
                <Text style={styles.connectText}>{item.title}</Text>
                <Text style={styles.description}>{item.description}</Text>
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity onPress={handleStart} style={styles.imageButton}>
            <Image
              source={require('../assets/tutorialbtn.png')}
              style={styles.buttonImage}
            />
          </TouchableOpacity>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 300,
    height: 300,
    resizeMode: 'contain',
  },
  connectText: {
    color: '#FE070C',
    fontSize: 28,
    fontWeight: 'bold',
  },
  description: {
    color: '#000',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 20,
  },
  bulletsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  bullet: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ccc',
    marginHorizontal: 5,
  },
  activeBullet: {
    backgroundColor: '#FE070C',
  },
  imageButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
  },
  buttonImage: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
  },
});
