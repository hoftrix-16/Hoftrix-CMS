import { useState } from "react";
import SettingsNav from "@/components/settings/SettingsNav";
import InvoiceSettingsPage from "@/app/(admin)/pages/invoices/settings/page";
import ActivityLogsPage from "../activity-logs/page";
import SocialMediaConfig from "../socialMedia/SocialMedia";
import LegalConfig from "../legal/LegalPage";
import AboutConfig from "../about/AboutPage";

type SettingsTab =
  | "branding"
  | "social"
  | "smtp"
  | "integrations"
  | "legal"
  | "about"
  | "sitemap"
  | "backups"
  | "history";

const SettingPage = () => {
  const [activeTab, setActiveTab] =
    useState<SettingsTab>("branding");

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="sticky top-[72px] z-30 bg-white/95 backdrop-blur-sm border-b border-slate-100 shadow-sm">
        <div className="p-sm-4">
          <SettingsNav
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>
      </div>

      <div className="py-4 p-sm-4">
        {activeTab === "branding" && (
          <InvoiceSettingsPage/>
        )}

        {activeTab === "social" && (
          <SocialMediaConfig/>
        )}

        {activeTab === "smtp" && (
          <div>SMTP Content</div>
        )}

        {activeTab === "integrations" && (
          <div>Integrations Content</div>
        )}

        {activeTab === "legal" && (
          <LegalConfig/>
        )}

        {activeTab === "about" && (
          <AboutConfig/>
        )}

        {activeTab === "sitemap" && (
          <div>Sitemap Content</div>
        )}

        {activeTab === "backups" && (
          <div>Backups Content</div>
        )}

        {activeTab === "history" && (
          <ActivityLogsPage/>
        )}
      </div>
    </div>
  );
};

export default SettingPage;