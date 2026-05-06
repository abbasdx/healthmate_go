'use client';

import { useEffect, useMemo, useState } from 'react';
import { getWithAuth, putWithAuth } from '@/services/httpService';
import { UserManagementUser } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Search, 
  UserCheck, 
  UserX, 
  Mail,
  Calendar,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserManagementUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'patient' | 'doctor'>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getWithAuth('/admin/users');
      setUsers(response.data || []);
    } catch (err: any) {
      const message = err?.message || 'Failed to fetch users';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      setUpdatingId(userId);
      await putWithAuth(`/admin/users/${userId}/status`, {
        isActive: !currentStatus
      });
      
      setUsers(prev => prev.map(user =>
        user._id === userId
          ? { ...user, isActive: !currentStatus }
          : user
      ));
      
      toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update user status');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || user.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [users, searchTerm, filterType]);

  const activeCount = users.filter((user) => user.isActive).length;
  const inactiveCount = users.filter((user) => !user.isActive).length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <Card key={item} className="animate-pulse border-slate-200">
              <CardContent className="p-6">
                <div className="h-4 w-24 rounded bg-slate-200 mb-3" />
                <div className="h-8 w-16 rounded bg-slate-200" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="animate-pulse border-slate-200">
          <CardContent className="p-6">
            <div className="h-10 rounded bg-slate-200 mb-4" />
            <div className="h-64 rounded bg-slate-100" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !users.length) {
    return (
      <Card className="border-red-200 bg-red-50/60">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
          <h2 className="text-xl font-semibold text-slate-900">Unable to load users</h2>
          <p className="mt-2 max-w-md text-sm text-slate-600">{error}</p>
          <Button className="mt-6 gap-2" onClick={fetchUsers}>
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-slate-500">Total users</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{users.length}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-slate-500">Active users</p>
            <p className="mt-2 text-3xl font-bold text-emerald-600">{activeCount}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-slate-500">Inactive users</p>
            <p className="mt-2 text-3xl font-bold text-amber-600">{inactiveCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Filter Users</CardTitle>
          <CardDescription>Search and filter users by type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={filterType === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterType('all')}
              >
                All Users
              </Button>
              <Button
                variant={filterType === 'patient' ? 'default' : 'outline'}
                onClick={() => setFilterType('patient')}
              >
                Patients
              </Button>
              <Button
                variant={filterType === 'doctor' ? 'default' : 'outline'}
                onClick={() => setFilterType('doctor')}
              >
                Doctors
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
          <CardDescription>
            Manage user accounts and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-y-2">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Verified</th>
                  <th className="px-4 py-2 text-left">Joined</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="rounded-2xl bg-slate-50/80 align-middle hover:bg-slate-100/80">
                    <td className="px-4 py-4 rounded-l-2xl">
                      <div className="flex items-center">
                        <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                          <Users className="h-4 w-4 text-blue-600" />
                        </div>
                        <span className="font-medium text-slate-900">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center text-slate-600">
                        <Mail className="mr-2 h-4 w-4 text-gray-400" />
                        {user.email}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant={user.type === 'doctor' ? 'default' : 'secondary'}>
                        {user.type === 'doctor' ? 'Doctor' : 'Patient'}
                      </Badge>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant={user.isActive ? 'default' : 'destructive'}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-4 py-4">
                      {user.isVerified ? (
                        <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                          <UserCheck className="mr-1 h-3 w-3" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <UserX className="mr-1 h-3 w-3" />
                          Unverified
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-500">
                      <div className="flex items-center">
                        <Calendar className="mr-1 h-4 w-4" />
                        {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-4 rounded-r-2xl">
                      <Button
                        variant={user.isActive ? 'destructive' : 'default'}
                        size="sm"
                        disabled={updatingId === user._id}
                        onClick={() => handleToggleUserStatus(user._id, user.isActive || false)}
                      >
                        {updatingId === user._id ? (
                          'Updating...'
                        ) : user.isActive ? (
                          <>
                            <UserX className="mr-1 h-4 w-4" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <UserCheck className="mr-1 h-4 w-4" />
                            Activate
                          </>
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredUsers.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Users className="mb-3 h-12 w-12 text-gray-400" />
                <p className="font-medium text-slate-700">No users found</p>
                <p className="mt-1 text-sm text-slate-500">Try a different search or switch user type.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}