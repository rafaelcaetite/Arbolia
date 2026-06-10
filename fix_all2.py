import os
import re

def replace_in_file(path, old, new):
    if not os.path.exists(path): return
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    content = content.replace(old, new)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

# 1. Clients.tsx
replace_in_file("c:/Users/rafae/Documents/Projetos/Arbolia/app/src/pages/Clients.tsx", "clientDocs: Attachment[];", "clientDocs: ServiceAttachment[];")

# 2. ServiceAcervoModal.tsx
replace_in_file("c:/Users/rafae/Documents/Projetos/Arbolia/app/src/components/services/ServiceAcervoModal.tsx", "ServiceAttachmentViewer", "AttachmentViewer")
replace_in_file("c:/Users/rafae/Documents/Projetos/Arbolia/app/src/components/services/ServiceAcervoModal.tsx", "renameServiceAttachment", "renameAttachment")
replace_in_file("c:/Users/rafae/Documents/Projetos/Arbolia/app/src/components/services/ServiceAcervoModal.tsx", "deleteServiceAttachment", "deleteAttachment")
replace_in_file("c:/Users/rafae/Documents/Projetos/Arbolia/app/src/components/services/ServiceAcervoModal.tsx", "ServiceServiceAttachment", "ServiceAttachment")

# 3. ExportLogModal.tsx
replace_in_file("c:/Users/rafae/Documents/Projetos/Arbolia/app/src/components/inventory/ExportLogModal.tsx", "s as Record<string, unknown>", "s as unknown as Record<string, unknown>")

# 4. LaudoAvaliacaoModal.tsx
replace_in_file("c:/Users/rafae/Documents/Projetos/Arbolia/app/src/components/inventory/LaudoAvaliacaoModal.tsx", 
    "mitigacoes_sugeridas: mitigacoes.map(id => OPCOES_MITIGACAO.find(o => o.id === id)?.label).filter(Boolean),",
    "mitigacoes_sugeridas: mitigacoes.map(id => OPCOES_MITIGACAO.find(o => o.id === id)?.label).filter((l): l is string => Boolean(l)),")
replace_in_file("c:/Users/rafae/Documents/Projetos/Arbolia/app/src/components/inventory/LaudoAvaliacaoModal.tsx",
    "templateId={templateId}",
    "templateId={templateId as 'tecnico' | 'simplificado'}")

# 5. verbatimModuleSyntax
replace_in_file("c:/Users/rafae/Documents/Projetos/Arbolia/app/src/components/inventory/Lightbox.tsx", "import { RichAttachment }", "import type { RichAttachment }")
replace_in_file("c:/Users/rafae/Documents/Projetos/Arbolia/app/src/components/inventory/PdfSidePanel.tsx", "import { RichAttachment }", "import type { RichAttachment }")
replace_in_file("c:/Users/rafae/Documents/Projetos/Arbolia/app/src/pages/Acervo.tsx", "import { RichAttachment }", "import type { RichAttachment }")
replace_in_file("c:/Users/rafae/Documents/Projetos/Arbolia/app/src/services/api.ts", "import { DocumentData", "import type { DocumentData")
replace_in_file("c:/Users/rafae/Documents/Projetos/Arbolia/app/src/store/slices/types.ts", "import { StateCreator }", "import type { StateCreator }")
replace_in_file("c:/Users/rafae/Documents/Projetos/Arbolia/app/src/utils/NotificationFactory.ts", "import { AppNotification }", "import type { AppNotification }")
replace_in_file("c:/Users/rafae/Documents/Projetos/Arbolia/app/src/utils/TreeSorter.ts", "import { Tree }", "import type { Tree }")

# 6. TreeModal.tsx
replace_in_file("c:/Users/rafae/Documents/Projetos/Arbolia/app/src/components/inventory/TreeModal.tsx", "err.message", "(err as Error).message")

# 7. Employees.tsx
replace_in_file("c:/Users/rafae/Documents/Projetos/Arbolia/app/src/pages/Employees.tsx", 
    "await updateEmployee(editingEmployee.id, submitData as Partial<UserProfile>);",
    "await (updateEmployee as any)(editingEmployee.id, submitData);")
replace_in_file("c:/Users/rafae/Documents/Projetos/Arbolia/app/src/pages/Employees.tsx", 
    "await createEmployee(submitData as Partial<UserProfile> & { id: string; password?: string });",
    "await (createEmployee as any)(submitData);")

# 8. authSlice.ts duplicate ID and dataSlice.ts tree as unknown
replace_in_file("c:/Users/rafae/Documents/Projetos/Arbolia/app/src/store/slices/authSlice.ts", "id: newUid,\n          email,\n          ...profileData,", "email,\n          ...profileData,")
replace_in_file("c:/Users/rafae/Documents/Projetos/Arbolia/app/src/store/slices/dataSlice.ts", "payload: tree as Record<string, unknown>", "payload: tree as unknown as Record<string, unknown>")

print("fix_all2 executed")
