import React, { useState } from 'react';
import { SalesAnalytics } from './SalesAnalytics';
import { ProfitMarginMatrix } from './ProfitMarginMatrix';
import { FlavorAndCategoryDeepDive } from './FlavorAndCategoryDeepDive';
import { InventoryRestockEngine } from './InventoryRestockEngine';
import { ProductPhaseOutManager } from './ProductPhaseOutManager';
import { TimeSlotAndPromotions } from './TimeSlotAndPromotions';
import { StudentLoyaltyManager } from './StudentLoyaltyManager';
import { FirebaseCloudManager } from './FirebaseCloudManager';
import {
  TrendingUp,
  Percent,
  UtensilsCrossed,
  PackageCheck,
  TrendingDown,
  Clock,
  Users,
  Database
} from 'lucide-react';

export const DashboardRoot: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<
    'sales' | 'margin' | 'flavor' | 'restock' | 'phaseout' | 'timeslot' | 'loyalty' | 'firebase'
  >('sales');

  const subTabs = [
    { key: 'sales', label: '銷售趨勢與損耗分析', icon: <TrendingUp className="w-4 h-4" /> },
    { key: 'margin', label: '毛利率與產品組合', icon: <Percent className="w-4 h-4" /> },
    { key: 'flavor', label: '食物口味與文具深研', icon: <UtensilsCrossed className="w-4 h-4" /> },
    { key: 'restock', label: '智慧進貨與自動補貨', icon: <PackageCheck className="w-4 h-4" /> },
    { key: 'phaseout', label: '滯銷低毛利淘汰下架', icon: <TrendingDown className="w-4 h-4" /> },
    { key: 'timeslot', label: '時段輪播與節日限定', icon: <Clock className="w-4 h-4" /> },
    { key: 'loyalty', label: '學生會員與消費積點', icon: <Users className="w-4 h-4" /> },
    { key: 'firebase', label: 'Firebase & Vercel 雲端同步', icon: <Database className="w-4 h-4 text-amber-500" /> }
  ] as const;

  return (
    <div className="max-w-7xl mx-auto px-4 py-5 space-y-5">
      {/* Subtab Navigation Bar */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-slate-200">
        {subTabs.map(tab => {
          const isActive = activeSubTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveSubTab(tab.key)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      {activeSubTab === 'sales' && <SalesAnalytics />}
      {activeSubTab === 'margin' && <ProfitMarginMatrix />}
      {activeSubTab === 'flavor' && <FlavorAndCategoryDeepDive />}
      {activeSubTab === 'restock' && <InventoryRestockEngine />}
      {activeSubTab === 'phaseout' && <ProductPhaseOutManager />}
      {activeSubTab === 'timeslot' && <TimeSlotAndPromotions />}
      {activeSubTab === 'loyalty' && <StudentLoyaltyManager />}
      {activeSubTab === 'firebase' && <FirebaseCloudManager />}
    </div>
  );
};
