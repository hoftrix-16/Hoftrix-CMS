import React from "react";
import {
  Palette,
  Share2,
  Scale,
  Info,
  History,
  LucideIcon,
} from "lucide-react";

export type SettingsTab =
  | "branding"
  | "social"
  | "smtp"
  | "integrations"
  | "legal"
  | "about"
  | "sitemap"
  | "backups"
  | "history";

interface SettingsNavProps {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
  title?: string;
  subtitle?: string;
}

interface TabItem {
  id: SettingsTab;
  label: string;
  icon: LucideIcon;
}

const tabs: TabItem[] = [
  { id: "branding", label: "Branding", icon: Palette },
  { id: "social", label: "Social Media", icon: Share2 },
  { id: "legal", label: "Legal", icon: Scale },
  { id: "about", label: "About Us", icon: Info },
  { id: "history", label: "History", icon: History },
];

const SettingsNav: React.FC<SettingsNavProps> = ({
  activeTab,
  onTabChange,
  title = "Settings",
  subtitle = "Manage database backups and download archives",
}) => {
  return (
    <div className="w-100 rounded-3 border border-light bg-white p-4 shadow-sm">
      <div className="mb-3">
        <h1
          className="mb-1 fw-semibold"
          style={{
            fontSize: "24px",
            color: "#085e6e",
            letterSpacing: "-0.3px",
          }}
        >
          {title}
        </h1>

        <p className="mb-0 text-muted small">{subtitle}</p>
      </div>

      <div className="border-top border-light pt-3">
        <div className="d-flex align-items-center justify-content-evenly gap-2 w-100">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`btn d-flex align-items-center justify-content-center gap-2 flex-fill ${
                  isActive
                    ? "btn-primary"
                    : "bg-white border text-dark"
                }`}
                style={{
                  minHeight: "42px",
                  padding: "10px 16px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: isActive ? "#fff" : "#085e6e",
                  borderColor: isActive ? "#085e6e" : "#dee2e6",
                }}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SettingsNav;