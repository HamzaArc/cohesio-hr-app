/**
 * Calculates the total accrued vacation days for an employee based on their hire date.
 * Employees accrue 1.5 days of vacation for each full month of employment.
 *
 * @param {string} hireDate - The employee's hire date in 'YYYY-MM-DD' format.
 * @returns {number} The total number of accrued vacation days.
 */
function calculateAccruedVacation(hireDate) {
  if (!hireDate) return 0;

  const startDate = new Date(hireDate);
  const today = new Date();
  let totalAccrued = 0;

  // Start from the month after the hire month
  let currentDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 1);

  while (currentDate <= today) {
    totalAccrued += 1.5;
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  return totalAccrued;
}

/**
 * Calculates the number of earned vacation days that have expired.
 * Vacation days expire if they were earned more than two years ago and have not been used.
 *
 * @param {string} hireDate - The employee's hire date in 'YYYY-MM-DD' format.
 * @param {Array<Object>} timeOffRequests - A list of the employee's approved time-off requests.
 * @returns {number} The number of expired vacation days.
 */
function calculateExpiredDays(hireDate, timeOffRequests) {
  if (!hireDate) return 0;

  const startDate = new Date(hireDate);
  const today = new Date();
  const twoYearsAgo = new Date(today.getFullYear() - 2, today.getMonth(), today.getDate());

  let expiredDays = 0;
  let usedDays = timeOffRequests.reduce((acc, request) => acc + request.totalDays, 0);

  let currentDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 1);

  while (currentDate < twoYearsAgo) {
    if (usedDays >= 1.5) {
      usedDays -= 1.5;
    } else {
      expiredDays += 1.5 - usedDays;
      usedDays = 0;
    }
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  return expiredDays;
}

/**
 * Calculates the current vacation balance for an employee, taking into account accruals,
 * used days, and expired days.
 *
 * @param {Object} employee - The employee object, containing at least `hireDate` and `initialVacationBalance`.
 * @param {Array<Object>} timeOffRequests - A list of the employee's approved time-off requests.
 * @returns {number} The current vacation balance.
 */
export function calculateVacationBalance(employee, timeOffRequests) {
  if (!employee || !employee.hireDate) return 0;

  const totalAccrued = calculateAccruedVacation(employee.hireDate);
  const totalUsed = timeOffRequests.reduce((acc, request) => acc + request.totalDays, 0);
  const expiredDays = calculateExpiredDays(employee.hireDate, timeOffRequests);

  // The current balance is the initial balance plus accrued days, minus used and expired days.
  const currentBalance = (employee.initialVacationBalance || 0) + totalAccrued - totalUsed - expiredDays;

  return Math.max(0, currentBalance); // Ensure balance doesn't go below zero
}