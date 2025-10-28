// /services/userposts.ts
import { firestore } from '@/Firebase';
import {
  collection,
  query,
  onSnapshot,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { Post } from '@/app/userposts/page'; // Adjust path if needed

/**
 * Subscribe to all posts in Firestore
 * @param onUpdate Callback with new posts array
 * @param onError Optional error callback
 * @returns Unsubscribe function
 */
export const subscribeToPosts = (
  onUpdate: (posts: Post[]) => void,
  onError?: (err: Error) => void,
) => {
  const postsCollectionRef = collection(firestore, 'newsfeed');
  const q = query(postsCollectionRef);

  const unsubscribe = onSnapshot(
    q,
    (querySnapshot) => {
      const fetchedPosts: Post[] = [];
      querySnapshot.forEach((docSnapshot) => {
        fetchedPosts.push({
          ...(docSnapshot.data() as Omit<Post, 'id'>),
          id: docSnapshot.id,
        });
      });
      onUpdate(fetchedPosts);
    },
    (err) => {
      console.error('Error fetching posts:', err);
      if (onError) onError(err);
    },
  );

  return unsubscribe;
};

/**
 * Delete a post by ID
 * @param postId Firestore document ID
 */
export const deletePost = async (postId: string): Promise<void> => {
  const postRef = doc(firestore, 'newsfeed', postId);
  await deleteDoc(postRef);
};
