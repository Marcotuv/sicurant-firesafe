import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { WorkSession, Intervention, Client } from '../types';
import { getLocalDate } from './dates';

export const generateInterventionReport = (session: WorkSession, client: Client, interventions: Intervention[]) => {
    const doc = new jsPDF();

    // --- HEADER ---
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text("SICURANT FireSafe", 14, 22);

    doc.setFontSize(10);
    doc.text("Via dell'Antincendio, 1 - 09100 Cagliari (CA)", 14, 28);
    doc.text("P.IVA: 01234567890 - Tel: 070 123456", 14, 33);
    doc.text("Email: info@sicurant.it", 14, 38);

    doc.setLineWidth(0.5);
    doc.line(14, 42, 196, 42);

    // --- INFO INTERVENTO ---
    doc.setFontSize(14);
    doc.text("RAPPORTO DI MANUTENZIONE", 14, 52);

    doc.setFontSize(10);
    doc.text(`Cliente: ${client.nome}`, 14, 60);
    doc.text(`Indirizzo: ${client.indirizzo}`, 14, 65);
    doc.text(`Data Intervento: ${session.startTimestamp ? getLocalDate(session.startTimestamp) : 'N/D'}`, 14, 70);
    doc.text(`Tecnico: ${session.assignedTechName || 'N/D'}`, 14, 75);
    doc.text(`Sessione ID: ${session.id}`, 130, 60);

    // --- TABELLA INTERVENTI ---
    const tableData = interventions.map(int => [
        int.assetName || int.assetId,
        int.services.join(', '),
        int.anomalies.length > 0 ? 'ANOMALIA' : 'OK',
        int.notes || '-'
    ]);

    autoTable(doc, {
        startY: 85,
        head: [['Presidio', 'Lavorazioni', 'Stato', 'Note']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [220, 53, 69] }, // Rosso Sicurant
    });

    // --- ANOMALIE ---
    let finalY = (doc as any).lastAutoTable.finalY + 10;

    const anomaliesWithAssets = interventions.filter(i => i.anomalies.length > 0);

    if (anomaliesWithAssets.length > 0) {
        doc.setFontSize(12);
        doc.setTextColor(220, 53, 69); // Rosso
        doc.text("ANOMALIE RISCONTRATE", 14, finalY);
        doc.setTextColor(0, 0, 0); // Reset nero
        doc.setFontSize(10);
        finalY += 7;

        anomaliesWithAssets.forEach(fat => {
            doc.setFont(undefined, 'bold');
            doc.text(`- ${fat.assetName} (${fat.assetId}):`, 14, finalY);
            doc.setFont(undefined, 'normal');
            doc.text(fat.anomalies.join(', '), 60, finalY);
            finalY += 6;
        });
    }

    // --- NOTE GENERALI ---
    if (session.generalNotes) {
        finalY += 10;
        doc.setFontSize(11);
        doc.text("Note Generali:", 14, finalY);
        doc.setFontSize(10);
        finalY += 6;
        const splitNotes = doc.splitTextToSize(session.generalNotes, 180);
        doc.text(splitNotes, 14, finalY);
        finalY += (splitNotes.length * 5);
    }

    // --- FIRME ---
    finalY += 20;

    // Controllo page break
    if (finalY > 250) {
        doc.addPage();
        finalY = 30;
    }

    doc.setLineWidth(0.1);

    // Firma Tecnico
    doc.text("Firma Tecnico", 30, finalY);
    if (session.technicianSignatureImage) {
        doc.addImage(session.technicianSignatureImage, 'PNG', 30, finalY + 5, 50, 25);
    }
    doc.line(30, finalY + 35, 80, finalY + 35);
    doc.text(session.technicianSignature || '', 30, finalY + 40);

    // Firma Cliente
    doc.text("Firma Cliente", 120, finalY);
    if (session.clientSignatureImage) {
        doc.addImage(session.clientSignatureImage, 'PNG', 120, finalY + 5, 50, 25);
    }
    doc.line(120, finalY + 35, 170, finalY + 35);
    doc.text(session.clientSignature || '', 120, finalY + 40);

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(`Pagina ${i} di ${pageCount} - Generato da Sicurant Mobile`, 200, 290, { align: 'right' });
    }

    // Save
    doc.save(`Verbale_${client.nome.replace(/\s+/g, '_')}_${getLocalDate(session.startTimestamp || new Date().toISOString())}.pdf`);
};
