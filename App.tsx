
import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { PurchaseRecord, Category } from './types.ts';
import { INITIAL_BASES, CATEGORIES, APP_CONFIG } from './constants.ts';
import { Input, Select, DatePicker } from './components/Input.tsx';
import { Modal } from './components/Modal.tsx';
import { ContextMenu } from './components/ContextMenu.tsx';

// Configuração do Supabase
const supabaseUrl = 'https://teca-admin-supabase.ly7t0m.easypanel.host';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE';

const supabase = createClient(supabaseUrl, supabaseKey, {
  db: {
    schema: 'teca_gestao_de_contratos'
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});

const App: React.FC = () => {
  const [user, setUser] = useState<{ id: string; login: string } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginForm, setLoginForm] = useState({ login: '', senha: '' });
  const [loginError, setLoginError] = useState('');

  const [records, setRecords] = useState<PurchaseRecord[]>([]);
  const [loading, setLoading] = useState(false);
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

  const [selectedBase, setSelectedBase] = useState<string | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('wfs_session');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setAuthLoading(false);
  }, []);

  useEffect(() => {
    if (user) {
      fetchRecords();
    }
  }, [user]);

  const handleError = (error: any) => {
    console.error('Erro detectado:', error);
    let message = error.message || 'Erro desconhecido';

    if (error.code === '42501') {
      message = "PERMISSÃO NEGADA: O Supabase bloqueou o acesso. \n\nSOLUÇÃO: Execute o script SQL de 'GRANT USAGE' e 'CREATE POLICY' no seu painel SQL Editor do Supabase para o schema 'teca_gestao_de_contratos'.";
    } else if (error.message?.includes('invalid input syntax for type uuid')) {
      message = "CONFLITO DE ID: A tabela espera um UUID mas recebeu um texto/número. Verifique a estrutura da coluna user_id.";
    }

    alert(message);
  };

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('purchase_records')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (error: any) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setAuthLoading(true);

    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, login')
        .eq('login', loginForm.login)
        .eq('senha', loginForm.senha)
        .single();

      if (error || !data) {
        setLoginError('Credenciais inválidas.');
      } else {
        setUser(data);
        localStorage.setItem('wfs_session', JSON.stringify(data));
      }
    } catch (err: any) {
      setLoginError('Falha na conexão com o servidor.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('wfs_session');
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
    if (!formData.fornecedor || !formData.categoria || !formData.base || !formData.valor || !formData.vencimento || !user) return;

    const recordPayload = {
      fornecedor: formData.fornecedor,
      categoria: formData.categoria,
      base: formData.base,
      documento: formData.documento || '',
      descricao: formData.descricao || '',
      pedido: formData.pedido || '',
      valor: Number(formData.valor),
      vencimento: formData.vencimento,
      user_id: String(user.id)
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
      handleError(error);
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
      handleError(error);
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

  const filteredRecords = useMemo(() => {
    if (!selectedBase) return records;
    return records.filter(r => r.base === selectedBase);
  }, [records, selectedBase]);

  const totalGeral = records.reduce((acc, curr) => acc + Number(curr.valor), 0);
  const formatCurrency = (val: number) =>
    val.toLocaleString(APP_CONFIG.LOCALE, { style: 'currency', currency: APP_CONFIG.CURRENCY });

  if (authLoading && !user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-slate-700 border-t-indigo-500 rounded-full animate-spin"></div>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">WFS Sincronizando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-[420px] bg-white border border-slate-200 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] overflow-hidden">
          <div className="p-10 text-center border-b border-slate-100 bg-slate-50/50">
            <div className="w-14 h-14 bg-slate-900 flex items-center justify-center text-white shadow-xl mx-auto mb-6">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-2">Login Corporativo</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">SISTEMA DE GESTÃO WFS</p>
          </div>

          <form onSubmit={handleLogin} className="p-10 space-y-6">
            {loginError && <div className="p-4 bg-amber-50 border-l-4 border-amber-500 text-amber-800 text-[10px] font-bold uppercase">{loginError}</div>}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Login</label>
              <input
                type="text"
                required
                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 text-slate-900 font-bold text-[11px] focus:outline-none focus:border-indigo-500 transition-all"
                value={loginForm.login}
                onChange={e => setLoginForm(f => ({ ...f, login: e.target.value }))}
                placeholder="Usuário"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Senha</label>
              <input
                type="password"
                required
                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 text-slate-900 font-bold text-[11px] focus:outline-none focus:border-indigo-500 transition-all"
                value={loginForm.senha}
                onChange={e => setLoginForm(f => ({ ...f, senha: e.target.value }))}
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={authLoading}
              className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 disabled:opacity-50 mt-4"
            >
              {authLoading ? 'Acessando...' : 'Autenticar'}
            </button>
          </form>
        </div>
      </div>
    );
  }

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

          <div className="flex items-center gap-6">
            <div className="text-right border-r border-slate-100 pr-6">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Total Lançado</p>
              <p className="text-xl font-extrabold text-slate-900">{formatCurrency(totalGeral)}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Usuário</p>
                <p className="text-xs font-black text-slate-900 uppercase">{user.login}</p>
              </div>
              <button onClick={handleLogout} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-8 py-10 space-y-10">
        <section className="flex flex-col xl:flex-row gap-6">
          <div
            onClick={() => setSelectedBase(null)}
            className={`w-full xl:w-[350px] shrink-0 p-7 border shadow-sm border-t-4 flex flex-col justify-center cursor-pointer transition-all active:scale-95
              ${selectedBase === null ? 'bg-slate-900 border-slate-900 border-t-slate-800' : 'bg-white border-slate-200 border-t-slate-900 hover:border-slate-300'}
            `}
          >
            <p className={`text-[11px] font-bold uppercase tracking-widest mb-1 ${selectedBase === null ? 'text-slate-400' : 'text-slate-400'}`}>Custo Global Consolidado</p>
            <p className={`text-3xl font-extrabold ${selectedBase === null ? 'text-white' : 'text-slate-900'}`}>{formatCurrency(totalGeral)}</p>
          </div>

          <div className="flex-1 overflow-x-auto pb-2">
            <div className="flex gap-4 min-w-max">
              {summaries.map((s) => (
                <div
                  key={s.base}
                  onClick={() => setSelectedBase(selectedBase === s.base ? null : s.base)}
                  className={`w-[260px] p-6 border shadow-sm border-t-4 cursor-pointer transition-all active:scale-95
                    ${selectedBase === s.base ? 'bg-indigo-600 border-indigo-600 border-t-indigo-400' : 'bg-white border-slate-200 border-t-indigo-500 hover:border-indigo-200'}
                  `}
                >
                  <div className="flex justify-between items-center mb-3">
                    <span className={`w-8 h-8 flex items-center justify-center font-black text-[10px] rounded-sm ${selectedBase === s.base ? 'bg-indigo-500 text-white' : 'bg-slate-50 text-slate-600'}`}>{s.base}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-tight ${selectedBase === s.base ? 'text-indigo-200' : 'text-slate-400'}`}>{s.count} lançamentos</span>
                  </div>
                  <p className={`text-xl font-extrabold ${selectedBase === s.base ? 'text-white' : 'text-slate-900'}`}>{formatCurrency(s.total)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
          <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight uppercase">Registros Operacionais</h2>
              {selectedBase && (
                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase rounded-full">
                  Filtrado por: {selectedBase}
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto">

              <button onClick={() => handleOpenModal()} className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-6 shadow-lg active:scale-95 flex items-center gap-2 whitespace-nowrap">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Novo Registro
              </button>
            </div>
          </div>

          <div className="overflow-x-auto relative">
            {loading && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
              </div>
            )}
            <table className="w-full text-center border-collapse min-w-[1200px]">
              <thead>
                <tr className="bg-[#0F172A] text-white text-[10px] uppercase font-black tracking-widest">
                  <th className="px-6 py-5">FORNECEDOR</th>
                  <th className="px-6 py-5">CATEGORIA</th>
                  <th className="px-6 py-5">BASE</th>
                  <th className="px-6 py-5">DOCUMENTO</th>
                  <th className="px-6 py-5">PEDIDO</th>
                  <th className="px-6 py-5">VALOR</th>
                  <th className="px-6 py-5">VENCIMENTO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.length === 0 && !loading ? (
                  <tr><td colSpan={7} className="py-20 text-slate-300 font-bold uppercase tracking-widest">Nenhum registro encontrado</td></tr>
                ) : (
                  filteredRecords.map((record) => (
                    <tr key={record.id} onContextMenu={(e) => handleContextMenu(e, record.id!)} className="hover:bg-slate-50 transition-all cursor-context-menu">
                      <td className="px-6 py-6 text-[10px] text-black font-bold uppercase">{record.fornecedor}</td>
                      <td className="px-6 py-6 text-[10px] text-black font-bold uppercase">{record.categoria}</td>
                      <td className="px-6 py-6 text-[10px] text-black font-bold uppercase">{record.base}</td>
                      <td className="px-6 py-6 text-[10px] text-black font-bold uppercase">{record.documento || '---'}</td>
                      <td className="px-6 py-6 text-[10px] text-black font-bold uppercase">#{record.pedido || '---'}</td>
                      <td className="px-6 py-6 text-[10px] text-black font-bold uppercase">{formatCurrency(Number(record.valor))}</td>
                      <td className="px-6 py-6 text-[10px] text-black font-bold uppercase">{new Date(record.vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {contextMenu && <ContextMenu x={contextMenu.x} y={contextMenu.y} onClose={() => setContextMenu(null)} onEdit={() => handleOpenModal(records.find(r => r.id === contextMenu.recordId))} onDelete={() => { setRecordToDelete(contextMenu.recordId); setIsDeleteModalOpen(true); }} />}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? "Editar Registro" : "Novo Lançamento"}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input label="FORNECEDOR" value={formData.fornecedor} onChange={e => setFormData(f => ({ ...f, fornecedor: e.target.value }))} required />
          <div className="grid grid-cols-2 gap-6">
            <Select label="CATEGORIA" options={CATEGORIES} value={formData.categoria} onChange={e => setFormData(f => ({ ...f, categoria: e.target.value as Category }))} required />
            <Select label="BASE" options={INITIAL_BASES} value={formData.base} onChange={e => setFormData(f => ({ ...f, base: e.target.value }))} required />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <Input label="Documento" value={formData.documento} onChange={e => setFormData(f => ({ ...f, documento: e.target.value }))} />
            <Input label="Pedido" maxLength={6} value={formData.pedido} onChange={e => setFormData(f => ({ ...f, pedido: e.target.value.replace(/\D/g, '') }))} />
          </div>
          <Input label="Descrição" value={formData.descricao} onChange={e => setFormData(f => ({ ...f, descricao: e.target.value }))} />
          <div className="grid grid-cols-2 gap-6">
            <Input label="Valor" type="number" step="0.01" prefix="R$" value={formData.valor || ''} onChange={e => setFormData(f => ({ ...f, valor: Number(e.target.value) }))} required />
            <DatePicker label="Vencimento" value={formData.vencimento} onChange={e => setFormData(f => ({ ...f, vencimento: e.target.value }))} required />
          </div>
          <button type="submit" className="w-full bg-slate-900 text-white font-black py-4 uppercase tracking-widest shadow-xl active:scale-95">Salvar Registro</button>
        </form>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirmar Exclusão">
        <div className="py-6 text-center">
          <p className="text-slate-600 font-medium mb-10">Deseja apagar este registro permanentemente?</p>
          <div className="flex gap-4">
            <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 text-slate-500 font-bold">Cancelar</button>
            <button onClick={confirmDelete} className="flex-1 bg-red-600 text-white font-black py-4 active:scale-95 shadow-xl shadow-red-100">Sim, Apagar</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default App;
