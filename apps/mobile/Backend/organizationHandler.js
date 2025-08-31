import { auth, firestore } from '../Firebase';
import { collection, doc, getDocs, setDoc, addDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from "firebase/auth";

export const addOrganization = async (organizationData) => {
    try {
        await addDoc(collection(firestore, 'organizations'), organizationData);

        await createUserWithEmailAndPassword(auth, organizationData.email, "123456");

        await setDoc(doc(firestore, 'Users', organizationData.email), {
            Course: '',
            Year: '',
            email: organizationData.email,
            firstName: organizationData.orgName || '',
            lastName: '',
            following: [],
            followers: [],
            orgs: [],
            profileImage: organizationData.logoBase64 || '',
            group: true,
            role: 'admin', // optional role
            studentNumber: '',
            timestamp: new Date()
        });

    } catch (error) {
        console.error('Error adding organization:', error);
        throw error; 
    }
};

export const getOrganizations = async () => {
    try {
        const querySnapshot = await getDocs(collection(firestore, 'organizations'));
        const organizations = [];
        querySnapshot.forEach((doc) => {
            organizations.push({ id: doc.id, ...doc.data() });
        });
        return organizations;
    } catch (error) {
        console.error('Error fetching organizations:', error);
        throw error;
    }
};

export const getAllUsers = async () => {
    try {
        const snapshot = await getDocs(collection(firestore, 'Users'));
        const users = [];
        snapshot.forEach(doc => {
            users.push(doc.data());
        });
        return users;
    } catch (error) {
        console.error('Error fetching users:', error);
        return [];
    }
};