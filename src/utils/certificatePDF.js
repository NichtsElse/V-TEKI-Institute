import jsPDF from 'jspdf';
import { format } from 'date-fns';
import QRCode from 'qrcode';

/**
 * Generates a certificate PDF for V-TEKI CoE.
 * Style: Clean white background with dark navy/slate frame and cyan accents.
 * Layout: Based on the previous structured layout (Logo top-left box, 3 info boxes).
 */
export async function generateCertificatePDF(cert) {
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const W = 297;
  const H = 210;

  const colorNavy = [44, 62, 80]; // Dark slate/navy from Dicoding
  const colorCyan = [0, 180, 200]; // Cyan from Dicoding

  // ════════════════════════════════════════════════════════════════
  // BACKGROUND & FRAME
  // ════════════════════════════════════════════════════════════════
  // Outer frame - Dark Navy
  pdf.setFillColor(...colorNavy);
  pdf.rect(0, 0, W, H, 'F');

  // Inner card - White
  pdf.setFillColor(255, 255, 255);
  pdf.rect(10, 10, W - 20, H - 20, 'F');

  // Inner subtle border
  pdf.setDrawColor(...colorNavy);
  pdf.setLineWidth(0.4);
  pdf.rect(14, 14, W - 28, H - 28, 'S');

  // ════════════════════════════════════════════════════════════════
  // LOGO BOX — top left
  // ════════════════════════════════════════════════════════════════
  const logoBoxX = 20;
  const logoBoxY = 20;
  const logoBoxW = 52;
  const logoBoxH = 18;

  let logoEmbedded = false;
  try {
    const logoResponse = await fetch('/vteki-logo.png');
    if (logoResponse.ok) {
      const logoBlob = await logoResponse.blob();
      const logoBase64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(logoBlob);
      });

      // Load image to get actual dimensions and preserve aspect ratio
      const img = new Image();
      img.src = logoBase64;
      await new Promise(res => { img.onload = res; });

      const imgRatio = img.width / img.height;
      const boxRatio = logoBoxW / logoBoxH;

      let finalW = logoBoxW;
      let finalH = logoBoxH;

      if (imgRatio > boxRatio) {
        finalH = logoBoxW / imgRatio;
      } else {
        finalW = logoBoxH * imgRatio;
      }

      const finalX = logoBoxX + (logoBoxW - finalW) / 2;
      const finalY = logoBoxY + (logoBoxH - finalH) / 2;

      // Fit logo inside preserving original proportions
      pdf.addImage(logoBase64, 'PNG', finalX, finalY, finalW, finalH);
      logoEmbedded = true;
    }
  } catch { /* fallback */ }

  if (!logoEmbedded) {
    pdf.setTextColor(...colorNavy);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('V-TEKI', logoBoxX + logoBoxW / 2, logoBoxY + 8, { align: 'center' });
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.text('INSTITUTE', logoBoxX + logoBoxW / 2, logoBoxY + 14, { align: 'center' });
  }

  // ════════════════════════════════════════════════════════════════
  // TOP RIGHT — Certificate label
  // ════════════════════════════════════════════════════════════════
  pdf.setFillColor(...colorNavy);
  pdf.roundedRect(W - 85, 20, 65, 12, 2, 2, 'F');

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.text(cert.certificate_number || 'CERTIFICATE OF COMPLETION', W - 52.5, 27, { align: 'center' });

  // ════════════════════════════════════════════════════════════════
  // BODY
  // ════════════════════════════════════════════════════════════════

  // "Diberikan kepada" / "This is to certify that"
  pdf.setTextColor(100, 100, 100);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.text('This is to certify that', W / 2, 55, { align: 'center' });

  // Participant Name
  pdf.setTextColor(...colorCyan);
  pdf.setFontSize(28);
  pdf.setFont('helvetica', 'bold');
  pdf.text((cert.participant_name || '').toUpperCase(), W / 2, 70, { align: 'center' });

  // "Atas kelulusannya pada kelas" / "has successfully completed"
  pdf.setTextColor(100, 100, 100);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.text('has successfully completed the training program', W / 2, 85, { align: 'center' });

  // Program name
  const programLines = pdf.splitTextToSize(cert.program_name || '', W - 40);
  pdf.setTextColor(...colorCyan);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text(programLines, W / 2, 95, { align: 'center' });

  const afterProg = 95 + (programLines.length - 1) * 7;

  // ════════════════════════════════════════════════════════════════
  // META INFO BOXES (3 columns) - Centered Layout as requested
  // ════════════════════════════════════════════════════════════════
  const boxTop = afterProg + 15;
  const boxH = 22;
  const margin = 20;
  const gap = 10;
  const totalW = W - margin * 2 - gap * 2;
  const bW = totalW / 3;

  const boxes = [
    { label: 'BATCH', value: pdf.splitTextToSize(cert.batch_name || '-', bW - 8)[0] },
    {
      label: 'COMPLETION DATE',
      value: cert.completion_date ? format(new Date(cert.completion_date), 'dd MMMM yyyy') : '-',
    },
    { label: 'ASSESSMENT SCORE', value: cert.score != null ? `${cert.score}%` : '-' },
  ];

  boxes.forEach((box, i) => {
    const bx = margin + i * (bW + gap);

    // Box background white, border navy
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(bx, boxTop, bW, boxH, 2, 2, 'F');

    pdf.setDrawColor(...colorNavy);
    pdf.setLineWidth(0.4);
    pdf.roundedRect(bx, boxTop, bW, boxH, 2, 2, 'S');

    // Label
    pdf.setTextColor(...colorNavy);
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    pdf.text(box.label, bx + bW / 2, boxTop + 8, { align: 'center' });

    // Value
    pdf.setTextColor(...colorCyan);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text(box.value, bx + bW / 2, boxTop + 16, { align: 'center' });
  });

  // ════════════════════════════════════════════════════════════════
  // SIGNATURE SECTION
  // ════════════════════════════════════════════════════════════════
  const sigY = boxTop + boxH + 25;

  // Left: Trainer
  const s1X = 60;
  pdf.setDrawColor(...colorNavy);
  pdf.setLineWidth(0.5);
  pdf.line(s1X - 35, sigY, s1X + 35, sigY);
  pdf.setTextColor(...colorNavy);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text(cert.trainer_name || 'Lead Trainer', s1X, sigY + 6, { align: 'center' });
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 100, 100);
  pdf.text('Lead Trainer', s1X, sigY + 11, { align: 'center' });

  // Right: Director
  const s2X = W - 60;
  pdf.setDrawColor(...colorNavy);
  pdf.line(s2X - 35, sigY, s2X + 35, sigY);
  pdf.setTextColor(...colorNavy);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('V-TEKI Institute', s2X, sigY + 6, { align: 'center' });
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 100, 100);
  pdf.text('Program Director', s2X, sigY + 11, { align: 'center' });

  // ════════════════════════════════════════════════════════════════
  // FOOTER VERIFICATION
  // ════════════════════════════════════════════════════════════════
  pdf.setTextColor(150, 150, 150);
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'normal');
  pdf.text(
    `Verifikasi Sertifikat di vteki.institute/verify-certificate | Berlaku hingga ${format(new Date(new Date().setFullYear(new Date().getFullYear() + 3)), 'dd MMM yyyy')}`,
    W / 2,
    H - 15,
    { align: 'center' }
  );

  // ════════════════════════════════════════════════════════════════
  // QR CODE
  // ════════════════════════════════════════════════════════════════
  try {
    const verifyUrl = `https://vteki.institute/verify?id=${cert.certificate_number || 'demo'}`;
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      width: 100,
      margin: 1,
      color: {
        dark: '#2C3E50', // colorNavy
        light: '#FFFFFF'
      }
    });

    // Position QR Code at bottom center above verification text
    const qrSize = 18;
    const qrX = (W / 2) - (qrSize / 2);
    const qrY = H - 35;

    pdf.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
  } catch (err) {
    console.error('Failed to generate QR Code', err);
  }

  // ── Save ─────────────────────────────────────────────────────────
  const safeNum = (cert.certificate_number || 'certificate').replace(/[/\\]/g, '-');
  pdf.save(`certificate-${safeNum}.pdf`);
}
