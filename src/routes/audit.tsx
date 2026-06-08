import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2, ShieldAlert } from "lucide-react";

import { BuilderShell, PageHeader } from "@/components/builder/BuilderShell";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { store } from "@/lib/mock-store";
import { verifyAuditChain } from "@/lib/audit";

export const Route = createFileRoute("/audit")({
  head: () => ({ meta: [{ title: "BBS AI Builder — Audit log" }] }),
  component: AuditPage,
});

const ALL = "__all__";

function AuditPage() {
  const { t } = useTranslation();
  const [result, setResult] = useState<null | { ok: true } | { ok: false; brokenAt: number }>(null);
  const [tenantFilter, setTenantFilter] = useState<string>(ALL);

  const tenants = useMemo(() => {
    const set = new Set<string>();
    for (const e of store.audit) if (e.tenantKey) set.add(e.tenantKey);
    return Array.from(set).sort();
  }, []);

  const rows = useMemo(
    () => (tenantFilter === ALL ? store.audit : store.audit.filter((e) => e.tenantKey === tenantFilter)),
    [tenantFilter],
  );

  return (
    <BuilderShell title={t("audit.title")} subtitle={t("audit.subtitle")}>
      <PageHeader title={t("audit.title")} subtitle={t("audit.subtitle")} />
      <div className="mb-4 flex items-center gap-3 flex-wrap">
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
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{t("audit.tenantFilter")}</span>
          <Select value={tenantFilter} onValueChange={setTenantFilter}>
            <SelectTrigger className="w-44 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t("audit.tenantAll")}</SelectItem>
              {tenants.map((tk) => (
                <SelectItem key={tk} value={tk}>{tk}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>{t("audit.columns.ts")}</TableHead>
              <TableHead>{t("audit.columns.tenant")}</TableHead>
              <TableHead>{t("audit.columns.actor")}</TableHead>
              <TableHead>{t("audit.columns.action")}</TableHead>
              <TableHead>{t("audit.columns.target")}</TableHead>
              <TableHead>{t("audit.columns.hash")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="font-mono">{e.seq}</TableCell>
                <TableCell className="text-xs">{new Date(e.createdAt).toLocaleTimeString()}</TableCell>
                <TableCell className="font-mono text-xs">{e.tenantKey ?? "—"}</TableCell>
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
