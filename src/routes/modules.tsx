import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { BuilderShell, PageHeader } from "@/components/builder/BuilderShell";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { store, currentUser } from "@/lib/mock-store";
import { MODULE_STATES, type ModuleState } from "@/db/schema/project/modules";
import { MODULE_CATEGORIES } from "@/lib/bbs-modules";
import { appendAudit } from "@/lib/audit";

export const Route = createFileRoute("/modules")({
  head: () => ({ meta: [{ title: "BBS AI Builder — Modules" }] }),
  component: ModulesPage,
});

function ModulesPage() {
  const { t, i18n } = useTranslation();
  const [, force] = useState(0);
  const [category, setCategory] = useState<string>("all");

  const change = (id: string, next: ModuleState) => {
    const m = store.modules.find((x) => x.id === id);
    if (!m) return;
    if (m.state === next) return;
    const reason = window.prompt(t("modules.lifecycle.reasonPrompt") ?? "Change reason?");
    if (!reason || !reason.trim()) {
      window.alert(t("modules.lifecycle.reasonRequired"));
      return;
    }
    const prev = m.state;
    m.state = next;
    appendAudit(store.audit, {
      actorId: currentUser()?.id ?? null,
      tenantKey: "builder",
      action: "project.module.state_changed",
      targetType: "module", targetId: m.key,
      payload: { from: prev, to: next, reason: reason.trim() },
    });
    force((n) => n + 1);
  };

  // Localised label with safe fallback to the stored `name`.
  const label = (key: string, fallback: string) => {
    const tk = `modules.catalog.${key}.name`;
    const v = t(tk);
    return v === tk ? fallback : v;
  };

  const filtered = useMemo(
    () => store.modules.filter((m) => category === "all" || m.category === category),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [category, i18n.language, store.modules.length],
  );

  return (
    <BuilderShell title={t("modules.title")} subtitle={t("modules.subtitle")}>
      <PageHeader title={t("modules.title")} subtitle={t("modules.subtitle")} />

      <div className="mb-4 flex items-center gap-3">
        <span className="text-sm text-muted-foreground">{t("modules.columns.category")}</span>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="h-8 w-[220px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("modules.categoryAll")}</SelectItem>
            {MODULE_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>{t(`modules.categories.${c}`)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="ml-auto text-xs text-muted-foreground">
          {filtered.length} / {store.modules.length}
        </span>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("modules.columns.key")}</TableHead>
              <TableHead>{t("modules.columns.name")}</TableHead>
              <TableHead>{t("modules.columns.category")}</TableHead>
              <TableHead>{t("modules.columns.phase")}</TableHead>
              <TableHead>{t("modules.columns.state")}</TableHead>
              <TableHead>{t("modules.columns.visibility")}</TableHead>
              <TableHead>{t("modules.columns.dependsOn")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-mono text-xs">{m.key}</TableCell>
                <TableCell>
                  <div className="font-medium">{label(m.key, m.name)}</div>
                  <div className="text-xs text-muted-foreground">
                    {t(`modules.catalog.${m.key}.description`, { defaultValue: "" })}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{t(`modules.categories.${m.category}`)}</Badge>
                </TableCell>
                <TableCell><Badge variant="outline">{m.roadmapPhase}</Badge></TableCell>
                <TableCell>
                  <Select value={m.state} onValueChange={(v) => change(m.id, v as ModuleState)}>
                    <SelectTrigger className="h-8 w-[170px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {MODULE_STATES.map((s) => (
                        <SelectItem key={s} value={s}>{t(`modules.states.${s}`)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell><Badge variant="outline">{t(`modules.visibility.${m.visibility}`)}</Badge></TableCell>
                <TableCell>
                  {m.dependsOn.length === 0 ? (
                    <span className="text-xs text-muted-foreground">—</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {m.dependsOn.map((d) => (
                        <Badge key={d} variant="outline" className="font-mono text-[10px]">{d}</Badge>
                      ))}
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </BuilderShell>
  );
}
