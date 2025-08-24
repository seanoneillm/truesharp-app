export type FilterFunction = (bets: any[]) => any[];

export interface SavedFilter {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  filters: FilterFunction[];
}