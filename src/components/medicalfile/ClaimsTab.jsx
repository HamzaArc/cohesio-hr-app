import React from 'react';

export default function ClaimsTab({ caseData, onNestedUpdate }) {
    const cnss = caseData.cnss || {};
    const mutuelle = caseData.mutuelle || {};

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-bold text-gray-800 mb-4">CNSS Claim</h3>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Claim Number</label>
                    <input
                        type="text"
                        value={cnss.claimNumber || ''}
                        onChange={(e) => onNestedUpdate('cnss', 'claimNumber', e.target.value)}
                        placeholder="e.g., CNSS-12345"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    />
                    <p className="text-xs text-gray-500 mt-1">Enter the acknowledgment/claim number to track with CNSS.</p>
                </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Mutuelle Claim</h3>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Claim Number</label>
                    <input
                        type="text"
                        value={mutuelle.claimNumber || ''}
                        onChange={(e) => onNestedUpdate('mutuelle', 'claimNumber', e.target.value)}
                        placeholder="e.g., AX-7741"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    />
                </div>
            </div>
        </div>
    );
}
