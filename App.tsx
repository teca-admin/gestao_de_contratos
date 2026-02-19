import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { PurchaseRecord, Category } from './types.ts';
import { INITIAL_BASES, CATEGORIES, APP_CONFIG } from './constants.ts';
import { Input, Select, DatePicker } from './components/Input.tsx';
import { Modal } from './components/Modal.tsx';
import { ContextMenu } from './components/ContextMenu.tsx';

const supabaseUrl = 'https://vxhylzrertszbneyfzov.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4aHlsenJlcnRzemJuZXlmem92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMjY4NTUsImV4cCI6MjA4NTcwMjg1NX0.EqHQmzY9zWxMmi-UDRE3dvfIs0XGBJtOIHwSqsZOhxI';
const supabase = createClient(supabaseUrl, supabaseKey);

const App: React.FC = () => {
  const [records, setRecords] = useState<PurchaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, recordId: string } | null>(null);

  const [formData, setFormData] = useState<Partial<PurchaseRecord>>({
    fornecedor: '',
    categoria: undefined,
    base: '',
    documento: '',
    descricao: '',
    pedido: '',
    valor: 0,
    vencimento: ''
  });

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('purchase_records')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (record?: PurchaseRecord) => {
    if (record) {
      setIsEditing(true);
      setFormData(record);
    } else {
      setIsEditing(false);
      setFormData({ fornecedor: '', categoria: undefined, base: '', documento: '', descricao: '', pedido: '', valor: 0, vencimento: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fornecedor || !formData.categoria || !formData.base || !formData.valor || !formData.vencimento) return;

    const recordPayload = {
      fornecedor: formData.fornecedor,
      categoria: formData.categoria,
      base: formData.base,
      documento: formData.documento || '',
      descricao: formData.descricao || '',
      pedido: formData.pedido || '',
      valor: Number(formData.valor),
      vencimento: formData.vencimento
    };

    try {
      if (isEditing && formData.id) {
        const { data, error } = await supabase
          .from('purchase_records')
          .update(recordPayload)
          .eq('id', formData.id)
          .select();
        if (error) throw error;
        if (data) setRecords(prev => prev.map(r => r.id === formData.id ? data[0] : r));
      } else {
        const { data, error } = await supabase
          .from('purchase_records')
          .insert([recordPayload])
          .select();
        if (error) throw error;
        if (data) setRecords(prev => [data[0], ...prev]);
      }
      setIsModalOpen(false);
    } catch (error: any) {
      alert('Erro ao salvar: ' + error.message);
    }
  };

  const confirmDelete = async () => {
    if (!recordToDelete) return;
    try {
      const { error } = await supabase
        .from('purchase_records')
        .delete()
        .eq('id', recordToDelete);
      if (error) throw error;
      setRecords(prev => prev.filter(r => r.id !== recordToDelete));
      setIsDeleteModalOpen(false);
    } catch (error: any) {
      alert('Erro ao excluir: ' + error.message);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, recordId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, recordId });
  };

  const summaries = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    records.forEach(r => {
      const current = map.get(r.base) || { total: 0, count: 0 };
      map.set(r.base, { total: current.total + Number(r.valor), count: current.count + 1 });
    });
    return Array.from(map.entries()).map(([base, stats]) => ({ base, ...stats }));
  }, [records]);

  const totalGeral = records.reduce((acc, curr) => acc + Number(curr.valor), 0);
  const formatCurrency = (val: number) => 
    val.toLocaleString(APP_CONFIG.LOCALE, { style: 'currency', currency: APP_CONFIG.CURRENCY });

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-slate-900 flex items-center justify-center text-white shadow-xl">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight leading-none">Controle de Contratos</h1>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 block">WFS CORPORATE</span>
            </div>
          </div>
          <div className="flex items-center gap-10">
            <div className="hidden lg:flex items-center gap-6">
              <div className="text-right border-r border-slate-100 pr-6">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Budget Alocado</p>
                <p className="text-xl font-extrabold text-slate-900">{formatCurrency(totalGeral)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Volume Operacional</p>
                <p className="text-xl font-extrabold text-indigo-600">
                  {loading ? '...' : records.length} <span className="text-[11px] font-medium text-slate-400">lançamentos</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-8 py-10 space-y-10">
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <div className="bg-white p-7 border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className="text-[11px] font-bold text-emerald-500 bg-emerald-50 px-2 py-1 uppercase">Monitoramento Real-time</span>
            </div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Custo Global Consolidade</p>
            <p className="text-3xl font-extrabold text-slate-900">{formatCurrency(totalGeral)}</p>
          </div>
          {summaries.map((s) => (
            <div key={s.base} className="bg-white p-7 border border-slate-200 shadow-sm hover:shadow-md transition-shadow border-t-4 border-t-indigo-500">
              <div className="flex justify-between items-center mb-4">
                <span className="w-10 h-10 bg-slate-50 flex items-center justify-center font-black text-slate-600 text-[11px]">{s.base}</span>
                <span className="text-[11px] font-bold text-slate-400 uppercase">{s.count} transações</span>
              </div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Unidade Operacional</p>
              <p className="text-2xl font-extrabold text-slate-900">{formatCurrency(s.total)}</p>
            </div>
          ))}
        </section>

        <section className="bg-white border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
          <div className="p-8 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Registro Geral de Ativos</h2>
              <p className="text-[11px] text-slate-400 font-medium mt-1">Clique com o botão direito em uma linha para editar ou excluir.</p>
            </div>
            <button onClick={() => handleOpenModal()} className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-6 transition-all shadow-xl shadow-slate-200 flex items-center gap-2 active:scale-95">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Novo Lançamento
            </button>
          </div>

          <div className="overflow-x-auto relative min-h-[400px]">
            {loading && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                   <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sincronizando dados...</p>
                </div>
              </div>
            )}
            <table className="w-full text-center border-collapse table-fixed min-w-[1200px]">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[11px] uppercase font-black tracking-widest align-middle">
                  <th className="px-6 py-5 w-[16%]">FORNECEDOR</th>
                  <th className="px-6 py-5 w-[12%]">CATEGORIA</th>
                  <th className="px-6 py-5 w-[12%]">BASE</th>
                  <th className="px-6 py-5 w-[12%]">DOCUMENTO</th>
                  <th className="px-6 py-5 w-[12%]">DESCRIÇÃO</th>
                  <th className="px-6 py-5 w-[12%]">PEDIDO</th>
                  <th className="px-6 py-5 w-[12%]">VALOR</th>
                  <th className="px-6 py-5 w-[12%]">VENCIMENTO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={8} className="px-8 py-32 text-center opacity-30">
                       <p className="text-[11px] font-bold">Aguardando novos lançamentos operacionais WFS</p>
                    </td>
                  </tr>
                ) : (
                  records.map((record) => (
                    <tr key={record.id} onContextMenu={(e) => handleContextMenu(e, record.id)} className="hover:bg-indigo-50/30 transition-all cursor-context-menu">
                      <td className="px-6 py-6 font-bold text-slate-900 text-[11px] uppercase tracking-tight truncate">{record.fornecedor}</td>
                      <td className="px-6 py-6">
                        <span className={`text-[11px] font-black px-2.5 py-1 uppercase tracking-widest border inline-block w-full text-center
                          ${record.categoria === Category.LOCACAO ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : ''}
                          ${record.categoria === Category.MATERIAL ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : ''}
                          ${record.categoria === Category.SERVICO ? 'bg-amber-50 text-amber-700 border-amber-100' : ''}
                          ${record.categoria === Category.HORA_EXTRA ? 'bg-rose-50 text-rose-700 border-rose-100' : ''}
                        `}>
                          {record.categoria}
                        </span>
                      </td>
                      <td className="px-6 py-6"><span className="inline-flex px-3 py-1 bg-slate-900 text-white text-[11px] font-black tracking-tighter">{record.base}</span></td>
                      <td className="px-6 py-6 text-[11px] font-bold text-slate-500">{record.documento || '---'}</td>
                      <td className="px-6 py-6 text-[11px] text-slate-500 italic line-clamp-2" title={record.descricao}>{record.descricao || 'N/A'}</td>
                      <td className="px-6 py-6"><span className="text-[11px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-sm">#{record.pedido || '---'}</span></td>
                      <td className="px-6 py-6 font-black text-slate-900">{formatCurrency(Number(record.valor))}</td>
                      <td className="px-6 py-6 font-bold text-slate-900">{new Date(record.vencimento + 'T00:00:00').toLocaleDateString(APP_CONFIG.LOCALE)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {contextMenu && <ContextMenu x={contextMenu.x} y={contextMenu.y} onClose={() => setContextMenu(null)} onEdit={() => handleOpenModal(records.find(r => r.id === contextMenu.recordId))} onDelete={() => { setRecordToDelete(contextMenu.recordId); setIsDeleteModalOpen(true); }} />}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? "Editar Registro Analítico" : "Novo Registro Analítico - WFS"}>
        <form onSubmit={handleSubmit} className="space-y-8">
          <Input label="FORNECEDOR" value={formData.fornecedor} onChange={e => setFormData(f => ({ ...f, fornecedor: e.target.value }))} placeholder="Razão Social" required />
          <div className="grid grid-cols-2 gap-6">
            <Select label="CATEGORIA" options={CATEGORIES} value={formData.categoria} onChange={e => setFormData(f => ({ ...f, categoria: e.target.value as Category }))} required />
            <Select label="BASE" options={INITIAL_BASES} value={formData.base} onChange={e => setFormData(f => ({ ...f, base: e.target.value }))} required />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <Input label="Referência Documento" value={formData.documento} onChange={e => setFormData(f => ({ ...f, documento: e.target.value }))} />
            <Input label="PEDIDO" maxLength={6} value={formData.pedido} onChange={e => setFormData(f => ({ ...f, pedido: e.target.value.replace(/\D/g, '') }))} />
          </div>
          <Input label="DESCRIÇÃO" value={formData.descricao} onChange={e => setFormData(f => ({ ...f, descricao: e.target.value }))} />
          <div className="grid grid-cols-2 gap-6">
            <Input label="VALOR" type="number" prefix="R$" value={formData.valor || ''} onChange={e => setFormData(f => ({ ...f, valor: Number(e.target.value) }))} required />
            <DatePicker label="VENCIMENTO" value={formData.vencimento} onChange={e => setFormData(f => ({ ...f, vencimento: e.target.value }))} required />
          </div>
          <div className="pt-6 flex gap-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 text-slate-500 font-bold py-4 hover:bg-slate-50 border border-transparent">Descartar</button>
            <button type="submit" className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 px-6 shadow-xl shadow-indigo-100 text-lg active:scale-95">Confirmar</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirmar Exclusão">
        <div className="py-4 text-center">
          <p className="text-slate-600 font-medium mb-8">Deseja apagar este registro permanentemente?</p>
          <div className="flex gap-4">
            <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 text-slate-500 font-bold py-4">Cancelar</button>
            <button onClick={confirmDelete} className="flex-1 bg-red-600 text-white font-black py-4 shadow-xl shadow-red-100 active:scale-95">Apagar</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default App;