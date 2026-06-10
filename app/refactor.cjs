const fs = require('fs');
const content = fs.readFileSync('src/store/useAppStore.ts', 'utf8');

const targetStr = 'const getLocalArray = (key: string): string[] => {';
const index = content.indexOf(targetStr);

if (index !== -1) {
  const newContent = content.substring(0, index) + `import { createAuthSlice } from './slices/authSlice';
import { createUISlice } from './slices/uiSlice';
import { createDataSlice } from './slices/dataSlice';

export const useAppStore = create<AppState>((set, get, api) => ({
  ...createAuthSlice(set, get, api),
  ...createUISlice(set, get, api),
  ...createDataSlice(set, get, api),
}));
`;
  fs.writeFileSync('src/store/useAppStore.ts', newContent);
  console.log('Success');
} else {
  console.log('Target string not found');
}
