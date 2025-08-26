import React from 'react';
import { List } from 'lucide-react';
import { StatusBadge } from './helpers.jsx';

export default function ActivityLogTab({ caseData }) {
    const history = caseData.history || [];

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <List size={20} />
                Case History
            </h3>
            <div className="relative border-l-2 border-gray-200 pl-6 space-y-6">
                {history.length > 0 ? (
                    history.slice().reverse().map((entry, index) => (
                        <div key={index} className="relative">
                            <div className="absolute -left-[34px] top-1 w-4 h-4 bg-white border-2 border-blue-600 rounded-full"></div>
                            <p className="text-sm text-gray-500">
                                {entry.timestamp ? new Date(entry.timestamp.seconds * 1000).toLocaleString() : 'Just now'}
                            </p>
                            <div className="flex items-center mt-1">
                                <p className="font-semibold text-gray-800">{entry.user}</p>
                                <p className="text-gray-600 mx-2">changed status from</p>
                                <StatusBadge value={entry.from} />
                                <p className="text-gray-600 mx-2">to</p>
                                <StatusBadge value={entry.to} />
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-gray-500">No status changes have been recorded.</p>
                )}
            </div>
        </div>
    );
}
