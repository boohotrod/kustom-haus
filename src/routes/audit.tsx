import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2, ShieldAlert } from "lucide-react";

import { BuilderShell, PageHeader } from "@/components/builder/BuilderShell";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { store } from "@/lib/mock-store";
import { verifyAuditChain } from "@/lib/audit";

export const Route = createFileRoute("/audit")({
  head: () => ({ meta: [{ title: "BBS AI Builder — Audit log" }] }),
  component: AuditPage,
});

function AuditPage() {
  const { t } = useTranslation();
  const [result, setResult] = useState<null | { ok: true } | { ok: false; brokenAt: number }>(null);

  return (
    <BuilderShell title={t("audit.title")} subtitle={t("audit.subtitle")}>
      <PageHeader title={t("audit.title")} subtitle={t("audit.subtitle")} />
      <div className="mb-4 flex items-center gap-3">
        <Button onClick={() => setResult(verifyAuditChain(store.audit))}>{t("audit.verify")}</Button>
        {result?.ok === true && (
          <span className="text-sm text-emerald-600 flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4" /> {t("audit.verified")}
          </span>
        )}
        {result && !result.ok && (
          <span className="text-sm text-destructive flex items-center gap-1">
            <ShieldAlert className="h-4 w-4" /> {t("audit.broken", { row: result.brokenAt })}
          </span>
        )}
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>{t("audit.columns.ts")}</TableHead>
              <TableHead>{t("audit.columns.actor")}</TableHead>
              <TableHead>{t("audit.columns.action")}</TableHead>
              <TableHead>{t("audit.columns.target")}</TableHead>
              <TableHead>{t("audit.columns.hash")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {store.audit.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="font-mono">{e.seq}</TableCell>
                <TableCell className="text-xs">{new Date(e.createdAt).toLocaleTimeString()}</TableCell>
                <TableCell className="font-mono text-xs">{e.actorId?.slice(0, 8) ?? "system"}</TableCell>
                <TableCell className="font-mono text-xs">{e.action}</TableCell>
                <TableCell className="font-mono text-xs">{e.targetType}:{e.targetId}</TableCell>
                <TableCell className="font-mono text-[10px]">{e.hash.slice(0, 16)}…</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </BuilderShell>
  );
}
