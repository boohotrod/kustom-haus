import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { login } from "@/lib/mock-store";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "BBS AI Builder — Bejelentkezés" }] }),
  component: LoginPage,
});

function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [username, setUsername] = useState("demo");
  const [password, setPassword] = useState("demo");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const u = login(username, password);
    if (!u) { setError(t("login.invalid")); return; }
    void navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{t("login.title")}</CardTitle>
          <p className="text-xs text-muted-foreground">{t("login.subtitle")}</p>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={submit}>
            <div className="space-y-1">
              <Label htmlFor="u">{t("login.username")}</Label>
              <Input id="u" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="p">{t("login.password")}</Label>
              <Input id="p" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <Button type="submit" className="w-full">{t("login.submit")}</Button>
            <p className="text-[11px] text-muted-foreground text-center">{t("login.previewHint")}</p>
            <p className="text-[11px] text-muted-foreground text-center">
              <Link to="/" className="underline">{t("common.back")}</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
