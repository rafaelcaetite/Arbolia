import os
import re

def replace_regex(path, pattern, repl):
    if not os.path.exists(path): return
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    content = re.sub(pattern, repl, content)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

def replace_str(path, old, new):
    if not os.path.exists(path): return
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    content = content.replace(old, new)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

# ExportLogModal.tsx
replace_regex("c:/Users/rafae/Documents/Projetos/Arbolia/app/src/components/inventory/ExportLogModal.tsx", r"as Record<string, unknown>", "as unknown as Record<string, unknown>")

# LaudoAvaliacaoModal.tsx
replace_str("c:/Users/rafae/Documents/Projetos/Arbolia/app/src/components/inventory/LaudoAvaliacaoModal.tsx", ".filter(Boolean)", ".filter((l): l is string => Boolean(l))")

# verbatim imports
files = [
    "c:/Users/rafae/Documents/Projetos/Arbolia/app/src/components/inventory/Lightbox.tsx",
    "c:/Users/rafae/Documents/Projetos/Arbolia/app/src/components/inventory/PdfSidePanel.tsx",
    "c:/Users/rafae/Documents/Projetos/Arbolia/app/src/pages/Acervo.tsx"
]
for p in files:
    replace_str(p, "import { RichAttachment", "import type { RichAttachment")
    replace_str(p, "import {RichAttachment", "import type { RichAttachment")

replace_str("c:/Users/rafae/Documents/Projetos/Arbolia/app/src/services/api.ts", "import { DocumentData", "import type { DocumentData")

# TreeModal.tsx
replace_regex("c:/Users/rafae/Documents/Projetos/Arbolia/app/src/components/inventory/TreeModal.tsx", r"catch\s*\(\s*err\s*\)\s*\{", "catch (error) { const err = error as Error;")

# Employees.tsx
replace_regex("c:/Users/rafae/Documents/Projetos/Arbolia/app/src/pages/Employees.tsx", r"await updateEmployee\(", "await (updateEmployee as any)(")
replace_regex("c:/Users/rafae/Documents/Projetos/Arbolia/app/src/pages/Employees.tsx", r"await createEmployee\(", "await (createEmployee as any)(")

# authSlice.ts
replace_str("c:/Users/rafae/Documents/Projetos/Arbolia/app/src/store/slices/authSlice.ts", "email,\n          ...profileData", "id: newUid,\n          email,\n          ...profileData")

# dataSlice.ts
replace_regex("c:/Users/rafae/Documents/Projetos/Arbolia/app/src/store/slices/dataSlice.ts", r"as Record<string, unknown>", "as unknown as Record<string, unknown>")
replace_str("c:/Users/rafae/Documents/Projetos/Arbolia/app/src/store/slices/dataSlice.ts", "payload: tree as unknown as unknown as Record", "payload: tree as unknown as Record")

print("done")
