'use client';

import { useEffect, useMemo, useState } from 'react';
import { getWithAuth, postWithAuth, putWithAuth, deleteWithAuth } from '@/services/httpService';
import { PharmacyMedicine, PharmacyOrder } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, RefreshCw, Search, Package2, ClipboardList } from 'lucide-react';
import toast from 'react-hot-toast';

type MedicineForm = {
  name: string;
  brand: string;
  category: string;
  price: string;
  oldPrice: string;
  stock: string;
  image: string;
  requiresPrescription: boolean;
};

const emptyForm: MedicineForm = {
  name: '',
  brand: '',
  category: '',
  price: '',
  oldPrice: '0',
  stock: '0',
  image: '',
  requiresPrescription: false
};

export default function AdminPharmacyPage() {
  const [medicines, setMedicines] = useState<PharmacyMedicine[]>([]);
  const [orders, setOrders] = useState<PharmacyOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<MedicineForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [orderUpdatingId, setOrderUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);

    try {
      const [medResponse, orderResponse] = await Promise.all([
        getWithAuth('/pharmacy/admin/medicines?includeInactive=true'),
        getWithAuth('/pharmacy/admin/orders')
      ]);
      setMedicines(medResponse.data || []);
      setOrders(orderResponse.data || []);
    } catch (err: any) {
      const message = err?.message || 'Failed to load pharmacy data';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const filteredMedicines = useMemo(() => {
    if (!search.trim()) return medicines;
    const term = search.trim().toLowerCase();
    return medicines.filter((item) =>
      [item.name, item.brand, item.category].some((v) => (v || '').toLowerCase().includes(term))
    );
  }, [medicines, search]);

  const upsertMedicine = async () => {
    if (!form.name.trim() || !form.brand.trim() || !form.category.trim()) {
      toast.error('Name, brand, and category are required');
      return;
    }

    const payload = {
      name: form.name.trim(),
      brand: form.brand.trim(),
      category: form.category.trim(),
      price: Number(form.price || 0),
      oldPrice: Number(form.oldPrice || 0),
      stock: Number(form.stock || 0),
      image: form.image.trim(),
      requiresPrescription: form.requiresPrescription
    };

    try {
      setSaving(true);
      if (editingId) {
        const response = await putWithAuth(`/pharmacy/admin/medicines/${editingId}`, payload);
        setMedicines((prev) => prev.map((m) => (m._id === editingId ? response.data : m)));
        toast.success('Medicine updated');
      } else {
        const response = await postWithAuth('/pharmacy/admin/medicines', payload);
        setMedicines((prev) => [response.data, ...prev]);
        toast.success('Medicine added');
      }

      setForm(emptyForm);
      setEditingId(null);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save medicine');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (medicine: PharmacyMedicine) => {
    setEditingId(medicine._id);
    setForm({
      name: medicine.name,
      brand: medicine.brand,
      category: medicine.category,
      price: String(medicine.price ?? 0),
      oldPrice: String(medicine.oldPrice ?? 0),
      stock: String(medicine.stock ?? 0),
      image: medicine.image || '',
      requiresPrescription: Boolean(medicine.requiresPrescription)
    });
  };

  const archiveMedicine = async (id: string) => {
    try {
      setArchivingId(id);
      await deleteWithAuth(`/pharmacy/admin/medicines/${id}`);
      setMedicines((prev) => prev.map((m) => (m._id === id ? { ...m, isActive: false } : m)));
      toast.success('Medicine archived');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to archive medicine');
    } finally {
      setArchivingId(null);
    }
  };

  const updateOrderStatus = async (id: string, deliveryStatus: string) => {
    try {
      setOrderUpdatingId(id);
      const response = await putWithAuth(`/pharmacy/admin/orders/${id}/status`, { deliveryStatus });
      setOrders((prev) => prev.map((o) => (o._id === id ? response.data : o)));
      toast.success('Order status updated');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update order status');
    } finally {
      setOrderUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="animate-pulse border-slate-200">
          <CardContent className="p-6">
            <div className="h-6 w-40 rounded bg-slate-200 mb-4" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-24 rounded-2xl bg-slate-100" />
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="animate-pulse border-slate-200">
          <CardContent className="p-6">
            <div className="h-10 rounded bg-slate-200 mb-4" />
            <div className="h-64 rounded bg-slate-100" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !medicines.length && !orders.length) {
    return (
      <Card className="border-red-200 bg-red-50/60">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
          <h2 className="text-xl font-semibold text-slate-900">Unable to load pharmacy admin data</h2>
          <p className="mt-2 max-w-md text-sm text-slate-600">{error}</p>
          <Button className="mt-6 gap-2" onClick={fetchAll}>
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const totalMedicines = medicines.length;
  const activeMedicines = medicines.filter((medicine) => medicine.isActive).length;
  const pendingOrders = orders.filter((order) => order.deliveryStatus !== 'Delivered').length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-slate-500">Medicines</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{totalMedicines}</p>
            <p className="text-sm text-slate-500">{activeMedicines} active</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-slate-500">Orders</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{orders.length}</p>
            <p className="text-sm text-slate-500">{pendingOrders} pending delivery</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-slate-500">Prescription items</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{medicines.filter((medicine) => medicine.requiresPrescription).length}</p>
            <p className="text-sm text-slate-500">Need pharmacist review</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>{editingId ? 'Edit Medicine' : 'Add Medicine'}</CardTitle>
          <CardDescription>Manage medicines shown in the pharmacy section.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Input placeholder="Medicine name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="Brand" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
            <Input placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            <Input placeholder="Price" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            <Input placeholder="Old Price" type="number" value={form.oldPrice} onChange={(e) => setForm({ ...form, oldPrice: e.target.value })} />
            <Input placeholder="Stock" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
          </div>
          <Input placeholder="Image URL" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />

          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.requiresPrescription}
              onChange={(e) => setForm({ ...form, requiresPrescription: e.target.checked })}
            />
            Requires prescription
          </label>

          <div className="flex gap-2">
            <Button onClick={upsertMedicine} disabled={saving}>{saving ? 'Saving...' : `${editingId ? 'Update' : 'Add'} Medicine`}</Button>
            {editingId && (
              <Button
                variant="outline"
                onClick={() => {
                  setEditingId(null);
                  setForm(emptyForm);
                }}
              >
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Medicines ({filteredMedicines.length})</CardTitle>
          <CardDescription>Search and manage medicine inventory.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search by name, brand, or category"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-y-2 text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-2 text-left">Name</th>
                  <th className="py-2 text-left">Brand</th>
                  <th className="py-2 text-left">Category</th>
                  <th className="py-2 text-left">Price</th>
                  <th className="py-2 text-left">Stock</th>
                  <th className="py-2 text-left">Status</th>
                  <th className="py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMedicines.map((m) => (
                  <tr key={m._id} className="rounded-2xl bg-slate-50/80 align-middle hover:bg-slate-100/80">
                    <td className="py-3 pr-3 pl-4 rounded-l-2xl font-medium">{m.name}</td>
                    <td className="py-3 pr-3">{m.brand}</td>
                    <td className="py-3 pr-3">{m.category}</td>
                    <td className="py-3 pr-3">Rs {m.price}</td>
                    <td className="py-3 pr-3">{m.stock}</td>
                    <td className="py-3 pr-3">
                      <Badge variant={m.isActive ? 'default' : 'secondary'}>{m.isActive ? 'Active' : 'Archived'}</Badge>
                    </td>
                    <td className="py-3 pr-4 rounded-r-2xl">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => startEdit(m)}>Edit</Button>
                        {m.isActive && (
                          <Button size="sm" variant="destructive" onClick={() => archiveMedicine(m._id)} disabled={archivingId === m._id}>
                            {archivingId === m._id ? 'Archiving...' : 'Archive'}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredMedicines.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Package2 className="mb-3 h-12 w-12 text-gray-400" />
                <p className="font-medium text-slate-700">No medicines match your search</p>
                <p className="mt-1 text-sm text-slate-500">Try a different query or clear the search field.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Pharmacy Orders ({orders.length})</CardTitle>
          <CardDescription>Monitor and update medicine order delivery status.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-y-2 text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-2 text-left">Order ID</th>
                  <th className="py-2 text-left">User</th>
                  <th className="py-2 text-left">Total</th>
                  <th className="py-2 text-left">Delivery</th>
                  <th className="py-2 text-left">Created</th>
                  <th className="py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o._id} className="rounded-2xl bg-slate-50/80 align-middle hover:bg-slate-100/80">
                    <td className="py-3 pr-3 pl-4 rounded-l-2xl font-medium">{o._id.slice(-8)}</td>
                    <td className="py-3 pr-3">{o.userId}</td>
                    <td className="py-3 pr-3">Rs {o.total}</td>
                    <td className="py-3 pr-3">
                      <Badge variant="outline">{o.deliveryStatus}</Badge>
                    </td>
                    <td className="py-3 pr-3">{new Date(o.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 pr-4 rounded-r-2xl">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => updateOrderStatus(o._id, 'Dispatched')} disabled={orderUpdatingId === o._id}>
                          {orderUpdatingId === o._id ? 'Updating...' : 'Dispatch'}
                        </Button>
                        <Button size="sm" onClick={() => updateOrderStatus(o._id, 'Delivered')} disabled={orderUpdatingId === o._id}>
                          Deliver
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {orders.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <ClipboardList className="mb-3 h-12 w-12 text-gray-400" />
                <p className="font-medium text-slate-700">No pharmacy orders yet</p>
                <p className="mt-1 text-sm text-slate-500">Orders will appear here when patients check out.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

