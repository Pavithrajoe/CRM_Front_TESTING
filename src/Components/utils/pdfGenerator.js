import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { ENDPOINTS } from "../../api/constraints";

// Helper to return only non-empty values
const safeField = (value) => {
  if (!value || value.toString().trim() === "") return null;
  return value;
};

export const generateQuotationPDF = async (quotation, returnDataUrl = false) => {
  const leadId = quotation.iLead_id;
  console.log("lead ID", leadId);

  try {
    // Fetch quotation data from API
    const response = await fetch(
<<<<<<< HEAD
      `${ENDPOINTS.QUOTATION_LEAD}/${leadId}`,
=======
      `http://192.168.29.236:3000/api/quotation/lead/${leadId}`,
>>>>>>> a769a43a3f7a6dac5e04a1ee7b914622963100ae
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    );

    if (!response.ok) throw new Error("Failed to fetch quotation data");

    const result = await response.json();

    if (!result.data || result.data.length === 0)
      throw new Error("No quotation data found");

    // Use the first quotation record
    const q = result.data[0];
    console.log("q data", q)

    const doc = new jsPDF();
    const margin = 15;

    // === COMPANY HEADER ===
    const companyName =
      quotation?.company_details?.company_name ||
      quotation?.cCompany_name ||
      "Company Name";

    doc.setFontSize(18).setFont("helvetica", "bold");
    doc.text(companyName, margin, 20);

    doc.setFontSize(16).setFont("helvetica", "bold");
    doc.setTextColor(255, 165, 0);
    doc.text("QUOTATION", 195 - margin, 20, { align: "right" });
    doc.setTextColor(0);

    // === COMPANY DETAILS (Left) ===
    let yPos = 30;
    const companyDetails = [
      safeField(quotation.cCompany_address),
      safeField(quotation.company_details?.company_address2),
      safeField(quotation.company_details?.company_address3),
      safeField(quotation.company_phone) && `Phone: ${quotation.company_phone}`,
      safeField(quotation.company_details?.company_email) &&
        `Email: ${quotation.company_details.company_email}`,
      safeField(
        quotation.company_details?.company_website || quotation.cWebsite_det
      ) &&
        `Website: ${
          quotation.company_details?.company_website || quotation.cWebsite_det
        }`,
      safeField(quotation.cGst_no) && `GST: ${quotation.cGst_no}`,
      safeField(quotation.company_details?.company_cin_no) &&
        `CIN: ${quotation.company_details.company_cin_no}`,
    ].filter(Boolean);

    doc.setFontSize(10).setFont("helvetica", "normal");
    companyDetails.forEach((line) => {
      doc.text(line, margin, yPos);
      yPos += 5;
    });

    // === QUOTATION DETAILS (Right Box) ===
    const quoteNumber = q.cQuote_number || "QTN-000-000";
    const quoteDate = quotation.dCreated_at
      ? new Date(quotation.dCreated_at).toLocaleDateString()
      : new Date().toLocaleDateString();
    const validUntil = quotation.dValid_until
      ? new Date(quotation.dValid_until).toLocaleDateString()
      : "-";

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
      safeField(quotation.lead_name) && `Name: ${quotation.lead_name}`,
      safeField(quotation.lead_organization || quotation.cOrganization_name) &&
        `Company: ${quotation.lead_organization || quotation.cOrganization_name}`,
      [quotation.clead_address1, quotation.clead_address2, quotation.clead_address3, quotation.cpincode]
        .filter(Boolean).length > 0
        ? `Address: ${[quotation.clead_address1, quotation.clead_address2, quotation.clead_address3, quotation.cpincode].filter(Boolean).join(", ")}`
        : null,
      safeField(quotation.iphone_num) && `Phone: ${quotation.iphone_num}`,
      safeField(quotation.whatsapp_number) &&
        `WhatsApp: ${quotation.whatsapp_number}`,
      safeField(quotation.cemail) && `Email: ${quotation.cemail}`,
      safeField(quotation.cwebsite) && `Website: ${quotation.cwebsite}`,
      safeField(quotation.cGst) && `GST: ${quotation.cGst}`,
    ].filter(Boolean);

    clientBlock.forEach((line) => {
      doc.text(line, margin, yPos);
      yPos += 6;
    });

    // === SERVICES TABLE ===
    yPos += 5;

    autoTable(doc, {
      startY: yPos,
      head: [["SERVICE", "QTY", "PRICE", "DISCOUNT", "TAX", "TOTAL"]],
      body: quotation.services.map((s) => [
        s.cService_name,
        // s.cDescription || "-",
        s.iQuantity?.toString() || "1",
        `₹${s.fPrice}`,
        s.fDiscount ? `${s.fDiscount}%` : "-",
        s.fTax ? `₹${s.fTax}` : "-",
        `₹${s.fTotal_price}`,
      ]),
      theme: "grid",
      headStyles: { fillColor: [255, 204, 0], textColor: 0 },
      styles: { fontSize: 8, cellPadding: 2 },
    });

   // === TOTALS ===
let totalsY = doc.lastAutoTable.finalY + 10;

const totals = [
  ["Sub Total", q.formattedSubtotal || "₹0"],
  q.fDiscount && q.fDiscount > 0
    ? [`Discount (${q.fDiscount}%)`, q.formattedDiscount || `-₹${q.fDiscount}`]
    : null,
  ["Total Tax", q.formattedTaxAmount || "₹0"],
  ["Total Amount", q.formattedTotalAmount || "₹0"],
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
    let termsList = [];

    if (quotation.terms_conditions?.length > 0) {
      termsList = quotation.terms_conditions;
    } else if (quotation.cTerms) {
      termsList = quotation.cTerms.split("\n").filter((t) => t.trim() !== "");
    }

    if (termsList.length > 0) {
      doc.setFontSize(11).setFont("helvetica", "bold");
      doc.text("Terms & Conditions:", margin, totalsY);
      totalsY += 6;

      doc.setFont("helvetica", "normal").setFontSize(9);
      termsList.forEach((term) => {
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
    doc.text(`Done by: ${quotation.created_by_user_name || "Lead Owner"}`, margin, 280);

    doc.setFontSize(10).setTextColor(100);
    doc.text("Thanks for your business! Please visit us again.", 105, 290, { align: "center" });

    // === RETURN ===
    if (returnDataUrl) {
      return doc.output("datauristring");
    } else {
      const fileName = quoteNumber ? `Quotation-${quoteNumber}.pdf` : "Quotation.pdf";
      doc.save(fileName);
    }
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw new Error(`Failed to generate PDF: ${error.message}`);
  }
};