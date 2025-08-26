import React, { useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

function Toast({ message, type, onClose }) {
  const isSuccess = type === 'success';

  // Automatically close the toast after a delay
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000); // Same duration as in AppContext

    return () => {
      clearTimeout(timer);
    };
  }, [onClose]);

  return (
    <div
      className={`fixed top-20 right-5 flex items-center px-4 py-3 rounded-lg shadow-lg text-white ${isSuccess ? 'bg-green-500' : 'bg-red-500'} animate-fade-in-down z-50`}
    >
      {isSuccess ? <CheckCircle className="mr-3" /> : <XCircle className="mr-3" />}
      <p className="flex-grow">{message}</p>
      <button onClick={onClose} className="ml-4 p-1 rounded-full hover:bg-white/20">
        <X size={16} />
      </button>
    </div>
  );
}

export default Toast;