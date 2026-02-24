
export enum Category {
  LOCACAO = 'LOCAÇÃO',
  MATERIAL = 'MATERIAL',
  SERVICO = 'SERVIÇO',
  HORA_EXTRA = 'HORA EXTRA'
}

export type BaseLocation = string;

export interface PurchaseRecord {
  id?: string;
  user_id?: string;
  fornecedor: string;
  categoria: Category;
  base: BaseLocation;
  documento: string;
  descricao: string;
  pedido: string;
  valor: number;
  vencimento: string;
  created_at?: string;
}
