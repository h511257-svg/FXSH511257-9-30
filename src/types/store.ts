export type ProductCategory = 'food_hot' | 'food_bakery' | 'beverage' | 'stationery' | 'seasonal';

export type TimeSlot = 'breakfast' | 'lunch' | 'snack' | 'exam_period' | 'all_day';

export type FoodFlavor = 'black_pepper' | 'honey_sauce' | 'original' | 'chocolate' | 'milk_butter' | 'strawberry' | 'matcha' | 'cheese' | 'bbq' | 'none';

export type StationerySpec = {
  type: 'pen' | 'correction_tape' | 'pencil_2b' | 'eraser' | 'notebook' | 'ruler' | 'other';
  tipSize?: '0.38mm' | '0.5mm' | '0.7mm' | '2B';
  inkColor?: 'black' | 'blue' | 'red' | 'assorted';
};

export interface Product {
  id: string;
  barcode?: string;     // 國際標準 EAN-13 商品條碼 (e.g. 4710088010015)
  name: string;
  category: ProductCategory;
  price: number;        // 學生特惠售價 (NTD)
  cost: number;         // 進貨成本 (NTD)
  stock: number;        // 目前架上庫存
  reorderThreshold: number; // 自動補貨警戒門檻
  suggestedRestockQty: number; // 建議自動補貨量
  dailyAvgSales: number;// 日均銷售量
  totalSold: number;    // 累計銷售數量
  shelfLifeDays: number;// 保存期限 (天)
  wastageCount: number; // 累計損耗/過期量
  imageUrl?: string;
  iconName: string;
  timeSlotAffinity: TimeSlot[]; // 推薦時段
  flavor?: FoodFlavor;  // 食物口味
  stationerySpec?: StationerySpec; // 文具規格
  isSeasonal?: boolean; // 節日/限定商品
  seasonalTag?: string; // e.g. "中秋限定", "段考應援", "校慶特選"
  isDelisted?: boolean; // 是否已淘汰下架
  isClearance?: boolean;// 是否處於清倉出清狀態
  clearancePrice?: number;
  description: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type PaymentMethod = 'easycard' | 'ipass' | 'linepay' | 'taiwanpay' | 'cash' | 'points';

export interface SaleTransaction {
  id: string;
  timestamp: number;
  dateStr: string;
  timeSlot: TimeSlot;
  items: {
    productId: string;
    productName: string;
    category: ProductCategory;
    quantity: number;
    price: number;
    cost: number;
  }[];
  totalAmount: number;
  totalCost: number;
  totalProfit: number;
  paymentMethod: PaymentMethod;
  studentId?: string;
  studentName?: string;
  pointsEarned: number;
  pointsUsed: number;
  discountAmount: number;
}

export interface StudentMember {
  studentId: string; // e.g. "11204018"
  name: string;
  gradeClass: string; // e.g. "高二甲班"
  points: number;     // 累積點數
  totalSpent: number; // 累計消費
  avatarColor: string;
  cardBalance: number; // 學生證悠遊卡模擬餘額
  registeredDate: string;
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  type: 'discount' | 'bogo_half' | 'points_multiplier' | 'seasonal_bundle';
  discountPercent?: number; // e.g. 10 means 10% off (9折)
  pointsMultiplier?: number;
  targetCategory?: ProductCategory;
  targetProductId?: string;
  timeSlotOnly?: TimeSlot;
  isActive: boolean;
  tagText: string;
  bannerColor: string;
}

export interface DailySummary {
  date: string;
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  marginPercent: number;
  orderCount: number;
  itemsSoldCount: number;
  wastageLoss: number;
}
