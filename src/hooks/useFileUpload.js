import { useState } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const uploadFile = (file, path) => {
    return new Promise((resolve, reject) => {
      if (file.size > 2 * 1024 * 1024) {
        setError('File size cannot exceed 2MB.');
        reject(new Error('File size cannot exceed 2MB.'));
        return;
      }

      const storageRef = ref(storage, `${path}/${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      setUploading(true);
      setError(null);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(progress);
        },
        (error) => {
          setUploading(false);
          setError(error.message);
          reject(error);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            setUploading(false);
            resolve(downloadURL);
          } catch (error) {
            setUploading(false);
            setError(error.message);
            reject(error);
          }
        }
      );
    });
  };

  return { uploading, progress, error, uploadFile };
};

export default useFileUpload;