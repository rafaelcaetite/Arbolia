import type { Tree } from '../store/useAppStore';

export interface SortStrategy {
  sort(trees: Tree[]): Tree[];
}

export class SortByName implements SortStrategy {
  sort(trees: Tree[]): Tree[] {
    return [...trees].sort((a, b) => a.especie.localeCompare(b.especie));
  }
}

export class SortByHeight implements SortStrategy {
  sort(trees: Tree[]): Tree[] {
    return [...trees].sort((a, b) => b.altura - a.altura);
  }
}

export class SortByDate implements SortStrategy {
  sort(trees: Tree[]): Tree[] {
    return [...trees].sort((a, b) => new Date(b.data_cadastro).getTime() - new Date(a.data_cadastro).getTime());
  }
}

export class TreeSorter {
  private strategy: SortStrategy;

  constructor(strategy: SortStrategy) {
    this.strategy = strategy;
  }

  setStrategy(strategy: SortStrategy) {
    this.strategy = strategy;
  }

  sort(trees: Tree[]): Tree[] {
    return this.strategy.sort(trees);
  }
}
