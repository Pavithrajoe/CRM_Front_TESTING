import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { ENDPOINTS } from "../../api/constraints";

// Helper to return only non-empty values
const safeField = (value) => {
  if (value === null || value === undefined) return null;
  const str = String(value).trim();
  return str === "" || str.toLowerCase() === "null" ? null : str;
};

// export const generateQuotationPDF = async (quotation, returnDataUrl = false) => {
  
export const generateQuotationPDF = async (quotation, companyInfo, leadData, returnDataUrl = false) => {
  const leadId = quotation.iLead_id;

  try {
    const response = await fetch(`${ENDPOINTS.QUOTATION_LEAD}/${leadId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });

    if (!response.ok) throw new Error("Failed to fetch quotation data");
    const result = await response.json();

    if (!result.data || result.data.length === 0)
      throw new Error("No quotation data found");

    const q = result.data[0];

    // ========================================================
    //     USE NOTOSANS FONT (supports ₹ fully — no errors)
    // ========================================================
    const doc = new jsPDF({
      putOnlyUsedFonts: true,
      font: "NotoSans"
    });
    doc.setFont("NotoSans", "normal");

    const margin = 15;

    // Currency symbol from backend EXACTLY as received
    const currencySymbol =
      q.currency_details?.currency_symbol || "₹";

    // =========================================
    //             COMPANY HEADER
    // =========================================

    const companyName =
      quotation?.company_details?.company_name ||
      quotation?.cCompany_name ||
      "Company Name";

    doc.setFontSize(18).setFont("NotoSans", "bold");
    doc.text(companyName, margin, 20);

    doc.setFontSize(16).setFont("NotoSans", "bold");
    doc.setTextColor(255, 165, 0);
    doc.text("QUOTATION", 195 - margin, 20, { align: "right" });
    doc.setTextColor(0);

    // =========================================
    //           COMPANY DETAILS LEFT
    // =========================================

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
      ) && `Website: ${
        quotation.company_details?.company_website || quotation.cWebsite_det
      }`,
      safeField(quotation.cGst_no) && `GST: ${quotation.cGst_no}`,
      safeField(quotation.company_details?.company_cin_no) &&
        `CIN: ${quotation.company_details.company_cin_no}`
    ].filter(Boolean);

    doc.setFontSize(10).setFont("NotoSans", "normal");
    companyDetails.forEach((line) => {
      doc.text(line, margin, yPos);
      yPos += 5;
    });

    // =========================================
    //      QUOTATION DETAILS (RIGHT SIDE)
    // =========================================

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
      styles: { fontSize: 10, font: "NotoSans", textColor: [0, 0, 0] },
      body: [
        ["Quotation No:", quoteNumber],
        ["Date:", quoteDate],
        ["Valid Until:", validUntil],
        ["Currency:", currencySymbol]
      ],
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 28 },
        1: { halign: "right" }
      }
    });

    // =========================================
    //         CLIENT DETAILS
    // =========================================
    
    // yPos calculation
    yPos = doc.lastAutoTable.finalY + 18; 
    
    // Draw the gray background rectangle for the header
    doc.setFillColor(220, 220, 220);
    doc.rect(margin, yPos - 6, 180, 8, "F");

    // Draw the bold header title
    doc.setFontSize(11).setFont("NotoSans", "bold");
    doc.text("CLIENT DETAILS", margin + 2, yPos - 1);

    yPos += 6;
    doc.setFontSize(10); // Set base font size

    //  Prepare data separating title and value
    const clientBlockData = [
      { title: "Name:", value: safeField(quotation.lead_name) },
      { title: "Company:", value: safeField(quotation.lead_organization || quotation.cOrganization_name) },
      { 
        title: "Address:", 
        value: ([quotation.clead_address1, quotation.clead_address2, quotation.clead_address3, quotation.cpincode]
          .filter(Boolean).length > 0) 
            ? [
                quotation.clead_address1,
                quotation.clead_address2,
                quotation.clead_address3,
                quotation.cpincode
              ]
              .filter(Boolean)
              .join(", ")
            : null
      },
      { title: "Phone:", value: safeField(quotation.iphone_num) },
      { title: "WhatsApp:", value: safeField(quotation.whatsapp_number) },
      { title: "Email:", value: safeField(quotation.cemail) },
      { title: "Website:", value: safeField(quotation.cwebsite) },
      { title: "GST:", value: safeField(quotation.cGst) }
    ].filter(item => item.value); // Filter out lines with no value

    // horizontal position of the vertical split line
    const titleWidth = 20; 
    const valueStartX = margin + titleWidth + 3; 

    //  Loop and draw the text
    clientBlockData.forEach((item) => {
      // Draw the Title (Bold)
      doc.setFont("NotoSans", "bold");
      doc.text(item.title, margin, yPos);
      // Draw the Value (Normal) - Check for text wrapping on long address lines
      doc.setFont("NotoSans", "normal");
      const lines = doc.splitTextToSize(item.value, 180 - valueStartX + margin); // Max width calculation
      
      lines.forEach((line, index) => {
          doc.text(line, valueStartX, yPos);
          if (index < lines.length - 1) {
              yPos += 5; // Use 5 for standard line spacing inside a wrapped block
          }
      });
      
      yPos += 6; // Use 6 for spacing between different fields
    });

    

    // // =========================================
    // //           CLIENT DETAILS
    // // =========================================

    // yPos = doc.lastAutoTable.finalY + 18;
    // doc.setFillColor(220, 220, 220);
    // doc.rect(margin, yPos - 6, 180, 8, "F");

    // doc.setFontSize(11).setFont("NotoSans", "bold");
    // doc.text("CLIENT DETAILS", margin + 2, yPos - 1);

    // yPos += 6;
    // doc.setFontSize(10).setFont("NotoSans", "normal");

    // const clientBlock = [
    //   safeField(quotation.lead_name) && `Name: ${quotation.lead_name}`,
    //   safeField(quotation.lead_organization || quotation.cOrganization_name) &&
    //     `Company: ${quotation.lead_organization || quotation.cOrganization_name}`,
    //   [quotation.clead_address1, quotation.clead_address2, quotation.clead_address3, quotation.cpincode]
    //     .filter(Boolean).length > 0
    //     ? `Address: ${[
    //         quotation.clead_address1,
    //         quotation.clead_address2,
    //         quotation.clead_address3,
    //         quotation.cpincode
    //       ]
    //         .filter(Boolean)
    //         .join(", ")}`
    //     : null,
    //   safeField(quotation.iphone_num) && `Phone: ${quotation.iphone_num}`,
    //   safeField(quotation.whatsapp_number) &&
    //     `WhatsApp: ${quotation.whatsapp_number}`,
    //   safeField(quotation.cemail) && `Email: ${quotation.cemail}`,
    //   safeField(quotation.cwebsite) && `Website: ${quotation.cwebsite}`,
    //   safeField(quotation.cGst) && `GST: ${quotation.cGst}`
    // ].filter(Boolean);

    // clientBlock.forEach((line) => {
    //   doc.text(line, margin, yPos);
    //   yPos += 6;
    // });

    // =========================================
    //             SERVICES TABLE
    // =========================================

    yPos += 5;
    autoTable(doc, {
      startY: yPos,
      head: [["SERVICE", "QTY", "PRICE", "DISCOUNT", "TAX", "TOTAL"]],
      body: quotation.services.map((s) => [
        s.cService_name,
        s.iQuantity?.toString() || "1",
        `${currencySymbol} ${s.fPrice || 0}`,
        s.fDiscount ? `${s.fDiscount}%` : "-",
        s.fTax ? `${currencySymbol} ${s.fTax}` : "-",
        `${currencySymbol} ${s.fTotal_price || 0}`
      ]),
      theme: "grid",
      headStyles: { fillColor: [255, 204, 0], textColor: 0 },
      styles: { font: "NotoSans", fontSize: 10, cellPadding: 2, textColor: [0, 0, 0] }
    });

    // =========================================
    //               TOTALS
    // =========================================

    let totalsY = doc.lastAutoTable.finalY + 10;

    const totals = [
      ["Sub Total", `${currencySymbol} ${q.fSubtotal}`],
      q.fDiscount && q.fDiscount > 0
        ? [`Discount (${q.fDiscount}%)`, `${currencySymbol} ${q.fDiscount}`]
        : null,
      ["Total Tax", `${currencySymbol} ${q.fTax_amount}`],
      ["Total Amount", `${currencySymbol} ${q.fTotal_amount}`]
    ].filter(Boolean);

    autoTable(doc, {
      startY: totalsY,
      margin: { left: 120 },
      theme: "plain",
      body: totals,
      styles: { font: "NotoSans", fontSize: 10, halign: "right" },
      columnStyles: { 0: { fontStyle: "bold" }, 1: { halign: "right" } }
    });

    // =========================================
    //           TERMS & CONDITIONS
    // =========================================

    totalsY = doc.lastAutoTable.finalY + 15;

    let termsList = [];
    if (quotation.terms_conditions?.length > 0) {
      termsList = quotation.terms_conditions;
    } else if (quotation.cTerms) {
      termsList = quotation.cTerms
        .split("\n")
        .filter((t) => t.trim() !== "");
    }

    if (termsList.length > 0) {
      doc.setFontSize(11).setFont("NotoSans", "bold");
      doc.text("Terms & Conditions:", margin, totalsY);
      totalsY += 6;

      doc.setFont("NotoSans", "normal").setFontSize(9);
      termsList.forEach((term) => {
        const lines = doc.splitTextToSize(`• ${term}`, 180);
        lines.forEach((line) => {
          doc.text(line, margin, totalsY);
          totalsY += 5;
        });
      });
    }

    // =========================================
    //                 FOOTER
    // =========================================
    doc.setFontSize(11).setFont("NotoSans", "bold");
    doc.text("Authorised Signature", 160, 280);

    doc.setFontSize(9).setFont("NotoSans", "normal");
    doc.text(
      `Done by: ${quotation.created_by_user_name || "Lead Owner"}`,
      margin,
      280
    );

    doc.setFontSize(10).setTextColor(100);
    doc.text(
      "Thanks for your business! Please visit us again.",
      105,
      290,
      { align: "center" }
    );

    // =========================================
    //               RETURN / SAVE
    // =========================================

    if (returnDataUrl) {
      return doc.output("datauristring");
    } else {
      const fileName = quoteNumber
        ? `Quotation-${quoteNumber}.pdf`
        : "Quotation.pdf";
      doc.save(fileName);
    }
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw new Error(`Failed to generate PDF: ${error.message}`);
  }
};
