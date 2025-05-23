import { firestore } from '../Firebase'; // Firestore import
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

// Compress and resize image
const compressImage = async (uri) => {
  const compressed = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 800 } }], // Resize width to 800px
    { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG } // Compress to 50% quality
  );
  return compressed.uri;
};

// Convert image to base64
const convertToBase64 = async (uri) => {
  const response = await fetch(uri);
  const blob = await response.blob();
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result.split(',')[1]; // Remove "data:image/jpeg;base64," part
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Save post with base64 images
export const savePost = async (user, postText, images) => {
  const postId = Date.now().toString(); // Unique post ID
  let imageBase64List = [];

  if (images.length > 0) {
    for (const image of images) {
      try {
        const compressedUri = await compressImage(image); // Compress first
        const base64 = await convertToBase64(compressedUri); // Then convert to base64
        imageBase64List.push(base64);
      } catch (error) {
        console.error('Error processing image:', error);
      }
    }
  }

  // Prepare the post data
  const post = {
    userId: user.id,
    userName: user.name,
    //profileImage: user.profileImage,
    text: postText,
    images: imageBase64List,
    timestamp: serverTimestamp(),
    likedBy: [],
    pinned: false,
  };

  // Save the post to Firestore
  try {
    await setDoc(doc(firestore, 'newsfeed', postId), post);
    console.log('Post saved successfully!');
    return postId;
  } catch (error) {
    console.error('Error saving post to Firestore:', error);
    throw error;
  }
};
