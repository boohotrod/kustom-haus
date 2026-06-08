import { useTranslation } from "react-i18next";
import { LogOut } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BuilderSidebar } from "./BuilderSidebar";
import { currentUser, logout } from "@/lib/mock-store";
import { SUPPORTED_LOCALES } from "@/i18n";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export function BuilderShell({ children, title, subtitle }: { children: React.ReactNode; title?: string; subtitle?: string }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const user = currentUser();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background text-foreground">
        <BuilderSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center gap-3 border-b px-3">
            <SidebarTrigger />
            <div className="flex-1 min-w-0">
              {title && <div className="text-sm font-semibold truncate">{title}</div>}
              {subtitle && <div className="text-xs text-muted-foreground truncate">{subtitle}</div>}
            </div>
            <Badge variant="outline" className="hidden md:inline-flex">{t("common.previewMode")}</Badge>
            <Select value={i18n.language} onValueChange={(v) => void i18n.changeLanguage(v)}>
              <SelectTrigger className="w-[110px] h-8">
                <SelectValue placeholder={t("common.language")} />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_LOCALES.map((l) => (
                  <SelectItem key={l} value={l}>{l.toUpperCase()}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {user ? (
              <Button variant="ghost" size="sm" onClick={() => { logout(); void navigate({ to: "/login" }); }}>
                <LogOut className="h-4 w-4 mr-1" /> {t("nav.logout")}
              </Button>
            ) : (
              <Button variant="default" size="sm" onClick={() => void navigate({ to: "/login" })}>
                {t("nav.login")}
              </Button>
            )}
          </header>
          <main className="flex-1 p-6 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
    </div>
  );
}
