import { firestore } from '../Firebase'; // Firestore import
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

// Compress and resize image
const compressImage = async (uri) => {
    const compressed = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 800 } }],
        { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG }
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
            const base64String = reader.result.split(',')[1];
            resolve(base64String);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

export const savePost = async (user, postText, images = [], isEvent = false, sharedData = null) => {
    const postId = Date.now().toString();
    const imageBase64List = [];

    // ✅ Convert and compress images safely
    if (Array.isArray(images) && images.length > 0) {
        for (const image of images) {
            try {
                const compressedUri = await compressImage(image);
                const base64 = await convertToBase64(compressedUri);
                imageBase64List.push(base64);
            } catch (error) {
                console.error("Error processing image:", error);
            }
        }
    }

    // ✅ Build a proper full name (important for display)
    const fullName =
        `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
        user.name ||
        "Unknown User";

    // ✅ Build post object (matches renderPost)
    const post = {
        id: postId,
        user: {
            id: user.id || user.email || "unknown",
            name: fullName,
            profileImage: user.profileImage || null,
            role: user.role || null,
        },
        text: postText || "",
        images: imageBase64List,
        timestamp: serverTimestamp(),
        isEvent: !!isEvent,
        likedBy: [],
        comments: [],
        pinned: false,

        // ✅ Shared post support (handles nested user properly)
        isShared: !!sharedData,
        sharedPostData: sharedData
            ? {
                id: sharedData.id || null,
                text: sharedData.text || "",
                images: sharedData.images || [],
                date: sharedData.date || null,
                user: {
                    id:
                        sharedData.user?.id ||
                        sharedData.userId ||
                        "unknown",
                    name:
                        sharedData.user?.name ||
                        sharedData.userName ||
                        `${sharedData.user?.firstName || ""} ${sharedData.user?.lastName || ""}`.trim() ||
                        "Unknown",
                    profileImage:
                        sharedData.user?.profileImage ||
                        sharedData.profileImage ||
                        null,
                },
            }
            : null,
    };

    // ✅ Clean undefined values (Firestore-safe)
    const cleanObject = (obj) => {
        if (Array.isArray(obj)) {
            return obj.map(cleanObject);
        } else if (obj && typeof obj === "object") {
            const clean = {};
            for (const [key, value] of Object.entries(obj)) {
                if (value !== undefined) clean[key] = cleanObject(value);
            }
            return clean;
        }
        return obj;
    };

    const safePost = cleanObject(post);

    try {
        await setDoc(doc(firestore, "newsfeed", postId), safePost);
        console.log("✅ Post saved successfully:", postId, safePost);
        return postId;
    } catch (error) {
        console.error("❌ Error saving post to Firestore:", error);
        throw error;
    }
};
