import { firestore } from '../Firebase';
import { collection, addDoc } from 'firebase/firestore';

export const addOrganization = async (organizationData) => {
    try {
        await addDoc(collection(firestore, 'organizations'), organizationData);
    } catch (error) {
        console.error('Error adding organization:', error);
        throw error; 
    }
};


