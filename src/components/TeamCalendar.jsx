import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const getMonthName = (monthIndex) => {
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return months[monthIndex];
};

const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

// The component now accepts weekends and holidays as props
function TeamCalendar({ events, weekends, holidays }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const goToPreviousMonth = () => setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  const goToNextMonth = () => setCurrentDate(new Date(currentYear, currentMonth + 1, 1));

  const calendarGrid = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    
    // Create sets for quick lookups
    const holidayDates = new Set(holidays.map(h => h.date));
    const weekendDays = Object.keys(weekends).filter(day => weekends[day]).map(day => {
        const map = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
        return map[day];
    });

    const grid = [];
    for (let i = 0; i < firstDayOfMonth; i++) grid.push({ key: `blank-${i}` });
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
      const dateString = date.toISOString().split('T')[0];
      const dayOfWeek = date.getDay();

      const dayEvents = events.filter(event => {
        const startDate = new Date(event.startDate);
        const endDate = new Date(event.endDate);
        startDate.setHours(0,0,0,0);
        endDate.setHours(0,0,0,0);
        date.setHours(0,0,0,0);
        return date >= startDate && date <= endDate;
      });
      
      grid.push({ 
        key: `day-${day}`, 
        day, 
        events: dayEvents,
        isWeekend: weekendDays.includes(dayOfWeek),
        isHoliday: holidayDates.has(dateString),
        holidayName: holidays.find(h => h.date === dateString)?.name
      });
    }
    return grid;
  }, [currentYear, currentMonth, events, weekends, holidays]);

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // --- NEW: Beautiful gradient and shadow styles for each event type ---
  const getEventTypeStyle = (type) => {
    switch(type) {
        case 'Vacation': return 'bg-gradient-to-r from-blue-400 to-blue-500 shadow-md shadow-blue-500/20';
        case 'Sick Day': return 'bg-gradient-to-r from-green-400 to-green-500 shadow-md shadow-green-500/20';
        case 'Personal (Unpaid)': return 'bg-gradient-to-r from-purple-400 to-purple-500 shadow-md shadow-purple-500/20';
        default: return 'bg-gradient-to-r from-gray-400 to-gray-500 shadow-md shadow-gray-500/20';
    }
  }

  return (
    <div className="bg-white p-6 rounded-b-lg shadow-sm border border-gray-200 border-t-0">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">{getMonthName(currentMonth)} {currentYear}</h2>
        <div className="flex gap-2">
          <button onClick={goToPreviousMonth} className="p-2 rounded-full hover:bg-gray-100"><ChevronLeft size={20} /></button>
          <button onClick={goToNextMonth} className="p-2 rounded-full hover:bg-gray-100"><ChevronRight size={20} /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200">
        {weekDays.map(day => (
          <div key={day} className="text-center font-semibold text-sm py-2 bg-gray-50 text-gray-600">{day}</div>
        ))}
        {calendarGrid.map(cell => (
          // --- NEW: Conditional styling for weekends ---
          <div key={cell.key} className={`h-28 p-1 overflow-y-auto ${cell.isWeekend ? 'bg-gray-50' : 'bg-white'}`}>
            {cell.day && <span className="text-xs font-semibold text-gray-700">{cell.day}</span>}
            <div className="mt-1 space-y-1">
                {/* --- NEW: Displaying holiday names --- */}
                {cell.isHoliday && (
                    <div className="p-1.5 bg-red-100 text-red-700 text-xs rounded-lg truncate font-semibold">
                        {cell.holidayName}
                    </div>
                )}
                {cell.events?.map(event => (
                    <div key={event.id} className={`p-1.5 text-white text-xs rounded-lg truncate ${getEventTypeStyle(event.leaveType)}`}>
                        {event.employeeName}
                    </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TeamCalendar;
