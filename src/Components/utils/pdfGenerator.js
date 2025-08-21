import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export const generateQuotationPDF = (quotation, companyInfo, leadData) => {
  const doc = new jsPDF();
  console.log("Generating PDF with quotation data:", quotation);

  // Extract data from API response with proper fallbacks
  const companyName =
    quotation?.company_name || companyInfo?.company_name || "Company Name";
  const companyAddress =
    quotation?.company_address ||
    companyInfo?.company_address ||
    "198, 1st Floor, VKV Complex, Rammagar, Nehru Street, Gandhipuram, Coimbatore - 641009";
  const companyPhone = quotation?.company_phone || companyInfo?.company_phone;
  const companyGstNo =
    quotation?.company_gst_no || companyInfo?.company_gst_no || "";
  // const companyEmail =
  //   quotation?.company_email ||
  //   companyInfo?.company_email ||
  //   "info@bizbrandbooster.com";
  // const website =
  //   quotation?.company_website ||
  //   companyInfo?.website ||
  //   "www.bizbrandbooster.com";

  // Use the presenter from the API response or fallback
  const presentedBy =
    quotation?.created_by_user_name ||
    companyInfo?.cFull_name ||
    "Sales Representative";

  // Extract lead data from API response
  const leadName =
    quotation?.lead_name ||
    `${leadData?.cFirstName || ""} ${leadData?.cLastName || ""}`.trim() ||
    "Client Name";
  const leadCompany =
    quotation?.lead_organization ||
    leadData?.lead_organization ||
    "Company Name";
  const leadAddress =
    quotation?.lead_address || leadData?.lead_address || "Company Address";
  const leadPhone = quotation?.lead_phone || leadData?.cPhone || "Phone Number";
  const leadEmail = quotation?.lead_email || leadData?.cEmail || "Email";

  const quoteNumber = quotation?.cQuote_number || "QTN-000-000000-000";
  const quoteDate = quotation?.dCreated_date
    ? new Date(quotation.dCreated_date).toLocaleDateString()
    : new Date().toLocaleDateString();
  const validUntil = quotation?.dValid_until
    ? new Date(quotation.dValid_until).toLocaleDateString()
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString();
  const terms = quotation?.cTerms || "Standard payment terms apply.";

  const margin = 15;
  let yPos = margin;

  // Company Header - Left aligned
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(companyName, margin, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  // Split address into multiple lines if needed
  const addressLines = doc.splitTextToSize(companyAddress, 80);
  addressLines.forEach((line) => {
    doc.text(line, margin, yPos);
    yPos += 5;
  });

  doc.text(`Mobile: ${companyPhone}`, margin, yPos);
  yPos += 5;
  // doc.text(`Email: ${companyEmail}`, margin, yPos);
  // yPos += 5;
  // doc.text(`Website: ${website}`, margin, yPos);
  // yPos += 5;

  if (companyGstNo) {
    doc.text(`GST: ${companyGstNo}`, margin, yPos);
    yPos += 5;
  }

  yPos += 5;

  // Quotation details table - Right aligned
  const quoteDetailsX = 140;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("QUOTATION", quoteDetailsX, margin);

  doc.setFont("helvetica", "normal");
  doc.text(`Quotation No: ${quoteNumber}`, quoteDetailsX, margin + 10);
  doc.text(`Date: ${quoteDate}`, quoteDetailsX, margin + 15);
  doc.text(`Valid Until: ${validUntil}`, quoteDetailsX, margin + 20);

  yPos = Math.max(yPos, margin + 25);

  // Horizontal line separator
  doc.line(margin, yPos, 200 - margin, yPos);
  yPos += 10;

  // Client Details Section
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("CLIENT DETAILS", margin, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Name: ${leadName}`, margin, yPos);
  yPos += 5;
  doc.text(`Company: ${leadCompany}`, margin, yPos);
  yPos += 5;
  doc.text(`Address: ${leadAddress}`, margin, yPos);
  yPos += 5;
  doc.text(`Phone: ${leadPhone}`, margin, yPos);
  yPos += 5;
  doc.text(`Email: ${leadEmail}`, margin, yPos);
  yPos += 15;

  // Service Description header
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("SERVICE DESCRIPTION", margin, yPos);
  yPos += 10;

  // Prepare table data from API response
  const headers = [["SERVICE", "QUANTITY", "UNIT PRICE", "TOTAL"]];
  const tableData = [];

  if (quotation.services_summary && quotation.services_summary.length > 0) {
    quotation.services_summary.forEach((service) => {
      tableData.push([
        service.name || "Service",
        "1", // Default quantity as it's not in the API response
        `₹${service.price || "0.00"}`,
        `₹${service.price || "0.00"}`,
      ]);
    });
  } else {
    // Fallback if no services in response
    tableData.push(["No services listed", "-", "-", "-"]);
  }

  // Create table with autoTable
  autoTable(doc, {
    startY: yPos,
    head: headers,
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: "bold",
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    margin: { left: margin, right: margin },
    tableWidth: "auto",
  });

  // Update position after table
  yPos = doc.lastAutoTable.finalY + 10;

  // Calculate totals
  const subTotal =
    quotation.fTotal_amount ||
    quotation.services_summary?.reduce(
      (sum, service) => sum + (parseFloat(service.price) || 0),
      0
    ) ||
    0;

  const cgstPercent = quotation.fCgst_percent || 9;
  const sgstPercent = quotation.fSgst_percent || 9;
  const cgstAmount = subTotal * (cgstPercent / 100);
  const sgstAmount = subTotal * (sgstPercent / 100);
  const totalAmount = subTotal + cgstAmount + sgstAmount;

  // Totals table
  const totalsX = 120;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  doc.text("Sub Total", totalsX, yPos);
  doc.text(`₹${subTotal.toFixed(2)}`, totalsX + 50, yPos);
  yPos += 6;

  doc.text("Net Amount", totalsX, yPos);
  doc.text(`₹${subTotal.toFixed(2)}`, totalsX + 50, yPos);
  yPos += 6;

  doc.text(`CGST ${cgstPercent}%`, totalsX, yPos);
  doc.text(`₹${cgstAmount.toFixed(2)}`, totalsX + 50, yPos);
  yPos += 6;

  doc.text(`SGST ${sgstPercent}%`, totalsX, yPos);
  doc.text(`₹${sgstAmount.toFixed(2)}`, totalsX + 50, yPos);
  yPos += 6;

  doc.text("Total Tax", totalsX, yPos);
  doc.text(`₹${(cgstAmount + sgstAmount).toFixed(2)}`, totalsX + 50, yPos);
  yPos += 6;

  doc.setFont("helvetica", "bold");
  doc.text("Total Amount", totalsX, yPos);
  doc.text(`₹${totalAmount.toFixed(2)}`, totalsX + 50, yPos);
  yPos += 15;

  // Project Includes
  if (quotation.cProject_includes) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Project Includes:", margin, yPos);
    yPos += 6;

    doc.setFont("helvetica", "normal");
    const includesLines = doc.splitTextToSize(quotation.cProject_includes, 180);
    includesLines.forEach((line) => {
      doc.text(line, margin, yPos);
      yPos += 5;
    });
    yPos += 5;
  }

  // Payment Terms
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Payment Terms:", margin, yPos);
  yPos += 6;

  doc.setFont("helvetica", "normal");
  const paymentTerms =
    quotation.cPayment_terms ||
    `100% Advance Payment (₹${subTotal.toFixed(2)} + ₹${(
      cgstAmount + sgstAmount
    ).toFixed(2)} GST = ₹${totalAmount.toFixed(2)})`;
  const paymentLines = doc.splitTextToSize(paymentTerms, 180);
  paymentLines.forEach((line) => {
    doc.text(line, margin, yPos);
    yPos += 5;
  });
  yPos += 10;

  // Terms & Conditions
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Terms & Conditions:", margin, yPos);
  yPos += 6;

  doc.setFont("helvetica", "normal");
  const termsLines = doc.splitTextToSize(terms, 180);
  termsLines.forEach((line) => {
    doc.text(line, margin, yPos);
    yPos += 5;
  });

  // Footer - Presented by and Thank you message
  yPos = 270;
  doc.setFontSize(10);
  doc.setFont("helvetica", "italic");
  doc.text(`Presented by: ${presentedBy}`, margin, yPos);
  yPos += 7;

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Thank You For Your Business!", 105, yPos, { align: "center" });

  // Page number and date
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(
    `Quotation: ${quoteNumber} | Valid Until: ${validUntil} | Date: ${quoteDate}`,
    105,
    285,
    {
      align: "center",
    }
  );

  // Save PDF with quote number
  doc.save(`Quotation-${quoteNumber}.pdf`);
};
