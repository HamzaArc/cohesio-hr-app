import React from 'react';
import { Calendar, Bell, Plus, MoreHorizontal, CheckCircle } from 'lucide-react';

const notifications = [
  { id: 1, type: 'approval', text: "Ceanu Reeve's time off request requires your approval.", date: 'Nov 22, 2024', status: 'COMPLETED' },
  { id: 2, type: 'approval', text: "Navid Suzuki's time off request requires your approval.", date: 'Nov 22, 2024', status: 'COMPLETED' },
  { id: 3, type: 'review', text: 'New review assigned to you: Year End Performance Review', date: 'Nov 15, 2024', status: 'ACTION REQUIRED' },
];

const events = [
    { id: 1, type: 'away', person: 'Selene Dion', detail: 'is away', subdetail: 'Sick Days for 1.00 day on Nov 22' },
    { id: 2, type: 'birthday', person: 'Mike Cera', detail: "birthday", subdetail: 'Happy Birthday!' },
    { id: 3, type: 'away', person: 'Navid Suzuki', detail: 'is away' },
];

function Dashboard() {
  return (
    <div className="p-8">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Good afternoon, Beth</h1>
          <p className="text-gray-500">Here's what's happening</p>
        </div>
        <button className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-sm">
          <Plus size={20} className="mr-2" />
          Create announcement
        </button>
      </header>

      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center mb-4">
                <button className="bg-blue-100 text-blue-600 font-semibold py-1 px-3 rounded-full text-sm">Inbox</button>
                <button className="text-gray-500 font-semibold py-1 px-3 rounded-full text-sm ml-2">My tasks</button>
            </div>
            <ul>
              {notifications.map(item => (
                <li key={item.id} className="flex items-center justify-between py-4 border-b last:border-b-0 border-gray-100">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-full mr-4 ${item.type === 'approval' ? 'bg-orange-100' : 'bg-green-100'}`}>
                      {item.type === 'approval' ? <Calendar className="text-orange-500" /> : <CheckCircle className="text-green-500" />}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{item.text}</p>
                      <p className="text-sm text-gray-500">Due date: {item.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className={`text-xs font-bold py-1 px-2 rounded-full ${item.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {item.status}
                    </span>
                    <MoreHorizontal className="text-gray-400 ml-4 cursor-pointer" />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg text-gray-800">Events</h2>
              <Calendar className="text-gray-400" />
            </div>
            <div>
                {events.map(event => (
                    <div key={event.id} className="flex items-start py-3">
                        <img src={`https://placehold.co/40x40/E2E8F0/4A5568?text=${event.person.charAt(0)}`} alt={event.person} className="w-10 h-10 rounded-full mr-4" />
                        <div>
                            <p className="font-semibold text-gray-700">{event.person}'s {event.detail}</p>
                            {event.subdetail && <p className="text-sm text-gray-500">{event.subdetail}</p>}
                        </div>
                    </div>
                ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Dashboard;
