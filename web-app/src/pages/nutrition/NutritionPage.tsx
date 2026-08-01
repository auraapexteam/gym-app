import { useState } from 'react';
import { DashboardLayout } from '@/components/layouts';
import { Card, CardContent, Badge, Button, SearchInput, StatCard } from '@/components/ui';
import { ShoppingBag, Plus, Star, Package, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/utils';
import type { Product } from '@/types';
import { motion } from 'framer-motion';

const mockProducts: Product[] = [
  { id: '1', name: 'Whey Protein Gold', category: 'protein', price: 2499, stock: 45, discount: 10, description: '2.2 lbs, Chocolate flavor', gymId: 'g1' },
  { id: '2', name: 'Creatine Monohydrate', category: 'creatine', price: 799, stock: 30, description: '250g unflavored', gymId: 'g1' },
  { id: '3', name: 'Mass Gainer XXL', category: 'mass_gainer', price: 3299, stock: 12, discount: 15, description: '6.6 lbs, Vanilla', gymId: 'g1' },
  { id: '4', name: 'Pre-Workout Blast', category: 'protein', price: 1299, stock: 8, description: '200g, Fruit Punch', gymId: 'g1' },
  { id: '5', name: '7-Day Meal Plan', category: 'meal_plan', price: 1999, stock: 999, description: 'Balanced macros, customized', gymId: 'g1' },
  { id: '6', name: 'Gym Gloves Pro', category: 'accessory', price: 599, stock: 25, description: 'Anti-slip, breathable', gymId: 'g1' },
  { id: '7', name: 'BCAA Amino Energy', category: 'protein', price: 1599, stock: 5, discount: 20, description: '300g, Mixed Berry', gymId: 'g1' },
  { id: '8', name: 'Protein Shaker', category: 'accessory', price: 299, stock: 40, description: '700ml BPA-free bottle', gymId: 'g1' },
];

const CATEGORIES = ['All', 'protein', 'creatine', 'mass_gainer', 'meal_plan', 'accessory'];

const categoryLabels: Record<string, string> = {
  protein: 'Protein',
  creatine: 'Creatine',
  mass_gainer: 'Mass Gainer',
  meal_plan: 'Meal Plans',
  accessory: 'Accessories',
};

const stats = [
  { title: 'Total Products', value: mockProducts.length, icon: Package, iconColor: 'text-aura-primary' },
  { title: 'Orders Today', value: 42, icon: ShoppingBag, iconColor: 'text-aura-success' },
  { title: 'Low Stock Items', value: mockProducts.filter((p) => p.stock < 10).length, icon: AlertTriangle, iconColor: 'text-aura-warning' },
  { title: 'Monthly Revenue', value: 184500, isCurrency: true, icon: Star, iconColor: 'text-yellow-400' },
];

export default function NutritionPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const filtered = mockProducts.filter((p) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (category !== 'All' && p.category !== category) return false;
    return true;
  });

  return (
    <DashboardLayout
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Nutrition Store' }]}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-aura-text">Nutrition Store</h1>
          <p className="text-sm text-aura-muted mt-0.5">Manage products, inventory and offers</p>
        </div>
        <Button variant="primary">
          <Plus className="h-4 w-4" /> Add Product
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s, i) => (
          <StatCard key={s.title} {...s} index={i} />
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <SearchInput value={search} onChange={setSearch} placeholder="Search products..." className="w-56" />
        <div className="flex gap-1 bg-aura-card border border-aura-border rounded-md p-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors capitalize ${
                category === cat ? 'bg-aura-primary text-aura-bg' : 'text-aura-muted hover:text-aura-text'
              }`}
            >
              {cat === 'All' ? 'All' : categoryLabels[cat] ?? cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filtered.map((product, i) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card hover>
              <CardContent className="p-4">
                {/* Image placeholder */}
                <div className="aspect-square rounded-lg bg-aura-bg border border-aura-border flex items-center justify-center mb-3 relative overflow-hidden">
                  <Package className="h-12 w-12 text-aura-primary/20" />
                  {product.discount && (
                    <span className="absolute top-2 left-2 bg-aura-danger text-white text-xs font-bold px-1.5 py-0.5 rounded">
                      -{product.discount}%
                    </span>
                  )}
                </div>

                <div className="mb-1 flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-aura-text leading-tight">{product.name}</h3>
                </div>
                <p className="text-xs text-aura-muted mb-2 capitalize">
                  {categoryLabels[product.category] ?? product.category}
                </p>

                <div className="flex items-center justify-between mb-3">
                  <div>
                    {product.discount ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-base font-bold text-aura-text">
                          {formatCurrency(product.price * (1 - product.discount / 100))}
                        </span>
                        <span className="text-xs text-aura-muted line-through">
                          {formatCurrency(product.price)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-base font-bold text-aura-text">
                        {formatCurrency(product.price)}
                      </span>
                    )}
                  </div>
                  <Badge
                    variant={product.stock < 10 ? 'warning' : 'success'}
                    className="text-xs"
                  >
                    {product.stock < 10 ? `${product.stock} left` : `${product.stock} in stock`}
                  </Badge>
                </div>

                <button className="w-full flex items-center justify-center gap-1.5 bg-aura-primary/10 text-aura-primary text-xs font-medium py-2 rounded-md hover:bg-aura-primary/20 transition-colors border border-aura-primary/20">
                  <ShoppingBag className="h-3.5 w-3.5" />
                  Add to Order
                </button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </DashboardLayout>
  );
}
