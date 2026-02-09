import React, { useState, useEffect } from "react";
import { ENDPOINTS } from "../../../api/constraints";

// const highlightText = (text) => {
//   if (!text) return "";

//   const patterns = [
//     // Lead name
//     /Lead\s+"([^"]+)"/gi,

//     // Stage / status
//     /"(.*?)"\s+stage/gi,
//     /\b(pipeline|won|lost|open|closed)\b/gi,

//     // Assigned
//     /\bassigned to\s+(no one|[^.\n]+)/gi,

//     // Date formats
//     /\b(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+\w+\s+\d{1,2}\s+\d{4}\b/gi,

//     // Created by / person name
//     /\bby\s+([A-Z][a-zA-Z]+)/g,

//     // Currency values
//     /(₹\s?\d{1,3}(?:,\d{3})*(?:\.\d+)?)/g,

//     // Counts
//     /\d+\s+task\(s\)/gi,
//     /\d+\s+email\(s\)/gi,
//     /\d+\s+comment\(s\)/gi,

//     // Files
//     /\d+\s+file\(s\)\s+uploaded/gi,
//   ];

//   let highlighted = text;

//   patterns.forEach((pattern) => {
//     highlighted = highlighted.replace(
//       pattern,
//       (match) =>
//         `<span class="px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold shadow-sm">${match}</span>`
//     );
//   });

//   return highlighted;
// };

const highlightText = (text) => {
  if (!text) return "";

  /* ================= CLEAN UNWANTED LINES ================= */
  let cleaned = text
    .split("\n")
    .filter(line => {
      if (/Assigned to:\s*Not assigned/i.test(line)) return false;
      if (/Sub-service:\s*Not specified/i.test(line)) return false;
      return true;
    })
    .join("\n");

  /* ================= HIGHLIGHT RULES ================= */
  const rules = [
    // Lead name
    {
      regex: /Lead\s+"([^"]+)"/gi,
      className: "bg-indigo-50 text-indigo-700"
    },

    // Created date
    {
      regex: /\b(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+\w+\s+\d{1,2}\s+\d{4}\b/gi,
      className: "bg-gray-100 text-gray-700"
    },

    // Created by
    {
      regex: /\bby\s+[A-Z][a-zA-Z]+/g,
      className: "bg-cyan-50 text-cyan-700"
    },

    // Status
    {
      regex: /Status:\s*"([^"]+)"/gi,
      className: "bg-blue-50 text-blue-700"
    },

    // Deal status
    {
      regex: /\b(In pipeline|Converted|Won)\b/gi,
      className: "bg-green-50 text-green-700"
    },
    {
      regex: /\bLost\b/gi,
      className: "bg-red-50 text-red-700"
    },

    //  Service 
    {
      regex: /Services:\s*([A-Za-z ]+)/gi,
      className: "bg-violet-50 text-violet-700"
    },

    // Money
    {
      regex: /(₹\s?\d{1,3}(?:,\d{3})*(?:\.\d+)?)/g,
      className: "bg-emerald-50 text-emerald-700"
    },

    // Activity counts
    {
      regex: /\d+\s+tasks?/gi,
      className: "bg-blue-50 text-blue-700"
    },
    {
      regex: /\d+\s+emails?/gi,
      className: "bg-sky-50 text-sky-700"
    },
    {
      regex: /\d+\s+comments?/gi,
      className: "bg-indigo-50 text-indigo-700"
    },
    {
      regex: /\d+\s+files?/gi,
      className: "bg-purple-50 text-purple-700"
    },
    {
      regex: /\d+\s+WhatsApp\s+messages?/gi,
      className: "bg-green-50 text-green-700"
    },

    // Last activity
    {
      regex: /No activity/gi,
      className: "bg-gray-200 text-gray-600"
    }
  ];

  let highlighted = cleaned;

  rules.forEach(({ regex, className }) => {
    highlighted = highlighted.replace(
      regex,
      match =>
        <span class="px-1.5 py-0.5 rounded-md font-semibold shadow-sm ${className}">${match}</span>
    );
  });

  return highlighted;
};

const LeadSummaryModal = ({ leadId, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState("");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
  }, []);

  useEffect(() => {
    if (!leadId) return;

    const fetchSummary = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${ENDPOINTS.LEAD_SUMMARY}/${leadId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        setSummary(data?.summary || "No summary available");
      } catch {
        setSummary("Failed to load summary");
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [leadId]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-200 ${visible ? "opacity-100" : "opacity-0"}`}
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className={`
          relative z-10
          w-[90vw] max-w-2xl
          bg-white rounded-2xl
          p-6
          shadow-[0_30px_80px_rgba(59,130,246,0.35)]
          transform transition-all duration-200
          ${visible ? "scale-100 opacity-100" : "scale-95 opacity-0"}
        `}
      >
        {/* Close */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-xl"
        >
          ✕
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            Lead Summary
          </h2>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-sm">
            AI-Powered
          </span>
        </div>

        <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-4" />

        {/* Content */}
        <div className="text-[15px] leading-7 text-gray-700">
          {loading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-5/6" />
            </div>
          ) : (
            <div
              className="whitespace-pre-line"
              dangerouslySetInnerHTML={{
                __html: highlightText(summary),
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default LeadSummaryModal;