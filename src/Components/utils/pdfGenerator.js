import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// Helper to return only non-empty values
const safeField = (value) => {
  if (!value || value.toString().trim() === "") return null;
  return value;
};

export const generateQuotationPDF = (quotation) => {
  const doc = new jsPDF();
  const margin = 15;

  // === HEADER ===
  doc.setFontSize(18).setFont("helvetica", "bold");
  doc.text(
    safeField(quotation?.company_details?.company_name || quotation?.cCompany_name) || "Company Name",
    margin,
    20
  );

  doc.setFontSize(16).setFont("helvetica", "bold");
  doc.setTextColor(255, 165, 0);
  doc.text("QUOTATION", 195 - margin, 20, { align: "right" });
  doc.setTextColor(0);

  // === COMPANY DETAILS (Left) ===
  let yPos = 30;
  const companyDetails = [
    safeField(quotation?.cCompany_address),
    safeField(quotation?.company_details?.company_address2),
    safeField(quotation?.company_details?.company_address3),
    safeField(quotation?.company_phone) ? `Phone: ${quotation.company_phone}` : null,
    safeField(quotation?.company_details?.company_email) ? `Email: ${quotation.company_details.company_email}` : null,
    safeField(quotation?.company_details?.company_website || quotation?.cWebsite_det)
      ? `Website: ${quotation.company_details?.company_website || quotation.cWebsite_det}` : null,
    safeField(quotation?.cGst_no) ? `GST: ${quotation.cGst_no}` : null,
    safeField(quotation?.company_cin_no) ? `CIN: ${quotation.company_cin_no}` : null,
  ].filter(Boolean);

  doc.setFontSize(10).setFont("helvetica", "normal");
  companyDetails.forEach((line) => {
    doc.text(line, margin, yPos);
    yPos += 5;
  });

  // === QUOTATION DETAILS (Right Box) ===
  const quoteNumber = quotation?.cQuote_number || "QTN-000-000";
  const quoteDate = quotation?.dCreated_at ? new Date(quotation.dCreated_at).toLocaleDateString() : new Date().toLocaleDateString();
  const validUntil = quotation?.dValid_until ? new Date(quotation.dValid_until).toLocaleDateString() : "-";

  autoTable(doc, {
    startY: 30,
    margin: { left: 120 },
    theme: "grid",
    styles: { fontSize: 9, halign: "left" },
    body: [
      ["Quotation No:", quoteNumber],
      ["Date:", quoteDate],
      ["Valid Until:", validUntil],
    ],
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 40 },
      1: { halign: "right" },
    },
  });

  // === CLIENT DETAILS ===
  yPos = doc.lastAutoTable.finalY + 12;
  doc.setFillColor(220, 220, 220);
  doc.rect(margin, yPos - 6, 180, 8, "F");
  doc.setFontSize(11).setFont("helvetica", "bold");
  doc.text("CLIENT DETAILS", margin + 2, yPos - 1);

  yPos += 6;
  doc.setFontSize(10).setFont("helvetica", "normal");
  const clientBlock = [
    safeField(quotation?.clead_name) ? `Name: ${quotation.clead_name}` : null,
    safeField(quotation?.lead_organization || quotation?.cOrganization)
      ? `Company: ${quotation.lead_organization || quotation.cOrganization}` : null,
    [quotation?.clead_address1, quotation?.clead_address2, quotation?.clead_address3, quotation?.cpincode]
      .filter(Boolean).length > 0
      ? `Address: ${[quotation.clead_address1, quotation.clead_address2, quotation.clead_address3, quotation.cpincode].filter(Boolean).join(", ")}` : null,
    safeField(quotation?.iphone_no) ? `Phone: ${quotation.iphone_no}` : null,
    safeField(quotation?.whatsapp_number) ? `WhatsApp: ${quotation.whatsapp_number}` : null,
    safeField(quotation?.cemail) ? `Email: ${quotation.cemail}` : null,
    safeField(quotation?.cwebsite) ? `Website: ${quotation.cwebsite}` : null,
    safeField(quotation?.cGst) ? `GST: ${quotation.cGst}` : null,
  ].filter(Boolean);

  clientBlock.forEach((line) => {
    doc.text(line, margin, yPos);
    yPos += 6;
  });

  // === SERVICES TABLE ===
  yPos += 5;
  autoTable(doc, {
    startY: yPos,
    head: [["SERVICE", "DESCRIPTION", "QTY", "PRICE", "DISCOUNT", "TAX", "TOTAL"]],
    body: (quotation.services || []).map((s) => [
      s.cService_name || "Service",
      s.cDescription || "-",
      s.iQuantity?.toString() || "1",
      s.fPrice ? s.fPrice.toFixed(2) : "-",
      s.fDiscount > 0 ? `${s.fDiscount}%` : "-",
      s.fTax > 0 ? s.fTax.toFixed(2) : "-",
      s.fTotal_price ? s.fTotal_price.toFixed(2) : "-",
    ]),
    theme: "grid",
    headStyles: { fillColor: [255, 204, 0], textColor: 0 },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 45 },
      2: { halign: "center", cellWidth: 15 },
      3: { halign: "right", cellWidth: 20 },
      4: { halign: "right", cellWidth: 20 },
      5: { halign: "right", cellWidth: 20 },
      6: { halign: "right", cellWidth: 25 },
    },
  });

  // === TOTALS SECTION ===
  let totalsY = doc.lastAutoTable.finalY + 10;
  const totals = [
    ["Sub Total", quotation.fSubtotal?.toFixed(2) || "0.00"],
    quotation.fDiscount > 0 ? [`Discount (${quotation.fDiscount}%)`, `-${((quotation.fSubtotal * quotation.fDiscount) / 100).toFixed(2)}`] : null,
    ["Total Tax", ((quotation.services || []).reduce((sum, s) => sum + (s.fTax || 0), 0)).toFixed(2)],
    ["Total Amount", quotation.fTotal_amount?.toFixed(2) || "0.00"],
  ].filter(Boolean);

  autoTable(doc, {
    startY: totalsY,
    margin: { left: 120 },
    theme: "plain",
    body: totals,
    styles: { fontSize: 10, halign: "right" },
    columnStyles: { 0: { fontStyle: "bold" }, 1: { halign: "right" } },
  });

  // === TERMS & CONDITIONS ===
  totalsY = doc.lastAutoTable.finalY + 15;
  if (quotation.terms_conditions?.length > 0) {
    doc.setFontSize(11).setFont("helvetica", "bold");
    doc.text("Terms & Conditions:", margin, totalsY);
    totalsY += 6;

    doc.setFont("helvetica", "normal").setFontSize(9);
    quotation.terms_conditions.forEach((term) => {
      const lines = doc.splitTextToSize(`• ${term}`, 180);
      lines.forEach((line) => {
        doc.text(line, margin, totalsY);
        totalsY += 5;
      });
    });
  }

  // === FOOTER ===
  doc.setFontSize(11).setFont("helvetica", "bold");
  doc.text("Authorised Signature", 160, 280);

  doc.setFontSize(9).setFont("helvetica", "normal");
  doc.text(
    `Done by: ${quotation?.company_details?.owner_name || "Lead Owner / Business Name"}`,
    margin,
    280
  );

  doc.setFontSize(10).setTextColor(100);
  doc.text("Thanks for your business! Please visit us again.", 105, 290, { align: "center" });

  // Save PDF
  doc.save(`Quotation-${quoteNumber}.pdf`);
};
