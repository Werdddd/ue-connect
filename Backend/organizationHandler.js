import { firestore } from '../Firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';

export const addOrganization = async (organizationData) => {
    try {
        await addDoc(collection(firestore, 'organizations'), organizationData);
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
