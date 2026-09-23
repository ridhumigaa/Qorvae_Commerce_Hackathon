import React, { useState, useEffect } from 'react';
import { 
  Terminal, Database, HardDrive, Cpu, Layers, Play, CheckCircle2, 
  AlertTriangle, RefreshCw, Table, Search, Activity, Code, ShieldAlert 
} from 'lucide-react';

export default function DbaConsole() {
  const [activeSubTab, setActiveSubTab] = useState('overview');
  const [dbaStatus, setDbaStatus] = useState(null);
  const [tablespaces, setTablespaces] = useState([]);
  const [indexes, setIndexes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Explain Plan State
  const [explainQuery, setExplainQuery] = useState(
    `SELECT customer_name, order_id, product_name, quantity, item_subtotal\nFROM vw_customer_order_history\nWHERE customer_id = 1\nORDER BY order_date DESC`
  );
  const [explainOutput, setExplainOutput] = useState(null);
  const [explaining, setExplaining] = useState(false);
  const [explainError, setExplainError] = useState(null);

  // SQL Query Console State
  const [customQuery, setCustomQuery] = useState(
    `SELECT * FROM vw_customer_metrics ORDER BY lifetime_spend DESC`
  );
  const [queryResult, setQueryResult] = useState(null);
  const [querying, setQuerying] = useState(false);
  const [queryError, setQueryError] = useState(null);

  useEffect(() => {
    fetchDbaData();
  }, []);

  const fetchDbaData = async () => {
    setLoading(true);
    try {
      const [resStatus, resTablespaces, resIndexes] = await Promise.all([
        fetch('/api/dba/status'),
        fetch('/api/dba/tablespaces'),
        fetch('/api/dba/indexes')
      ]);

      const [dataStatus, dataTablespaces, dataIndexes] = await Promise.all([
        resStatus.json(),
        resTablespaces.json(),
        resIndexes.json()
      ]);

      if (dataStatus.success) setDbaStatus(dataStatus);
      if (dataTablespaces.success) setTablespaces(dataTablespaces.data);
      if (dataIndexes.success) setIndexes(dataIndexes.data);
    } catch (err) {
      console.error('Error fetching DBA console data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunExplain = async () => {
    setExplaining(true);
    setExplainError(null);
    setExplainOutput(null);
    try {
      const res = await fetch('/api/dba/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: explainQuery })
      });
      const data = await res.json();
      if (data.success) {
        setExplainOutput(data.plan_output);
      } else {
        setExplainError(data.error);
      }
    } catch (err) {
      setExplainError(err.message);
    } finally {
      setExplaining(false);
    }
  };

  const handleRunQuery = async () => {
    setQuerying(true);
    setQueryError(null);
    setQueryResult(null);
    try {
      const res = await fetch('/api/dba/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: customQuery })
      });
      const data = await res.json();
      if (data.success) {
        setQueryResult(data);
      } else {
        setQueryError(data.error);
      }
    } catch (err) {
      setQueryError(err.message);
    } finally {
      setQuerying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-amber-600/90 text-white font-mono text-[11px] font-bold px-2 py-0.5 rounded">
              ENTERPRISE TELEMETRY
            </span>
            <span className="text-slate-400 font-mono text-xs">Oracle 21c Engine • PDB: XEPDB1</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight mt-1 text-white">Database Operations & Analytics</h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            Real-time storage allocation, tablespace health, query execution cost analysis, and data dictionary metrics.
          </p>
        </div>

        <button
          onClick={fetchDbaData}
          className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-700 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Sub-Tabs Navigation */}
      <div className="flex items-center space-x-1 border-b border-slate-200 overflow-x-auto pb-1">
        {[
          { id: 'overview', label: 'Storage & Tablespaces', icon: HardDrive },
          { id: 'explain', label: 'EXPLAIN PLAN (Cost Optimizer)', icon: Activity },
          { id: 'indexes', label: 'Index Health & Tuning', icon: Layers },
          { id: 'query', label: 'Live SQL Runner', icon: Terminal }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Sub-Tab 1: Overview & Tablespaces */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Oracle Instance Health Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Engine & Version</span>
                <Database className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-sm font-bold text-slate-900">Oracle Database 21c XE</div>
              <div className="text-[11px] text-slate-500 font-mono mt-1">Release 21.3.0.0.0</div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Container / PDB</span>
                <Cpu className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-sm font-bold text-slate-900">XEPDB1</div>
              <div className="text-[11px] text-emerald-600 font-bold mt-1">READ WRITE (Online)</div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Dedicated User</span>
                <Terminal className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-sm font-bold text-slate-900 font-mono">ECOMMERCE_DBA</div>
              <div className="text-[11px] text-slate-500 mt-1">Default: TS_ECOMM_DATA</div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Active Entities</span>
                <Layers className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-sm font-bold text-slate-900">6 Tables • 2 Views</div>
              <div className="text-[11px] text-slate-500 mt-1">1 PL/SQL Package</div>
            </div>
          </div>

          {/* Tablespace Storage Gauges */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Oracle Tablespace Storage Allocation</h3>
                <p className="text-xs text-slate-500">Separation of Data (<code className="font-mono text-amber-600">TS_ECOMM_DATA</code>) and Indexes (<code className="font-mono text-amber-600">TS_ECOMM_IDX</code>)</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tablespaces.map((ts) => {
                const pct = ts.PCT_USED || 0;
                return (
                  <div key={ts.TABLESPACE_NAME} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-slate-800">{ts.TABLESPACE_NAME}</span>
                      <span className="text-xs font-bold text-slate-600">{pct}%</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          pct > 85 ? 'bg-red-600' : pct > 60 ? 'bg-amber-500' : 'bg-emerald-600'
                        }`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      ></div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span>Used: <strong className="text-slate-700">{ts.USED_MB || 0} MB</strong></span>
                      <span>Total: <strong className="text-slate-700">{ts.TOTAL_MB || 0} MB</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Schema Table Record Counts */}
          {dbaStatus?.counts && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-extrabold text-base text-slate-900 mb-3">Live Schema Row Counts</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { name: 'CATEGORIES', count: dbaStatus.counts.CATEGORIES_COUNT },
                  { name: 'CUSTOMERS', count: dbaStatus.counts.CUSTOMERS_COUNT },
                  { name: 'PRODUCTS', count: dbaStatus.counts.PRODUCTS_COUNT },
                  { name: 'ORDERS', count: dbaStatus.counts.ORDERS_COUNT },
                  { name: 'ORDER_ITEMS', count: dbaStatus.counts.ORDER_ITEMS_COUNT },
                  { name: 'AUDIT_LOGS', count: dbaStatus.counts.AUDIT_LOGS_COUNT }
                ].map((item) => (
                  <div key={item.name} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                    <div className="font-mono text-xs font-semibold text-slate-600">{item.name}</div>
                    <div className="text-xl font-black text-slate-900 mt-1">{item.count}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sub-Tab 2: EXPLAIN PLAN Visualizer */}
      {activeSubTab === 'explain' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div>
            <h3 className="font-extrabold text-lg text-slate-900">Oracle Cost-Based Optimizer (CBO) EXPLAIN PLAN</h3>
            <p className="text-xs text-slate-500">
              Evaluates execution cost, access paths, and confirms whether <code className="font-mono text-amber-600">IDX_ORDERS_CUSTOMER_DATE</code> is utilized instead of costly full table scans.
            </p>
          </div>

          {/* Query Editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
              <span>SQL Query to Explain:</span>
              <span className="font-mono text-[11px] text-slate-400">Oracle Syntax Supported</span>
            </div>
            <textarea
              rows={4}
              value={explainQuery}
              onChange={(e) => setExplainQuery(e.target.value)}
              className="w-full font-mono text-xs p-3 bg-slate-900 text-slate-100 rounded-xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <div className="flex justify-end">
              <button
                disabled={explaining}
                onClick={handleRunExplain}
                className="flex items-center space-x-2 bg-gradient-to-r from-[#D4AF37] via-[#E8B923] to-[#F5C542] hover:from-[#C5A028] hover:to-[#E5B532] text-slate-950 text-xs font-bold px-4 py-2 rounded-lg shadow-md shadow-amber-500/20 transition disabled:opacity-50 active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{explaining ? 'Analyzing with DBMS_XPLAN...' : 'Generate Execution Plan'}</span>
              </button>
            </div>
          </div>

          {/* Explain Error */}
          {explainError && (
            <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-mono">
              {explainError}
            </div>
          )}

          {/* Output Display */}
          {explainOutput && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">DBMS_XPLAN Output:</h4>
              <div className="bg-slate-950 text-emerald-400 p-4 rounded-xl font-mono text-xs overflow-x-auto border border-slate-800 leading-tight">
                <pre>{explainOutput.join('\n')}</pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sub-Tab 3: Indexes & Tuning */}
      {activeSubTab === 'indexes' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div>
            <h3 className="font-extrabold text-lg text-slate-900">Oracle B-Tree Index Health & Coverage</h3>
            <p className="text-xs text-slate-500">
              Validates that foreign keys are indexed to prevent Oracle table lock contention and accelerate history queries.
            </p>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Table Name</th>
                  <th className="py-3 px-4">Index Name</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Rows</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {indexes.map((idx) => (
                  <tr key={idx.INDEX_NAME} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-800">{idx.TABLE_NAME}</td>
                    <td className="py-2.5 px-4 font-mono text-amber-700 font-semibold">{idx.INDEX_NAME}</td>
                    <td className="py-2.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        idx.UNIQUENESS === 'UNIQUE' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {idx.UNIQUENESS || 'NONUNIQUE'}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="flex items-center space-x-1 text-emerald-600 font-semibold text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{idx.STATUS || 'VALID'}</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-600">
                      {idx.NUM_ROWS ?? '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub-Tab 4: Live SQL Runner */}
      {activeSubTab === 'query' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div>
            <h3 className="font-extrabold text-lg text-slate-900">Live Oracle SQL Query Console</h3>
            <p className="text-xs text-slate-500">
              Direct read query runner to inspect database state, views (<code className="font-mono text-amber-600">VW_CUSTOMER_ORDER_HISTORY</code>, <code className="font-mono text-amber-600">VW_CUSTOMER_METRICS</code>), and dictionary objects.
            </p>
          </div>

          <div className="space-y-2">
            <textarea
              rows={4}
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              className="w-full font-mono text-xs p-3 bg-slate-900 text-slate-100 rounded-xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <div className="flex justify-end">
              <button
                disabled={querying}
                onClick={handleRunQuery}
                className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-lg shadow transition disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current text-amber-400" />
                <span>{querying ? 'Executing Query...' : 'Execute SELECT'}</span>
              </button>
            </div>
          </div>

          {queryError && (
            <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-mono">
              {queryError}
            </div>
          )}

          {queryResult && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Result: {queryResult.count} row(s) returned</span>
              </div>
              <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-96">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-100 sticky top-0 border-b border-slate-200 text-slate-600">
                    <tr>
                      {queryResult.columns.map((c) => (
                        <th key={c} className="py-2 px-3 whitespace-nowrap">{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {queryResult.rows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        {queryResult.columns.map((c) => (
                          <td key={c} className="py-2 px-3 whitespace-nowrap text-slate-700">
                            {row[c] !== null && row[c] !== undefined ? String(row[c]) : <span className="text-slate-300">NULL</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
