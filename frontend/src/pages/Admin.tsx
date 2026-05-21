import React from 'react';
import { ShieldAlert, Users, Server, Database, TrendingUp, Cpu, HardDrive } from 'lucide-react';

export const Admin: React.FC = () => {
  // English-only mode
  const lang = 'en';

  const metrics = [
    { label: lang === 'en' ? 'Gross Sales Volume' : 'إجمالي المبيعات والتحصيلات', value: '$84,250.00', icon: TrendingUp, change: '+18.5% weekly' },
    { label: lang === 'en' ? 'Active VIP Travelers' : 'المسافرين النشطين حالياً', value: '412', icon: Users, change: '+4.2% weekly' },
    { label: lang === 'en' ? 'Database Clusters' : 'خوادم قواعد البيانات', value: '3 Active Nodes', icon: Database, change: '100% Replication' }
  ];

  const adminBookings = [
    { id: "b-901", ref: "KMT-2026-X8Y9Z", customer: "Amir Mansour", type: "TOUR", cost: 350.00, gateway: "PAYMOB", status: "CONFIRMED" },
    { id: "b-902", ref: "KMT-2026-A2B3C", customer: "Sophia Laurent", type: "HOTEL", cost: 1650.00, gateway: "STRIPE", status: "CONFIRMED" },
    { id: "b-903", ref: "KMT-2026-N9M1K", customer: "John Doe", type: "CRUISE", cost: 3200.00, gateway: "STRIPE", status: "CONFIRMED" }
  ];

  const systemStatus = [
    { node: "Node-Cairo-1", cpu: "14%", ram: "4.2 GB / 8 GB", status: "Healthy" },
    { node: "Node-Giza-2", cpu: "19%", ram: "3.8 GB / 8 GB", status: "Healthy" },
    { node: "Redis-Cache-Primary", cpu: "2%", ram: "0.9 GB / 4 GB", status: "Healthy" }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 font-sans">
      
      {/* Header alert indicator */}
      <div className="glass-panel p-6 mb-8 border-rose-950/40 bg-rose-950/20 text-rose-300 flex items-center gap-4">
        <ShieldAlert className="h-10 w-10 text-rose-400 shrink-0" />
        <div>
          <h2 className="text-lg font-serif font-bold">{lang === 'en' ? 'Kemet Royal Security Shield Active' : 'درع الحماية الملكي لكيميت نشط'}</h2>
          <p className="text-[11px] text-rose-400/90 mt-0.5">
            {lang === 'en'
              ? 'Encryption keys rotated. Double JWT token verification enforcing safe cookie routing in all endpoints.'
              : 'تم تدوير مفاتيح التشفير بنجاح. بروتوكول المصادقة المزدوج يحمي جميع الطلبات والمخازن.'}
          </p>
        </div>
      </div>

      {/* Metrics widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {metrics.map((m, i) => {
          const Icon = m.icon;
          return (
            <div key={i} className="glass-panel p-6 space-y-4 hover:border-gold/30 transition-colors">
              <div className="flex justify-between items-center text-sand-dark">
                <span className="text-[10px] text-gold uppercase tracking-wider font-bold">{m.label}</span>
                <Icon className="h-5 w-5 text-gold" />
              </div>
              <div>
                <strong className="text-3xl text-sand-light font-serif">{m.value}</strong>
                <span className="text-[10px] text-emerald-400 block mt-1 font-semibold">{m.change}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recent global reservations log */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 overflow-x-auto">
            <h3 className="text-lg font-serif font-bold text-sand-light border-b border-gold/10 pb-3 mb-4">
              {lang === 'en' ? 'Recent Transactions & Bookings' : 'العمليات والحجوزات الأخيرة'}
            </h3>

            <table className="w-full text-left rtl:text-right text-xs">
              <thead>
                <tr className="text-gold border-b border-gold/15 uppercase tracking-wider">
                  <th className="pb-3">{lang === 'en' ? 'Reference' : 'الرقم المرجعي'}</th>
                  <th className="pb-3">{lang === 'en' ? 'Customer' : 'العميل'}</th>
                  <th className="pb-3">{lang === 'en' ? 'Type' : 'النوع'}</th>
                  <th className="pb-3">{lang === 'en' ? 'Amount' : 'المبلغ'}</th>
                  <th className="pb-3">{lang === 'en' ? 'Status' : 'الحالة'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold/10 text-sand-light">
                {adminBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-gold/5 transition-colors">
                    <td className="py-3 uppercase font-bold text-gold">{b.ref}</td>
                    <td className="py-3">{b.customer}</td>
                    <td className="py-3">
                      <span className="bg-gold/10 border border-gold/25 text-gold text-[9px] px-2 py-0.5 rounded uppercase font-bold">{b.type}</span>
                    </td>
                    <td className="py-3 font-serif font-semibold">${b.cost.toFixed(2)}</td>
                    <td className="py-3 text-emerald-400 font-bold">{b.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Real-time server statuses */}
        <div className="space-y-6">
          <div className="glass-panel p-6 space-y-4">
            <h3 className="text-lg font-serif font-bold text-sand-light border-b border-gold/10 pb-3 flex items-center gap-1.5">
              <Server className="h-5 w-5 text-gold" />
              <span>{lang === 'en' ? 'Node Monitoring' : 'مراقبة الخوادم'}</span>
            </h3>

            <div className="space-y-4 text-xs">
              {systemStatus.map((node) => (
                <div key={node.node} className="bg-nile border border-gold/10 p-3 rounded space-y-2">
                  <div className="flex justify-between font-bold text-sand-light">
                    <span>{node.node}</span>
                    <span className="text-emerald-400">{node.status}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-sand-dark">
                    <span className="flex items-center gap-1"><Cpu className="h-3 w-3 text-gold" /> CPU: {node.cpu}</span>
                    <span className="flex items-center gap-1"><HardDrive className="h-3 w-3 text-gold" /> RAM: {node.ram}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
export default Admin;
