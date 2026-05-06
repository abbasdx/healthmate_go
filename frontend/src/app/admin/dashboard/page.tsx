'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { getWithAuth } from '@/services/httpService';
import { DashboardStats, MonthlyRevenue, ReportData } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  UserCheck, 
  Calendar, 
  DollarSign, 
  UserCog,
  CreditCard,
  AlertCircle,
  RefreshCw,
  Activity
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenue[]>([]);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getWithAuth('/admin/dashboard');
      
      setStats(response.data.stats);
      setMonthlyRevenue(response.data.monthlyRevenue);
      setReportData({
        userGrowth: response.data.userGrowth,
        appointmentStats: response.data.appointmentStats
      });
    } catch (err: any) {
      const message = err?.message || 'Failed to fetch dashboard data';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const formatRevenueData = (data: MonthlyRevenue[]) => {
    return data.map(item => ({
      month: new Date(item._id.year, item._id.month - 1).toLocaleDateString('en-US', { month: 'short' }),
      revenue: item.revenue
    }));
  };

  const formatAppointmentStats = (data: any[]) => {
    return data.map(item => ({
      name: item._id,
      value: item.count
    }));
  };

  const formatUserGrowth = (data: any[]) => {
    return data.map(item => ({
      month: new Date(item._id.year, item._id.month - 1).toLocaleDateString('en-US', { month: 'short' }),
      patients: item.patients,
      doctors: item.doctors
    }));
  };

  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#f97316', '#8b5cf6'];

  const revenueSeries = useMemo(() => formatRevenueData(monthlyRevenue), [monthlyRevenue]);
  const appointmentSeries = useMemo(() => formatAppointmentStats(reportData?.appointmentStats || []), [reportData]);
  const growthSeries = useMemo(() => formatUserGrowth(reportData?.userGrowth || []), [reportData]);

  const kpis = [
    {
      label: 'Total Patients',
      value: stats?.totalPatients || 0,
      helper: 'Registered patients',
      icon: Users,
    },
    {
      label: 'Total Doctors',
      value: stats?.totalDoctors || 0,
      helper: 'Registered doctors',
      icon: UserCheck,
    },
    {
      label: 'Total Appointments',
      value: stats?.totalAppointments || 0,
      helper: `${stats?.completedAppointments || 0} completed`,
      icon: Calendar,
    },
    {
      label: 'Total Revenue',
      value: `₹${stats?.totalRevenue || 0}`,
      helper: 'From completed consultations',
      icon: DollarSign,
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <Card key={item} className="animate-pulse border-slate-200">
              <CardContent className="p-6">
                <div className="h-4 w-24 rounded bg-slate-200 mb-4" />
                <div className="h-9 w-20 rounded bg-slate-200 mb-2" />
                <div className="h-3 w-32 rounded bg-slate-200" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {[1, 2, 3, 4].map((item) => (
            <Card key={item} className="h-[22rem] animate-pulse border-slate-200">
              <CardHeader>
                <div className="h-5 w-40 rounded bg-slate-200" />
                <div className="mt-2 h-4 w-64 rounded bg-slate-200" />
              </CardHeader>
              <CardContent>
                <div className="h-56 rounded-3xl bg-slate-100" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <Card className="border-red-200 bg-red-50/60">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
          <h2 className="text-xl font-semibold text-slate-900">Dashboard unavailable</h2>
          <p className="mt-2 max-w-md text-sm text-slate-600">{error}</p>
          <Button className="mt-6 gap-2" onClick={fetchDashboardData}>
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
            <Activity className="mr-2 h-3.5 w-3.5" />
            Admin overview
          </div>
          <h2 className="mt-3 text-2xl font-bold text-slate-900">Good to see you, {user?.name || 'admin'}</h2>
          <p className="mt-1 text-sm text-slate-600">Track growth, revenue, and operational health from one place.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className="border-slate-200" onClick={fetchDashboardData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh data
          </Button>
          <Button onClick={() => router.push('/admin/users')} className="bg-blue-600 hover:bg-blue-700">
            <UserCog className="mr-2 h-4 w-4" />
            Manage users
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="border-slate-200 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <CardContent className="p-6">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                    <div className="mt-2 text-3xl font-bold text-slate-900">{stat.value}</div>
                  </div>
                  <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <p className="text-sm text-slate-500">{stat.helper}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
            <CardDescription>
              Revenue from completed consultations over the last 6 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {revenueSeries.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueSeries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip formatter={(value) => [`₹${value}`, 'Revenue']} />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={{ fill: '#2563eb' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
                  No revenue data yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Appointment Status</CardTitle>
            <CardDescription>
              Distribution of appointment statuses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {appointmentSeries.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={appointmentSeries}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {appointmentSeries.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
                  No appointment status data yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Growth Chart */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
            <CardDescription>
              New user registrations over the last 6 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {growthSeries.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={growthSeries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip />
                    <Bar dataKey="patients" fill="#2563eb" name="Patients" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="doctors" fill="#10b981" name="Doctors" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
                  No user growth data yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common administrative tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Button
              className="justify-start border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              variant="outline"
              onClick={() => router.push('/admin/users')}
            >
              <UserCog className="mr-2 h-4 w-4" />
              Manage Users
            </Button>
            <Button 
              className="justify-start border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              variant="outline"
              onClick={() => router.push('/admin/payments')}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Process Payments
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}