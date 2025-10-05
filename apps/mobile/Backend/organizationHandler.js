import { firestore } from '../Firebase'; // Match your existing import
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Original addOrg function (commented out)
/*
export const addOrg = async (orgData) => {
    try {
        const docRef = await addDoc(collection(db, 'organizations'), {
            ...orgData,
            createdAt: serverTimestamp(),
        });
        return docRef.id;
    } catch (error) {
        console.error('Error adding organization:', error);
        throw error;
    }
};
*/

/**
 * Convert file (document or image) to base64
 * @param {string} uri - File URI
 * @returns {Promise<string>} - Base64 string
 */
const convertFileToBase64 = async (uri) => {
    try {
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
    } catch (error) {
        console.error('Error converting file to base64:', error);
        throw error;
    }
};



/**
 * Process and convert document to base64
 * @param {Object} file - File object with uri, name, and size
 * @param {string} documentType - Type of document
 * @returns {Promise<Object>} - Object with base64 data and metadata
 */
const processDocument = async (file, documentType) => {
    try {
        if (!file || !file.uri) {
            throw new Error('Invalid file object');
        }

        console.log(`Processing ${documentType}...`);
        const base64String = await convertFileToBase64(file.uri);

        return {
            base64: base64String,
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.mimeType || 'application/pdf',
            uploadedAt: new Date().toISOString(),
        };
    } catch (error) {
        console.error(`Error processing ${documentType}:`, error);
        throw error;
    }
};

/**
 * Register a new organization with all required documents + logo
 * @param {Object} formData - Organization information
 * @param {Object} documents - All required documents
 * @param {Object} logo - Organization logo image {uri, name, size, mimeType}
 * @returns {Promise<Object>} - Created organization data with ID
 */
export const registerOrganization = async (formData, documents, logo) => {
    try {

        const auth = getAuth();
        const user = auth.currentUser;

        // Validate required fields
        if (!formData.organizationName || !formData.acronym || !formData.department) {
            throw new Error('Missing required organization information');
        }

        if (!formData.email || !formData.presidentName || !formData.presidentId || !formData.adviserName) {
            throw new Error('Missing required president information');
        }

        // Validate all required documents are present
        const requiredDocuments = [
            'constitutionByLaws',
            // 'facultyAdviser',
            'atoApplication',
            'officersList',
            'gpoa',
            'registrationForm'
        ];

        for (const docType of requiredDocuments) {
            if (!documents[docType]) {
                throw new Error(`Missing required document: ${docType}`);
            }
        }

        // Check if acronym already exists
        const orgQuery = query(
            collection(firestore, 'organizations'),
            where('acronym', '==', formData.acronym.toUpperCase())
        );
        const querySnapshot = await getDocs(orgQuery);

        if (!querySnapshot.empty) {
            throw new Error('An organization with this acronym already exists');
        }

        // Process all documents to base64
        console.log('Processing documents to base64...');
        const processedDocuments = {};

        for (const [docType, docFile] of Object.entries(documents)) {
            if (docFile) {
                console.log(`Converting ${docType} to base64...`);
                processedDocuments[docType] = await processDocument(docFile, docType);
            }
        }

        // Process logo if provided
        let processedLogo = null;
        if (logo && logo.uri) {
            console.log('Processing organization logo...');
            const base64Logo = await convertFileToBase64(logo.uri);
            processedLogo = {
                base64: base64Logo,
                fileName: logo.name || 'org_logo.png',
                fileSize: logo.size || null,
                mimeType: logo.mimeType || 'image/png',
                uploadedAt: new Date().toISOString(),
            };
        }

        // Prepare organization data for Firestore
         const organizationData = {
            // Basic Info
            orgName: formData.organizationName,
            acronym: formData.acronym.toUpperCase(),
            department: formData.department,
            shortdesc: formData.description || '',
            email: formData.email,
            contactNumber: formData.contactNumber || '',
            location: formData.location || '',

            // President Info
            presidentName: formData.presidentName,
            presidentStudentId: formData.presidentId,

            adviserName: formData.adviserName,

            // Required Documents
            constitutionByLawsBase64: processedDocuments.constitutionByLaws.base64,
            constitutionByLawsFileName: processedDocuments.constitutionByLaws.fileName,
            constitutionByLawsFileSize: processedDocuments.constitutionByLaws.fileSize,

            // facultyAdviserBase64: processedDocuments.facultyAdviser.base64,
            // facultyAdviserFileName: processedDocuments.facultyAdviser.fileName,
            // facultyAdviserFileSize: processedDocuments.facultyAdviser.fileSize,

            atoApplicationBase64: processedDocuments.atoApplication.base64,
            atoApplicationFileName: processedDocuments.atoApplication.fileName,
            atoApplicationFileSize: processedDocuments.atoApplication.fileSize,

            officersListBase64: processedDocuments.officersList.base64,
            officersListFileName: processedDocuments.officersList.fileName,
            officersListFileSize: processedDocuments.officersList.fileSize,

            gpoaBase64: processedDocuments.gpoa.base64,
            gpoaFileName: processedDocuments.gpoa.fileName,
            gpoaFileSize: processedDocuments.gpoa.fileSize,

            registrationFormBase64: processedDocuments.registrationForm.base64,
            registrationFormFileName: processedDocuments.registrationForm.fileName,
            registrationFormFileSize: processedDocuments.registrationForm.fileSize,

            // Logo
            logoBase64: processedLogo ? processedLogo.base64 : null,
            logoFileName: processedLogo ? processedLogo.fileName : null,
            logoFileSize: processedLogo ? processedLogo.fileSize : null,

            // Status & Meta
            status: 'applied',
            registrationType: 'new',
            members: [],
            officers: [],

            // Track who registered the org
            registeredBy: user.email,  // ✅ store the email here

            submittedAt: serverTimestamp(),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };


        // Save to Firestore
        console.log('Saving organization to Firestore...');
        const docRef = await addDoc(collection(firestore, 'organizations'), organizationData);

        console.log('Organization registered successfully with ID:', docRef.id);

        return {
            id: docRef.id,
            ...organizationData,
        };
    } catch (error) {
        console.error('Error registering organization:', error);
        throw error;
    }
};

/**
 * Get all organizations (existing function - keep as is)
 */
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

/**
 * Get all approved organizations (existing function - keep as is)
 */
export const getApprovedOrganizations = async () => {
    try {
        const q = query(
            collection(firestore, "organizations"),
            where("status", "==", "approved")
        );

        const querySnapshot = await getDocs(q);
        const organizations = [];

        querySnapshot.forEach((doc) => {
            organizations.push({ id: doc.id, ...doc.data() });
        });

        return organizations;
    } catch (error) {
        console.error("Error fetching approved organizations:", error);
        throw error;
    }
};

/**
 * Get organization by ID
 */
export const getOrganizationById = async (orgId) => {
    try {
        const docRef = doc(firestore, 'organizations', orgId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            return {
                id: docSnap.id,
                ...docSnap.data(),
            };
        } else {
            throw new Error('Organization not found');
        }
    } catch (error) {
        console.error('Error fetching organization:', error);
        throw error;
    }
};

/**
 * Update organization status (for admin approval)
 */
export const updateOrganizationStatus = async (orgId, status, reviewNotes = '') => {
    try {
        const docRef = doc(firestore, 'organizations', orgId);
        
        await updateDoc(docRef, {
            status: status, // 'approved' or 'rejected'
            reviewNotes: reviewNotes,
            reviewedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        
        return { success: true };
    } catch (error) {
        console.error('Error updating organization status:', error);
        throw error;
    }
};

/**
 * Get applied organizations (for admin review)
 */
export const getAppliedOrganizations = async () => {
    try {
        const q = query(
            collection(firestore, 'organizations'),
            where('status', '==', 'applied')
        );
        
        const querySnapshot = await getDocs(q);
        const appliedOrgs = [];
        
        querySnapshot.forEach((doc) => {
            appliedOrgs.push({
                id: doc.id,
                ...doc.data(),
            });
        });
        
        return appliedOrgs;
    } catch (error) {
        console.error('Error fetching applied organizations:', error);
        throw error;
    }
};

/**
 * Get organizations by department
 */
export const getOrganizationsByDepartment = async (department) => {
    try {
        const q = query(
            collection(firestore, 'organizations'),
            where('department', '==', department),
            where('status', '==', 'approved')
        );
        
        const querySnapshot = await getDocs(q);
        const organizations = [];
        
        querySnapshot.forEach((doc) => {
            organizations.push({
                id: doc.id,
                ...doc.data(),
            });
        });
        
        return organizations;
    } catch (error) {
        console.error('Error fetching organizations by department:', error);
        throw error;
    }
};

export const checkAppliedOrganization = async () => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user || !user.email) {
      return null; // no user logged in
    }

    const orgQuery = query(
      collection(firestore, 'organizations'),
      where('registeredBy', '==', user.email)
      // Remove status filter to get all applications by user
    );

    const querySnapshot = await getDocs(orgQuery);

    if (!querySnapshot.empty) {
      // Sort by createdAt or submittedAt (newest first)
      const orgs = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => {
          const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
          const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
          return bTime - aTime;
        });
      return orgs[0]; // Return the latest application
    }

    return null; // no application
  } catch (error) {
    console.error('Error checking pending organization:', error);
    return null;
  }
};

/**
 * Helper function to download document from base64
 * @param {string} base64String - Base64 encoded document
 * @param {string} fileName - Original file name
 * @param {string} mimeType - MIME type of the document
 */
export const downloadDocumentFromBase64 = (base64String, fileName, mimeType) => {
    try {
        // For web platforms
        if (typeof window !== 'undefined') {
            const linkSource = `data:${mimeType};base64,${base64String}`;
            const downloadLink = document.createElement('a');
            downloadLink.href = linkSource;
            downloadLink.download = fileName;
            downloadLink.click();
        }
        // For mobile, you would need to use expo-file-system or similar
    } catch (error) {
        console.error('Error downloading document:', error);
        throw error;
    }
};