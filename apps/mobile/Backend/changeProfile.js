import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { getDoc, setDoc, doc, updateDoc } from 'firebase/firestore';
import { firestore } from '../Firebase'; // update with your actual Firebase config path

export const updateProfileImage = async (userEmail, setProfile) => {
    try {
        const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        base64: false, // we’ll encode it after resizing
        });
    
        if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0]; // Get the first selected image
        const resized = await ImageManipulator.manipulateAsync(
            selectedAsset.uri,
            [{ resize: { width: 300 } }],
            { base64: true, format: ImageManipulator.SaveFormat.JPEG }
        );
    
        const base64Image = `data:image/jpeg;base64,${resized.base64}`;
    
        if (base64Image.length > 1000000) {
            alert('Image too large. Please choose a smaller one.');
            return;
        }
    
        await updateDoc(doc(firestore, 'Users', userEmail), {
            profileImage: base64Image,
        });
    
        setProfile(base64Image);
        }
    } catch (error) {
        console.error('Error updating profile image:', error);
    }
    };

export const loadProfileImage = async (userEmail, setProfile) => {
    try {
      const userDocRef = doc(firestore, 'Users', userEmail);
      const docSnap = await getDoc(userDocRef);
  
      if (docSnap.exists()) {
        const data = docSnap.data();
        const profileImage = data.profileImage || 'https://cdn-icons-png.flaticon.com/512/8762/8762984.png';
        setProfile(profileImage);
      } else {
        setProfile('https://cdn-icons-png.flaticon.com/512/8762/8762984.png');
      }
    } catch (error) {
      console.error('Error loading profile image:', error);
      setProfile('https://cdn-icons-png.flaticon.com/512/8762/8762984.png');
    }
  };
  
