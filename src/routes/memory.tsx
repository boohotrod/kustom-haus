import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { BuilderShell, PageHeader } from "@/components/builder/BuilderShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { store, currentUser } from "@/lib/mock-store";
import { MEMORY_SCOPES, type MemoryScope } from "@/db/schema/project/memory";
import { appendAudit } from "@/lib/audit";

export const Route = createFileRoute("/memory")({
  head: () => ({ meta: [{ title: "BBS AI Builder — Project memory" }] }),
  component: MemoryPage,
});

function MemoryPage() {
  const { t } = useTranslation();
  const [, force] = useState(0);
  const [scope, setScope] = useState<MemoryScope>("core");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const handleAdd = () => {
    if (!title.trim() || !body.trim()) return;
    const id = crypto.randomUUID();
    store.memory.push({ id, scope, title, body, updatedAt: new Date().toISOString() });
    appendAudit(store.audit, {
      actorId: currentUser()?.id ?? null,
      action: "project.memory.created",
      targetType: "memory", targetId: id, payload: { scope, title },
    });
    setTitle(""); setBody(""); force((n) => n + 1);
  };

  return (
    <BuilderShell title={t("memory.title")} subtitle={t("memory.subtitle")}>
      <PageHeader title={t("memory.title")} subtitle={t("memory.subtitle")} />
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="md:col-span-1">
          <CardHeader><CardTitle>{t("common.create")}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Select value={scope} onValueChange={(v) => setScope(v as MemoryScope)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MEMORY_SCOPES.map((s) => (
                  <SelectItem key={s} value={s}>{t(`memory.scopes.${s}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input placeholder={t("decisions.columns.title")} value={title} onChange={(e) => setTitle(e.target.value)} />
            <Textarea placeholder="…" value={body} onChange={(e) => setBody(e.target.value)} rows={5} />
            <Button onClick={handleAdd} className="w-full">{t("common.save")}</Button>
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-3">
          {MEMORY_SCOPES.map((s) => {
            const items = store.memory.filter((m) => m.scope === s);
            if (items.length === 0) return null;
            return (
              <Card key={s}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">{t(`memory.scopes.${s}`)}</CardTitle>
                  <Badge variant="outline">{items.length}</Badge>
                </CardHeader>
                <CardContent className="space-y-2">
                  {items.map((m) => (
                    <div key={m.id} className="border rounded-md p-3">
                      <div className="font-medium text-sm">{m.title}</div>
                      <div className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{m.body}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </BuilderShell>
  );
}
