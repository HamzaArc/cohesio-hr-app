// Helper to escape XML special characters
const escapeXml = (unsafe) => {
    if (unsafe === null || unsafe === undefined) return '';
    return String(unsafe).replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });
};

export const generateCnssXml = (payrollRun, employees, companyInfo) => {
    const year = payrollRun.period.substring(0, 4);
    const totalSalaries = Object.keys(payrollRun.employeeData).length;

    const salariesXml = Object.keys(payrollRun.employeeData).map(employeeId => {
        const employee = employees.find(e => e.id === employeeId);
        if (!employee) return ''; // Skip if employee profile not found

        const employeePayroll = payrollRun.employeeData[employeeId];
        const grossPay = (employeePayroll.baseSalary || 0) + (employeePayroll.bonuses || 0);
        const netPay = grossPay - (employeePayroll.cnss || 0) - (employeePayroll.amo || 0) - (employeePayroll.ir || 0) - (employeePayroll.otherDeductions || 0);
        
        const firstName = employee.name.split(' ')[0];
        const lastName = employee.name.split(' ').slice(1).join(' ');

        return `
    <salarie>
      <identifiant>${escapeXml(employee.nationalId)}</identifiant>
      <nom>${escapeXml(lastName)}</nom>
      <prenom>${escapeXml(firstName)}</prenom>
      <adresse>${escapeXml(employee.address)}</adresse>
      <cin>${escapeXml(employee.nationalId)}</cin>
      <cnss>${escapeXml(employee.cnssNumber)}</cnss>
      <dateNaissance>${escapeXml(employee.dateOfBirth)}</dateNaissance>
      <dateRecrutement>${escapeXml(employee.hireDate)}</dateRecrutement>
      <remunerationBrute>${grossPay.toFixed(2)}</remunerationBrute>
      <remunerationNette>${netPay.toFixed(2)}</remunerationNette>
      <nombreJours>30</nombreJours>
    </salarie>`;
    }).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<TdsSalaries xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="TdsSalaires.xsd">
  <entete>
    <idFiscal>${escapeXml(companyInfo?.idFiscal)}</idFiscal>
    <exercice>${year}</exercice>
    <totalBrut>${(payrollRun.totalGrossPay || 0).toFixed(2)}</totalBrut>
    <totalNet>${(payrollRun.totalNetPay || 0).toFixed(2)}</totalNet>
    <totalSalaries>${totalSalaries}</totalSalaries>
  </entete>
  <salaries>${salariesXml}
  </salaries>
</TdsSalaries>`;
};