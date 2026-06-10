import os
import re

def fr(p, r, n):
    with open(p, "r", encoding="utf-8") as f: c = f.read()
    c = re.sub(r, n, c)
    with open(p, "w", encoding="utf-8") as f: f.write(c)

def f(p, o, n):
    with open(p, "r", encoding="utf-8") as f: c = f.read()
    c = c.replace(o, n)
    with open(p, "w", encoding="utf-8") as f: f.write(c)

fr("c:/Users/rafae/Documents/Projetos/Arbolia/app/src/components/inventory/Lightbox.tsx", r"import type \{ RichAttachment, getAttachmentUrl, downloadAttachment \} from '\./acervoUtils';", "import { getAttachmentUrl, downloadAttachment, type RichAttachment } from './acervoUtils';")
fr("c:/Users/rafae/Documents/Projetos/Arbolia/app/src/components/inventory/PdfSidePanel.tsx", r"import type \{ RichAttachment, getAttachmentUrl, downloadAttachment \} from '\./acervoUtils';", "import { getAttachmentUrl, downloadAttachment, type RichAttachment } from './acervoUtils';")
fr("c:/Users/rafae/Documents/Projetos/Arbolia/app/src/pages/Acervo.tsx", r"import type \{ RichAttachment, getAttachmentUrl, downloadAttachment, daysUntil \} from '\.\./components/inventory/acervoUtils';", "import { getAttachmentUrl, downloadAttachment, daysUntil, type RichAttachment } from '../components/inventory/acervoUtils';")

fr("c:/Users/rafae/Documents/Projetos/Arbolia/app/src/components/inventory/TreeModal.tsx", r"err\.message", "(err as Error).message")

fr("c:/Users/rafae/Documents/Projetos/Arbolia/app/src/pages/Employees.tsx", r"await updateEmployee\(editingEmployee\.id,\s*submitData\s*as\s*Partial<UserProfile>\);", "await (updateEmployee as any)(editingEmployee.id, submitData as any);")
fr("c:/Users/rafae/Documents/Projetos/Arbolia/app/src/pages/Employees.tsx", r"await createEmployee\(submitData\s*as\s*Partial<UserProfile>\s*&\s*\{\s*id:\s*string;\s*password\?:\s*string\s*\}\);", "await (createEmployee as any)(submitData as any);")
fr("c:/Users/rafae/Documents/Projetos/Arbolia/app/src/pages/Employees.tsx", r"onSubmit=\{editingEmployee\s*\?\s*updateEmployee\s*:\s*createEmployee\}", "onSubmit={async (data) => { if(editingEmployee) await (updateEmployee as any)(editingEmployee.id, data); else await (createEmployee as any)(data); }}")

f("c:/Users/rafae/Documents/Projetos/Arbolia/app/src/services/api.ts", "import { Tree, Client, Service, UserProfile, AuditLog } from '../store/useAppStore';", "import type { Tree, Client, Service, UserProfile, AuditLog } from '../store/useAppStore';")

fr("c:/Users/rafae/Documents/Projetos/Arbolia/app/src/store/slices/authSlice.ts", r"email,\s*\.\.\.profileData,\s*status: 'ativo'", "id: newUid,\n          email,\n          ...profileData,\n          status: 'ativo'")

print("done fix 5")
