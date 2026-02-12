import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import ProfileHeader from "../../Components/common/ProfileHeader";
import { useSettingsAccess } from "../../context/companySettingsContext";

const cardsData = [
  {
    title: "Sales by Stage Analytics",
    description: "View performance of opportunities across sales stages.",
    route: "/sales-by-stage-analytics",
    // image: "/public/illustrations/analytics.svg", 
    image: "/illustrations/analytics.svg", 
    reportKey: "SalesStageReport",
  },
  {
    title: "Lead Lost Analytics",
    description: "Analyze lost leads and identify drop-off patterns.",
    route: "/lead-lost-analytics",
    // image: "/public/illustrations/lost.svg", 
    image: "/illustrations/lost.svg", 
    reportKey: "LostLeadReport",
  },
  {
    title: "Prospects Engaged But Not Converted",
    description: "View performance of opportunities across sales stages.",
    route: "/prospects-not-converted",
    // image: "/public/illustrations/Analytics-rafiki.svg",
    image: "/illustrations/Analytics-rafiki.svg",
    reportKey: "ProspectsLostLeadsReport",
  },
  {
    title: "First Response Time for Opportunity",
    description: "View performance of opportunities across sales stages.",
    route: "/First-Response-Time-for-Opportunity",
    // image: "/public/illustrations/firstresponse.svg",
    image: "/illustrations/firstresponse.svg",  
    reportKey: "FirstResponseTimeOppurtunityReport",
  },
  {
    title: "Company Leads",
    description: "View performance of opportunities across sales stages.",
    route: "/company-leads",
    // image: "/public/illustrations/funnel.svg",
    image: "/illustrations/funnel.svg",  
    reportKey: "CompanyOverallReport"
  },

  // no need now
  // {
  //   title: "Lead Owner Efficiency",
  //   description: "View performance of opportunities across sales stages.",
  //   route: "/lead-owner-efficiency",
  //   // image: "/public/illustrations/efficeincy.svg", 
  //   image: "/illustrations/efficeincy.svg", 
  //   reportKey: "LeadOwnerActivityReport",
  // },

  // // no need now
  // {
  //   title: "Sales Pipeline",
  //   description: "View performance of opportunities across sales stages.",
  //   route: "/Sales-pipeline",
  //   // image: "/public/illustrations/salespipeline.svg",
  //   image: "/illustrations/salespipeline.svg",
  //   reportKey: "SalesPipelineReport"
  // },
  {
    title: "Territory Based Analytics",
    description: "View performance of opportunities across sales Regions.",
    route: "/territory-based-analytics",
    // image: "/public/illustrations/map.png",
    image: "/illustrations/map.png",
    reportKey: "TerritoryLeadReport"

  },
  //  {
  //   title: "Recurring Client Analytics",
  //   description: "Track and analyze repeat business performance across client segments",
  //   route: "/recurring-client-analytics",  
  //   // image: "/public/illustrations/recurring_client_report.svg",
  //   image: "/illustrations/recurring_client_report.svg",  
  //   reportKey: "LeadConversionReport" 

  // },

   {
    title: "Sales Target vs Achievement",
    description: "Track assigned sales targets against achieved revenue, view remaining goals, achievement percentage, and over- or under-performance by period.",
    route: "/SalesTargetReport",
    image: "/illustrations/target.svg",
    reportKey: "SalesTargetAchievement"
  },

  {
    title: "Salesperson Performance",
    description: "Analyze individual salesperson productivity including leads handled, deals closed, revenue generated, conversion rate, and activity performance.",
    route: "/SalespersonPerformanceReport",
    image: "/illustrations/salesperson_perform.svg",
    reportKey: "SalespersonPerformance"
  },

  {
    title: "Lead Source Performance",
    description: "Evaluate the effectiveness of each lead source by tracking lead volume, qualified leads, conversions, revenue generated, and marketing ROI.",
    route: "/LeadSourcePerformanceReport",
    image: "/illustrations/Source.svg",
    reportKey: "LeadSourcePerformance"
  },

  {
    title: "Revenue Breakdown",
    description: "Gain insights into revenue distribution across products, salespersons, clients, regions, and time periods for better financial planning.",
    route: "/RevenueBreakdownReport",
    image: "/illustrations/Revenue.svg",
    reportKey: "RevenueBreakdown"
  },

  {
    title: "Customer Sales History",
    description: "View complete customer-wise sales history including total deals, revenue earned, purchased products, and purchase timelines.",
    route: "/CustomerSalesHistoryReport",
    image: "/illustrations/Customer.svg",
    reportKey: "CustomerSalesHistory"
  },

  {
    title: "Call Logs Report",
    description: "View complete customer-wise call history including total calls, call duration, conversion outcomes, discussed services/products, and engagement timelines.",
    route: "/call-logs-report",
    image: "/illustrations/call-report.svg",
    reportKey: "CallLogsReport"
  },

];

const CardsPage = () => {
  const { settingsAccess } = useSettingsAccess();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");


  // Search by title
  if (
    !settingsAccess ||
    !settingsAccess.companySettings ||
    !settingsAccess.companySettings.Reports
  ) {
    return <div>Loading...</div>;
  }

  // Filter cards by search AND companySettings.Reports
  let filteredCards = cardsData
    .filter((card) =>
      card.title.toLowerCase().includes(query.toLowerCase())
    )
    .filter(
      (card) => settingsAccess.companySettings.Reports[card.reportKey] === true
    );


  return (
    <div className="flex min-h-screen text-gray-900">
      {/* Sidebar */}
    
      {/* Main Content */}
      <div className="flex-1 px-8 py-10">
          <ProfileHeader />

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <input type="text" placeholder="Search Dashboards"
             className="w-full px-5 py-3 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent shadow-sm"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Header */}
        <h2 className="text-3xl font-semibold mb-8 tracking-tight">Analytics Dashboard</h2>

        {/* Cards */}
        {filteredCards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredCards.map((card, index) => (
              <div key={index} onClick={() => navigate(card.route)}
                className="flex items-center justify-between bg-white rounded-2xl p-6 min-h-[180px] shadow-sm hover:shadow-md transition cursor-pointer border border-gray-200 hover:border-blue-400"
              >
                <div className="flex-1 pr-4">
                  <h3 className="text-xl font-medium text-gray-800 mb-2">{card.title}</h3>
                  <p className="text-sm text-gray-500">{card.description}</p>
                </div>

                {/* Image */}
              <div className="w-40 h-40 flex-shrink-0">
                <img src={card.image} alt={card.title} className="w-full h-full object-cover rounded-lg" />
              </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No results found for "{query}"</p>
        )}
      </div>
    </div>
  );
};

export default CardsPage;
