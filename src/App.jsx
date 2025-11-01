import React from "react";
import { Routes, Route } from "react-router-dom";
import ForgetPassword from "./Components/ForgetPassword";
import { ToastProvider } from "./context/ToastContext";
import SuccessMessage from "./pages/credential/SuccessMessage";
import VerifyCodePage from "./pages/credential/verify_code";
import Login from "./pages/credential/login";
import { PopupProvider } from "./context/PopupContext";
import SignupRes from "./pages/credential/signup_res";
import RequestDemo from "./Components/request_demo.jsx";
import UpdatePassword from "./Components/UpdatePassword";
import AppLayout from "./Components/AppLayout";
import PrivateRoute from "./Components/PrivateRoute.jsx";
import { UserProvider } from "./context/UserContext";
import { TabProvider } from "./context/TabContext";


// All your other imports...
import NotificationPage from "./pages/notification";
import TerritoryLeadsAnalytics from "./Components/reports/TerritoryReport/TerritoryLeads.jsx"
import UserProfile from "./pages/userProfile";
import CalendarPage from "./pages/calenderpage";
import CardsPage from './Components/reports/reports';
import SalesByStageReportPage from './Components/reports/salesByStageReport';
import LostLeadReportPage from './Components/reports/LeadLostReport';
import CompanyDashboard from './pages/dashboard/companydashboard';
import UserPage from "./pages/userPage/userPage";
import Commandpage from "./pages/command";
import Tasks from './Components/task.jsx';
import CreateUserForm from "./Components/registerUser";
import ProspectsEngagedReport from './Components/reports/ProspectsEngagedReport';
import FirstResponseTimeReport from "./Components/reports/first-response.jsx";
import LeadConversionPage from "./Components/reports/LeadConversionPage.jsx";
import CompanyLeads from "./Components/reports/company_leads";
import LeadOwnerEfficency from "./Components/reports/lead_owner_efficiency";
import SalesPipelineAnalysis from "./Components/reports/Sales_pipeline_analysis.jsx";
import LeadsDashboard from "./pages/dashboard/teamLeadDashboard";
import LeadListViewPage from "./pages/dashboard/LeadListView";
import LeadCardViewPage from "./pages/dashboard/LeadcardView";
import Xcode_LeadCardViewPage from "./pages/dashboard/XcodeFix_LeadCardView.jsx";
import LeadManagePage from "./pages/LeadManagePage";
import LeadTimeline from "./Components/LeadTimeline";
import AllLeadsPage from "./pages/dashboard/AllLeadsPage";
import HistoryPage from "./pages/history";
import UserCallLogs from "./pages/userPage/userCallLogs";
import LogUserCallLogs from "./pages/userPage/logUserCallLogs.jsx";
import CompanyMaster from "./pages/Masters/companyMaster.jsx";
import ActiveLeadTab from "./pages/dashboard/activeLeadTab.jsx";
import StatusKanbanPage from "./pages/dashboard/statusKanbanBoard.jsx";
import WonList from './pages/customerModule/customer.jsx';
import CompanyList from "./Components/Company/CompanyList";
import TermsAndConditions from "./Components/Quotation/termsAndCondition.jsx";
import Tax from "./Components/Quotation/tax.jsx";
import CompanyPage from "./pages/companypage";
import UserAnalyticsPage from "./pages/user_analytics";
import TeamviewDashboard from "./pages/dashboard/teamviewdashboard";
import LeadDetailView from "./context/leaddetailsview";
import LeadDetailWithMileStone from "./Industries/Marketing/XcodeFix/Components/postSales/leadDetailWithMileStone.jsx";
import UserDeals from "./pages/userPage/userDeal.jsx";
import UserReportPage from "./pages/userPage/UserReportPage.jsx";
import SettingsPage from "./pages/settings/settingsPage";
import AccountSettings from "./pages/settings/accountSettings";
import NotificationSettings from "./pages/settings/notificationSettings";
import BillingSettings from "./pages/settings/billingSettings";
import MembersSettings from "./pages/settings/membersSettings";
import GeneratePoster from "./Components/Tools/Poster/GeneratePoster.jsx";
import SupportSettings from "./pages/settings/supportSettings";
import SmtpSettings from "./pages/settings/smtpsettings";
import LableMaster from './Components/settings/lableMaster';
import BulkMailSender from "./Components/bulkMail/bulkMailSender.jsx";
import BulkMailStatus from "./Components/bulkMail/bulkMailStatus.jsx";
import UserLead from "./pages/userPage/userLead.jsx";
import GSTCompliancePage from "./Components/Tools/GST/GSTCompliancePage.jsx";
import QuickCalculator from "./Components/Tools/calculator/QuickCalculator.jsx";
import DistanceToClient from "./Components/Tools/Maps/DistanceToClient.jsx";
function App() {
  return (
    <PopupProvider>
      <ToastProvider>
        <TabProvider>
          <UserProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Login />} />
              <Route path="/request-demo" element={<RequestDemo />} />
              <Route path="/forgetpassword" element={<ForgetPassword />} />
              <Route path="/success" element={<SuccessMessage />} />
              <Route path="/verify" element={<VerifyCodePage />} />
              <Route path="/signupres" element={<SignupRes />} />
              <Route path="/UpdatePassword" element={<UpdatePassword />} />

              {/* Protected Routes */}
              {/* <Route element={<PrivateRoute />}> */}
                <Route element={<AppLayout />}>
                  <Route path="/notifications" element={<NotificationPage />} />
                  <Route path="/territory-based-analytics" element={<TerritoryLeadsAnalytics />} />
                  <Route path="userprofile/:userId" element={<UserProfile />} />
                  <Route path="calenderpage" element={<CalendarPage />} />
                  <Route path="/reportpage" element={<CardsPage />} />
                  <Route path="/sales-by-stage-analytics" element={<SalesByStageReportPage />} />
                  <Route path="/lead-lost-analytics" element={<LostLeadReportPage />} />
                  <Route path="/companydashboard" element={<CompanyDashboard />} />
                  <Route path="userpage" element={<UserPage />} />
                  <Route path="commandpage" element={<Commandpage />} />
                  <Route path="task" element={<Tasks />} />
                  <Route path="/users" element={<CreateUserForm />} />
                  <Route path="/leaddashboard" element={<LeadsDashboard/>} />
                  <Route path="/prospects-not-converted" element={<ProspectsEngagedReport />} />
                  <Route path="/First-Response-Time-for-Opportunity" element={<FirstResponseTimeReport />} />
                  <Route path="/lead-conversion" element={<LeadConversionPage />} />
                  <Route path="/company-leads" element={<CompanyLeads />} />
                  <Route path="/lead-owner-efficiency" element={<LeadOwnerEfficency />} />
                  <Route path='/Sales-pipeline' element={<SalesPipelineAnalysis />} />
                  <Route path='userleads' element={<UserLead />} />
                  <Route path="/leads" element={<LeadsDashboard />} />
                  <Route path="leadlistview" element={<LeadListViewPage />} />
                  <Route path="leadcardview" element={<LeadCardViewPage />} />
                  <Route path="xcodefix_leadcardview" element={<Xcode_LeadCardViewPage />} />
                  <Route path="leadmanage" element={<LeadManagePage />} />
                  <Route path="leadtimeline" element={<LeadTimeline />} />
                  <Route path="allleadpage" element={<AllLeadsPage />} />
                  <Route path="history" element={<HistoryPage />} />
                  <Route path="usercalllogs" element={<UserCallLogs />} />
                  <Route path="logusercalllogs" element={<LogUserCallLogs />} />
                  <Route path="companymaster" element={<CompanyMaster />} />
                  <Route path="active-leads" element={<ActiveLeadTab />} />
                  <Route path="status-kanban" element={<StatusKanbanPage />} />
                  <Route path="customers" element={<WonList />} /> 
                  <Route path="companylist" element={<CompanyList />} />
                  <Route path="companypage" element={<CompanyPage />} />
                  <Route path="analytics" element={<UserAnalyticsPage />} />
                  <Route path="teamview" element={<TeamviewDashboard />} />
                  <Route path="/mailsender" element={<BulkMailSender />} />
                  <Route path="/mailstatus" element={<BulkMailStatus />} />
                  <Route path="leaddetailview/:leadId" element={<LeadDetailView />} />
                  <Route path="xcodefix_leaddetailview_milestone/:leadId" element={<LeadDetailWithMileStone />} />
                  <Route path="userdeals/:userId" element={<UserDeals />} />
                  <Route path="/reports/:userId" element={<UserReportPage />} />
                  <Route path="/first-response" element={<FirstResponseTimeReport />} />
                 <Route path="/generate-poster" element={<GeneratePoster />} />
                  <Route path="/gst-compliance" element={<GSTCompliancePage />} />
                  <Route path="/calculator" element={<QuickCalculator />} />
                  <Route path="/maps" element={<DistanceToClient/>}/>
                  <Route path="settingspage" element={<SettingsPage />}>
                    <Route path="account" element={<AccountSettings />} />
                    <Route path="lable" element={<LableMaster />} />
                    <Route path="terms" element={<TermsAndConditions />} />
                    <Route path="tax" element={<Tax />} />
                    <Route path="notification" element={<NotificationSettings />} />
                    <Route path="billing" element={<BillingSettings />} />
                    <Route path="members" element={<MembersSettings />} />
                    <Route path="support" element={<SupportSettings />} />
                    <Route path="smtpsettings" element={<SmtpSettings />} />


                  </Route>

                </Route>
              {/* </Route> */}
            </Routes>
          </UserProvider>
        </TabProvider>
      </ToastProvider>
    </PopupProvider>
  );
}

export default App;
