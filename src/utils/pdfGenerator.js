import jsPDF from 'jspdf';
import 'jspdf-autotable';
// Note: You need to add a logo file at this path for it to appear in the PDF.
// If you don't have one, it's safe to leave this as is; no logo will be displayed.
import logo from '../assets/images/logo.png'; 

// A helper function to add a header to each document
const addDocumentHeader = (doc, companyInfo, title) => {
    try {
        // Add Logo if it exists
        if (logo) {
            doc.addImage(logo, 'PNG', 10, 15, 25, 25);
        }
    } catch (e) {
        console.warn("Logo not found or could not be added to PDF.");
    }
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(40);
  doc.text(companyInfo?.companyName || 'Company Name', 200, 20, { align: 'right' });
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(companyInfo?.companyAddress || 'Company Address', 200, 26, { align: 'right' });
  doc.text(`RC: ${companyInfo?.rcNumber || 'N/A'} | CNSS: ${companyInfo?.cnssNumber || 'N/A'}`, 200, 31, { align: 'right' });

  doc.setDrawColor(230, 230, 230);
  doc.line(15, 40, 200, 40);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(17, 24, 39); // Dark Gray
  doc.text(title, 105, 60, { align: 'center' });
};

// A helper function to add a footer
const addDocumentFooter = (doc) => {
    const pageCount = doc.internal.getNumberOfPages();
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(150);
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setDrawColor(230, 230, 230);
        doc.line(15, 280, 200, 280);
        doc.text(`Fait à Casablanca, le ${new Date().toLocaleDateString('fr-FR')}`, 15, 287);
        doc.text(`Signature & Cachet de l'entreprise`, 200, 287, { align: 'right' });
    }
};

const createStyledPDF = (employee, companyInfo, title, bodyText, fileName) => {
    const doc = new jsPDF();
    addDocumentHeader(doc, companyInfo, title);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(55, 65, 81); // Slate 600
    doc.text(bodyText, 20, 90, { maxWidth: 170, lineHeightFactor: 1.5 });
    
    addDocumentFooter(doc);
    doc.save(`${fileName}_${employee.name}.pdf`);
}

export const generateWorkCertificate = (employee, companyInfo) => {
  const body = `
Nous soussignés, la société ${companyInfo?.companyName || '__________________'}, certifions par la présente que M./Mme ${employee.name}, titulaire de la CIN n°${employee.nationalId || '__________________'}, est employé(e) au sein de notre entreprise depuis le ${employee.hireDate}.

M./Mme ${employee.name} occupe actuellement le poste de ${employee.position}.

Cette attestation est délivrée à l'intéressé(e) pour servir et valoir ce que de droit.
  `;
  createStyledPDF(employee, companyInfo, 'ATTESTATION DE TRAVAIL', body, 'Attestation_de_Travail');
};

export const generateSalaryCertificate = (employee, companyInfo) => {
    const body = `
Nous soussignés, la société ${companyInfo?.companyName || '__________________'}, certifions par la présente que M./Mme ${employee.name}, titulaire de la CIN n°${employee.nationalId || '__________________'}, est employé(e) au sein de notre entreprise en tant que ${employee.position}.

Son salaire mensuel brut s'élève à ${employee.monthlyGrossSalary || 'N/A'} MAD.

Cette attestation est délivrée à l'intéressé(e) pour servir et valoir ce que de droit.
  `;
  createStyledPDF(employee, companyInfo, 'ATTESTATION DE SALAIRE', body, 'Attestation_de_Salaire');
};

export const generateSalaryDomiciliationCertificate = (employee, companyInfo) => {
    const body = `
Nous soussignés, la société ${companyInfo?.companyName || '__________________'}, certifions par la présente que M./Mme ${employee.name}, titulaire de la CIN n°${employee.nationalId || '__________________'}, est employé(e) au sein de notre entreprise.

Nous nous engageons par la présente à verser de manière irrévocable le salaire mensuel de l'intéressé(e) au compte bancaire dont les coordonnées sont les suivantes :

Banque: ${employee.bankBranch || '__________________'}
RIB: ${employee.rib || '________________________'}

Cette attestation est délivrée à la demande de l'intéressé(e) pour servir et valoir ce que de droit.
  `;
  createStyledPDF(employee, companyInfo, 'ATTESTATION DE DOMICILIATION DE SALAIRE', body, 'Attestation_Domiciliation');
};