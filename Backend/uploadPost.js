import { firestore, storage } from '../Firebase'; // Correct imports from Firebase
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'; // Correct Firebase Storage imports
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'; // Correct Firestore imports
import * as ImagePicker from 'expo-image-picker';


// Upload image to Firebase Storage
const uploadImage = async (uri, path) => {
  const response = await fetch(uri);
  const blob = await response.blob();
  const storageRef = ref(storage, path); // Create a reference to Firebase Storage
  await uploadBytes(storageRef, blob); // Upload the blob
  return getDownloadURL(storageRef); // Get the download URL of the uploaded image
};

export const savePost = async (user, postText, images) => {
  const postId = Date.now().toString(); // Generate a unique post ID
  let imageUrls = [];

  // If there are images, upload them to Firebase Storage
  if (images.length > 0) {
    for (const [index, image] of images.entries()) {
      const path = `posts/${postId}/image-${index}`;
      const imageUrl = await uploadImage(image, path);
      imageUrls.push(imageUrl);
    }
  }

  // Prepare the post data
  const post = {
    userId: user.id,
    userName: user.name,
    userProfileImage: user.profileImage,
    text: postText,
    images: imageUrls,
    timestamp: serverTimestamp(), // Correctly use serverTimestamp() from Firestore
  };

  // Save the post to Firestore
  await setDoc(doc(firestore, 'newsfeed', postId), post); // Save the post in the 'newsfeed' collection using the generated postId
  return postId; // Return the generated post ID
};
