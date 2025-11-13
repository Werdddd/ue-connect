'use client';

import { useState } from 'react';
import { firestore, auth } from '@/Firebase';
import { collection, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';

interface Props {
  open: boolean;
  onClose: () => void;
  userEmail: string;
}

export default function RegisterOrganizationModal({ open, onClose, userEmail }: Props) {
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    organizationName: '',
    acronym: '',
    department: '',
    description: '',
    email: '',
    password: '', // ✅ added password
    contactNumber: '',
    location: '',
    presidentName: '',
    presidentId: '',
    adviserName: '',
  });

  const [processedLogo, setProcessedLogo] = useState<any>(null);
  const [processedDocuments, setProcessedDocuments] = useState<any>({
    constitutionByLaws: {},
    atoApplication: {},
    officersList: {},
    gpoa: {},
    registrationForm: {},
  });

  if (!open) return null;

  // Converts uploaded files to base64
  const fileToBase64 = (file: File) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () =>
        resolve({
          base64: reader.result as string,
          fileName: file.name,
          fileSize: file.size,
        });
      reader.onerror = (error) => reject(error);
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (key: string, file: File | null) => {
    if (!file) return;
    const base64File = await fileToBase64(file);

    if (key === 'logo') {
      setProcessedLogo(base64File);
    } else {
      setProcessedDocuments((prev: any) => ({
        ...prev,
        [key]: base64File,
      }));
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Create Firebase Auth account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;

      // Create Users record (using email as doc ID)
      await setDoc(doc(firestore, 'Users', formData.email), {
        firstName: formData.organizationName,
        lastName: '',
        role: 'admin',
        email: formData.email,
        timestamp: serverTimestamp(),
      });

      // Prepare organization data
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

        // Meta
        status: 'approved',
        registrationType: 'new',
        members: [],
        officers: [],
        registeredBy: userEmail,
        submittedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Save organization data — use email as document ID
      await setDoc(doc(firestore, 'organizations', formData.email), organizationData);

      alert('Organization registered successfully!');
      onClose();
    } catch (error: any) {
      console.error('Error registering organization:', error);
      if (error.code === 'auth/email-already-in-use') {
        alert('Email already in use. Please use a different email.');
      } else {
        alert('Error registering organization. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-xl">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Register New Organization</h2>

        <div className="space-y-3">
          {/* Organization Info */}
          <div>
            <label className="block text-sm font-medium">Organization Name *</label>
            <input
              name="organizationName"
              onChange={handleInputChange}
              className="w-full border rounded-lg p-2 mt-1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Acronym *</label>
            <input
              name="acronym"
              onChange={handleInputChange}
              className="w-full border rounded-lg p-2 mt-1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Department *</label>
            <select
              name="department"
              onChange={handleInputChange}
              className="w-full border rounded-lg p-2 mt-1"
            >
              <option value="">Select Department *</option>
              <option value="University Wide">University Wide</option>
              <option value="CSC">CSC</option>
              <option value="COE">COE</option>
              <option value="CAS">CAS</option>
              <option value="CFAD">CFAD</option>
              <option value="CBA">CBA</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Description *</label>
            <input
              name="description"
              onChange={handleInputChange}
              className="w-full border rounded-lg p-2 mt-1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Email *</label>
            <input
              name="email"
              type="email"
              onChange={handleInputChange}
              className="w-full border rounded-lg p-2 mt-1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Password *</label>
            <input
              name="password"
              type="password"
              onChange={handleInputChange}
              className="w-full border rounded-lg p-2 mt-1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Contact Number *</label>
            <input
              name="contactNumber"
              onChange={handleInputChange}
              className="w-full border rounded-lg p-2 mt-1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Location *</label>
            <input
              name="location"
              onChange={handleInputChange}
              className="w-full border rounded-lg p-2 mt-1"
            />
          </div>

          {/* President & Adviser */}
          <hr className="my-3" />
          <div>
            <label className="block text-sm font-medium">President Name *</label>
            <input
              name="presidentName"
              onChange={handleInputChange}
              className="w-full border rounded-lg p-2 mt-1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">President Student ID *</label>
            <input
              name="presidentId"
              onChange={handleInputChange}
              className="w-full border rounded-lg p-2 mt-1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Adviser Name *</label>
            <input
              name="adviserName"
              onChange={handleInputChange}
              className="w-full border rounded-lg p-2 mt-1"
            />
          </div>

          {/* Logo */}
          <hr className="my-3" />
          <div>
            <label className="block text-sm font-medium">Organization Logo *</label>
            <input
              type="file"
              onChange={(e) => handleFileChange('logo', e.target.files?.[0] || null)}
              className="w-full border rounded-lg p-2 mt-1"
            />
          </div>

          {/* Required Docs */}
          {Object.keys(processedDocuments).map((key) => (
            <div key={key}>
              <label className="block text-sm font-medium">{key} *</label>
              <input
                type="file"
                onChange={(e) => handleFileChange(key, e.target.files?.[0] || null)}
                className="w-full border rounded-lg p-2 mt-1"
              />
            </div>
          ))}

          {/* Buttons */}
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
            >
              {loading ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
