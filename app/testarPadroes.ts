// Polyfill temporário para rodar o useAppStore.ts no terminal (Node.js)
if (typeof global !== 'undefined' && !('localStorage' in global)) {
  Object.defineProperty(global, 'localStorage', {
    value: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    },
    writable: true
  });
}

import type { Tree } from './src/store/useAppStore';

import { AppLogger } from './src/lib/logger';
import { NotificationFactory } from './src/utils/NotificationFactory';
import { TreeSorter, SortByName, SortByHeight } from './src/utils/TreeSorter';

console.log("=== TESTANDO PADRÕES DE PROJETO ===\n");

// 1. Testando Singleton (AppLogger)
console.log("1. SINGLETON:");
const logger1 = AppLogger.getInstance();
const logger2 = AppLogger.getInstance();
console.log("logger1 é exatamente a mesma instância que logger2?", logger1 === logger2);
logger1.log("Testando log via Singleton!");
console.log();

// 2. Testando Factory (NotificationFactory)
console.log("2. FACTORY:");
const notif = NotificationFactory.createNotification('aviso', 'notif-1', 'Aviso de Teste', 'Testando a fábrica de notificações.');
console.log("Notificação criada pela fábrica:", notif);
console.log();

// 3. Testando Strategy (TreeSorter)
console.log("3. STRATEGY:");
const mockTrees = [
  { especie: 'Ipê Amarelo', altura: 10 },
  { especie: 'Pau Brasil', altura: 15 },
  { especie: 'Quaresmeira', altura: 8 },
];

const sorter = new TreeSorter(new SortByName());
console.log("Ordenado por NOME (SortByName):");
console.log(sorter.sort(mockTrees as unknown as Tree[]).map(t => t.especie));

sorter.setStrategy(new SortByHeight());
console.log("Ordenado por ALTURA (SortByHeight):");
console.log(sorter.sort(mockTrees as unknown as Tree[]).map(t => `${t.especie} (${t.altura}m)`));

console.log("\n=== FIM DOS TESTES ===");
