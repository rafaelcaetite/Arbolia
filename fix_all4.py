import os
import re

def r(p, o, n):
    if not os.path.exists(p): return
    with open(p, "r", encoding="utf-8") as f: c = f.read()
    with open(p, "w", encoding="utf-8") as f: f.write(c.replace(o, n))

r("c:/Users/rafae/Documents/Projetos/Arbolia/app/src/components/inventory/Lightbox.tsx", 
  "import type { RichAttachment, getAttachmentUrl, downloadAttachment } from './acervoUtils';", 
  "import { getAttachmentUrl, downloadAttachment, type RichAttachment } from './acervoUtils';")
  
r("c:/Users/rafae/Documents/Projetos/Arbolia/app/src/components/inventory/PdfSidePanel.tsx", 
  "import type { RichAttachment, getAttachmentUrl, downloadAttachment } from './acervoUtils';", 
  "import { getAttachmentUrl, downloadAttachment, type RichAttachment } from './acervoUtils';")

r("c:/Users/rafae/Documents/Projetos/Arbolia/app/src/pages/Acervo.tsx", 
  "import type { RichAttachment, getAttachmentUrl, downloadAttachment, daysUntil } from '../components/inventory/acervoUtils';", 
  "import { getAttachmentUrl, downloadAttachment, daysUntil, type RichAttachment } from '../components/inventory/acervoUtils';")

with open("c:/Users/rafae/Documents/Projetos/Arbolia/app/src/services/api.ts", "r", encoding="utf-8") as f: c = f.read()
c = c.replace("import type {", "import {")
c = c.replace(", DocumentData }", ", type DocumentData }")
c = c.replace(" DocumentData }", " type DocumentData }")
with open("c:/Users/rafae/Documents/Projetos/Arbolia/app/src/services/api.ts", "w", encoding="utf-8") as f: f.write(c)

r("c:/Users/rafae/Documents/Projetos/Arbolia/app/src/components/inventory/TreeModal.tsx", 
  "console.error(err.message);", "console.error((err as Error).message);")
r("c:/Users/rafae/Documents/Projetos/Arbolia/app/src/components/inventory/TreeModal.tsx", 
  "alert(`Erro: ${err.message}`);", "alert(`Erro: ${(err as Error).message}`);")

with open("c:/Users/rafae/Documents/Projetos/Arbolia/app/src/pages/Employees.tsx", "r", encoding="utf-8") as f: c = f.read()
c = re.sub(r'onSubmit=\{editingEmployee \? updateEmployee : createEmployee\}', 'onSubmit={async (data) => { if(editingEmployee) await (updateEmployee as any)(editingEmployee.id, data); else await (createEmployee as any)(data); }}', c)
with open("c:/Users/rafae/Documents/Projetos/Arbolia/app/src/pages/Employees.tsx", "w", encoding="utf-8") as f: f.write(c)

r("c:/Users/rafae/Documents/Projetos/Arbolia/app/src/store/slices/authSlice.ts", 
  "id: newUid,\n          email,\n          ...profileData", 
  "email,\n          ...profileData")

print("done")
