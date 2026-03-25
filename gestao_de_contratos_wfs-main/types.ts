
export enum Category {
  LOCACAO = 'LOCAÇÃO',
  MATERIAL = 'MATERIAL',
  SERVICO = 'SERVIÇO',
  HORA_EXTRA = 'HORA EXTRA'
}

export type BaseLocation = 
  | 'PHB' | 'THE' | 'TFF' | 'SLZ' | 'PMW' | 'BEL' 
  | 'BVB' | 'TBT' | 'JPA' | 'REC' | 'SSA' | 'NAT' | 'FOR' 
  | string;

export interface PurchaseRecord {
  id: string;
  fornecedor: string;
  categoria: Category;
  base: BaseLocation;
  documento: string; // N. Nota/Boleto/Fatura
  descricao: string;
  pedido: string; // 6 digits
  valor: number;
  vencimento: string;
  createdAt: string;
}

export interface SpendingSummary {
  base: string;
  total: number;
  count: number;
}
