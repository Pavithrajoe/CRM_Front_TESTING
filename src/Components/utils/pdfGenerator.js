import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// ✅ Clean currency formatter (no weird prefix like ¹)
const formatCurrency = (amount, currencyData) => {
  if (!currencyData) return amount.toFixed(2);
  try {
    const formatter = new Intl.NumberFormat(currencyData.locale || "en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return formatter.format(amount);
  } catch (error) {
    console.error("Currency formatting error:", error);
    return amount.toFixed(2);
  }
};

// Currency converter
const convertCurrency = (amount, fromCurrency, toCurrency, currencyRates) => {
  if (fromCurrency === toCurrency) return amount;
  if (
    !currencyRates ||
    !currencyRates[fromCurrency] ||
    !currencyRates[toCurrency]
  ) {
    return amount;
  }
  const baseAmount =
    fromCurrency === "INR" ? amount : amount / currencyRates[fromCurrency].rate;
  return toCurrency === "INR"
    ? baseAmount
    : baseAmount * currencyRates[toCurrency].rate;
};

// Placeholder logo generator
const generatePlaceholderLogo = (companyName) => {
  const initials = companyName
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 3);

  const canvas = document.createElement("canvas");
  canvas.width = 200;
  canvas.height = 200;
  const ctx = canvas.getContext("2d");

  ctx.beginPath();
  ctx.arc(100, 100, 95, 0, 2 * Math.PI);
  ctx.fillStyle = "#ffffff";
  ctx.fill();

  ctx.fillStyle = "#294773";
  ctx.font = "bold 80px Helvetica";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(initials, 100, 110);

  ctx.strokeStyle = "#294773";
  ctx.lineWidth = 5;
  ctx.stroke();

  return canvas.toDataURL("image/png");
};

// Section header helper
const addSectionHeader = (doc, text, y, primaryColor, margin) => {
  doc.setFillColor(...primaryColor);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.rect(margin - 2, y - 6, 180, 8, "F");
  doc.text(text, margin, y);
  doc.setTextColor(0, 0, 0);
  return y + 8;
};

export const generateQuotationPDF = (
  quotation,
  companyInfo,
  leadData,
  currencyRates
) => {
  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.height;

  const baseCurrency = quotation?.currency_code || "INR";
  const displayCurrency = quotation?.display_currency || baseCurrency;
  const currencyData = currencyRates?.[displayCurrency] || {
    code: "INR",
    symbol: "₹",
    locale: "en-IN",
  };

  // Company info
  const companyName =
    quotation?.company_details?.company_name ||
    companyInfo?.company_name ||
    "COMPANY NAME";

  let companyLogo =
    quotation?.company_details?.company_logo || companyInfo?.company_logo || "";
  if (!companyLogo || companyLogo.includes("logo-placeholder")) {
    companyLogo = generatePlaceholderLogo(companyName);
  }

  const companyDetails = quotation?.company_details || companyInfo || {};
  const companyEmail = companyDetails.company_email || "";
  const companyPhone = companyDetails.company_phone || "";
  const companyAddress =
    [
      companyDetails.company_address,
      companyDetails.company_address2,
      companyDetails.company_address3,
    ]
      .filter(Boolean)
      .join(", ") || "";
  const companyGstNo = companyDetails.company_gst_no || "";
  // ✅ Expanded fallback for CIN
  const companyCinNo =
    companyDetails.company_cin_no ||
    companyDetails.cin_no ||
    companyDetails.CIN ||
    companyInfo?.company_cin_no ||
    companyInfo?.cin_no ||
    companyInfo?.CIN ||
    "";
  const website = companyDetails.company_website || "-";

  const presentedBy =
    quotation?.created_by_user_name || companyInfo?.cFull_name || "Sales Rep";

  // Client info
  const leadName =
    quotation?.lead_name ||
    `${leadData?.cFirstName || ""} ${leadData?.cLastName || ""}`.trim() ||
    "Client Name";
  const leadCompany =
    quotation?.lead_organization || leadData?.cCompany || "Company Name";
  const leadAddress =
    quotation?.lead_address || leadData?.cAddress || "Client Address";
  const leadPhone = quotation?.lead_phone || leadData?.cPhone || "Phone Number";
  const leadWebsite = quotation?.lead_website || leadData?.cWebsite || "-";

  // Date formatter
  const formatDate = (dateInput) => {
    if (!dateInput) return "N/A";
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return "Invalid Date";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
  };

  const quoteNumber =
    quotation?.cQuote_number || quotation?.quote_number || "QTN-000-000000-000";
  const quoteDate = quotation?.dCreated_date
    ? formatDate(quotation.dCreated_date)
    : formatDate(new Date());
  const validUntil = quotation?.dValid_until
    ? formatDate(quotation.dValid_until)
    : formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
  const terms =
    quotation?.cTerms || quotation?.terms || "Standard payment terms apply.";

  const margin = 15;
  let yPos = margin;
  const primaryColor = [41, 71, 115];
  const lightBgColor = [248, 249, 250];

  // ===== HEADER =====
  if (companyLogo) {
    try {
      doc.addImage(companyLogo, "PNG", margin, 15, 30, 30);
    } catch (error) {
      console.error("Error adding logo:", error);
    }
  }

  doc
    .setFontSize(18)
    .setFont("helvetica", "bold")
    .setTextColor(...primaryColor);
  doc.text(companyName.toUpperCase(), 105, 22, { align: "center" });

  doc.setFontSize(9).setFont("helvetica", "normal").setTextColor(100, 100, 100);
  let headerY = 40;
  if (companyAddress) {
    const addrLines = doc.splitTextToSize(companyAddress, 180);
    addrLines.forEach((line) => {
      doc.text(line, margin, headerY);
      headerY += 5;
    });
  }
  if (companyPhone) {
    doc.text(`Phone: ${companyPhone}`, margin, headerY);
    headerY += 5;
  }
  if (companyEmail) {
    doc.text(`Email: ${companyEmail}`, margin, headerY);
    headerY += 5;
  }
  if (website && website !== "-") {
    doc.text(`Website: ${website}`, margin, headerY);
    headerY += 5;
  }
  if (companyGstNo) {
    doc.text(`GST: ${companyGstNo}`, margin, headerY);
    headerY += 5;
  }
  if (companyCinNo) {
    doc.text(`CIN: ${companyCinNo}`, margin, headerY);
    headerY += 5;
  }

  // Quotation details box
  const qBoxX = 200 - margin - 80;
  const qBoxY = 35;
  doc.setFillColor(...lightBgColor);
  doc.roundedRect(qBoxX, qBoxY, 80, 35, 2, 2, "F");
  doc
    .setFontSize(14)
    .setFont("helvetica", "bold")
    .setTextColor(...primaryColor);
  doc.text("QUOTATION", qBoxX + 40, qBoxY + 10, { align: "center" });
  doc.setFontSize(9).setFont("helvetica", "normal").setTextColor(0, 0, 0);
  doc.text(`No: ${quoteNumber}`, qBoxX + 5, qBoxY + 18);
  doc.text(`Date: ${quoteDate}`, qBoxX + 5, qBoxY + 23);
  doc.text(`Valid Until: ${validUntil}`, qBoxX + 5, qBoxY + 28);
  doc.text(`Currency: ${displayCurrency}`, qBoxX + 5, qBoxY + 33);

  yPos = Math.max(headerY, 70) + 10;

  // ===== CLIENT DETAILS =====
  yPos = addSectionHeader(doc, "CLIENT DETAILS", yPos, primaryColor, margin);
  yPos += 4;
  doc.setFontSize(10).setFont("helvetica", "normal").setTextColor(0, 0, 0);
  doc.setFillColor(...lightBgColor);
  doc.rect(margin, yPos - 4, 180, 35, "F");
  doc.text(`Name: ${leadName}`, margin + 5, yPos);
  yPos += 7;
  doc.text(`Company: ${leadCompany}`, margin + 5, yPos);
  yPos += 7;
  doc.text(`Address: ${leadAddress}`, margin + 5, yPos);
  yPos += 7;
  doc.text(`Phone: ${leadPhone}`, margin + 5, yPos);
  yPos += 7;
  doc.text(`Website: ${leadWebsite}`, margin + 5, yPos);
  yPos += 12;

  // ===== SERVICES =====
  yPos = addSectionHeader(
    doc,
    "SERVICE DESCRIPTION",
    yPos,
    primaryColor,
    margin
  );
  yPos += 4;
  const headers = [
    [
      "Service",
      "Duration",
      "Units/Month",
      "Total Units",
      "Unit Price",
      "Total",
    ],
  ];
  const tableData = [];
  const services =
    quotation?.services_summary ||
    quotation?.services ||
    quotation?.items ||
    [];
  if (services.length > 0) {
    services.forEach((service) => {
      const unitPrice =
        parseFloat(service.price || service.unit_price || service.rate || 0) ||
        0;
      const quantity = parseFloat(service.quantity || service.qty || 1) || 1;
      const totalUnits = service.total_units || quantity;
      const duration = service.duration || service.period || "-";
      const unitsPerMonth = service.units_per_month || "-";
      const serviceName = service.name || service.description || "Service";
      const convertedUnitPrice = convertCurrency(
        unitPrice,
        baseCurrency,
        displayCurrency,
        currencyRates
      );
      const total = convertedUnitPrice * totalUnits;
      tableData.push([
        serviceName,
        duration,
        unitsPerMonth.toString(),
        totalUnits.toString(),
        formatCurrency(convertedUnitPrice, currencyData),
        formatCurrency(total, currencyData),
      ]);
    });
  } else {
    tableData.push(["No services listed", "-", "-", "-", "-", "-"]);
  }
  autoTable(doc, {
    startY: yPos,
    head: headers,
    body: tableData,
    theme: "grid",
    styles: { fontSize: 9 },
    headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 25 },
      2: { cellWidth: 25 },
      3: { cellWidth: 25 },
      4: { cellWidth: 30 },
      5: { cellWidth: 30 },
    },
  });

  yPos = doc.lastAutoTable.finalY + 10;

  // ==== PAGE BREAK before totals ====
  if (yPos > pageHeight - 60) {
    doc.addPage();
    yPos = 20;
  }

  // ===== TOTALS =====
  const subTotalINR = services.reduce((sum, s) => {
    const u = parseFloat(s.price || s.unit_price || s.rate || 0) || 0;
    const q = parseFloat(s.quantity || s.qty || 1) || 1;
    const t = s.total_units || q;
    return sum + u * t;
  }, 0);
  const cgstPercent = parseFloat(quotation?.fCgst_percent || 9);
  const sgstPercent = parseFloat(quotation?.fSgst_percent || 9);
  const cgstAmountINR = subTotalINR * (cgstPercent / 100);
  const sgstAmountINR = subTotalINR * (sgstPercent / 100);
  const totalAmountINR = subTotalINR + cgstAmountINR + sgstAmountINR;
  const subTotal = convertCurrency(
    subTotalINR,
    baseCurrency,
    displayCurrency,
    currencyRates
  );
  const cgstAmount = convertCurrency(
    cgstAmountINR,
    baseCurrency,
    displayCurrency,
    currencyRates
  );
  const sgstAmount = convertCurrency(
    sgstAmountINR,
    baseCurrency,
    displayCurrency,
    currencyRates
  );
  const totalAmount = convertCurrency(
    totalAmountINR,
    baseCurrency,
    displayCurrency,
    currencyRates
  );

  doc.setFontSize(10).setFont("helvetica", "normal").setTextColor(0, 0, 0);
  let tx = 200 - margin - 80;
  doc.text("Sub Total:", tx, yPos);
  doc.text(formatCurrency(subTotal, currencyData), tx + 70, yPos, {
    align: "right",
  });
  yPos += 6;
  doc.text(`CGST ${cgstPercent}%:`, tx, yPos);
  doc.text(formatCurrency(cgstAmount, currencyData), tx + 70, yPos, {
    align: "right",
  });
  yPos += 6;
  doc.text(`SGST ${sgstPercent}%:`, tx, yPos);
  doc.text(formatCurrency(sgstAmount, currencyData), tx + 70, yPos, {
    align: "right",
  });
  yPos += 6;
  doc.setFont("helvetica", "bold").setTextColor(...primaryColor);
  doc.text("Total Amount:", tx, yPos);
  doc.text(formatCurrency(totalAmount, currencyData), tx + 70, yPos, {
    align: "right",
  });

  yPos += 15;

  // ==== PAGE BREAK before terms ====
  if (yPos > pageHeight - 60) {
    doc.addPage();
    yPos = 20;
  }

  // ===== TERMS =====
  yPos = addSectionHeader(
    doc,
    "TERMS & CONDITIONS",
    yPos,
    primaryColor,
    margin
  );
  yPos += 4;
  const termsLines = doc.splitTextToSize(terms, 180);
  doc.setFont("helvetica", "normal").setTextColor(0, 0, 0);
  termsLines.forEach((line) => {
    doc.text(line, margin + 5, yPos);
    yPos += 5;
  });
  yPos += 10;

  // ==== PAGE BREAK before final total ====
  if (yPos > pageHeight - 40) {
    doc.addPage();
    yPos = 20;
  }

  // ===== FINAL TOTAL =====
  doc.setFillColor(...primaryColor);
  doc.rect(margin, yPos, 180, 10, "F");
  doc.setFontSize(12).setFont("helvetica", "bold").setTextColor(255, 255, 255);
  doc.text("TOTAL AMOUNT PAYABLE:", margin + 5, yPos + 7);
  doc.text(
    formatCurrency(totalAmount, currencyData),
    200 - margin - 5,
    yPos + 7,
    { align: "right" }
  );

  yPos += 20;
  doc
    .setFontSize(10)
    .setFont("helvetica", "italic")
    .setTextColor(100, 100, 100);
  doc.text(`Presented by: ${presentedBy}`, margin, yPos);
  yPos += 7;
  doc
    .setFontSize(11)
    .setFont("helvetica", "bold")
    .setTextColor(...primaryColor);
  doc.text("Thank You For Your Business!", 105, yPos, { align: "center" });

  // ===== FOOTER (always at bottom) =====
  doc.setFontSize(8).setTextColor(100, 100, 100);
  doc.text(
    `Quotation: ${quoteNumber} | Valid Until: ${validUntil} | Date: ${quoteDate} | Currency: ${displayCurrency}`,
    105,
    pageHeight - 10,
    { align: "center" }
  );

  doc.save(`Quotation-${quoteNumber}.pdf`);
};
