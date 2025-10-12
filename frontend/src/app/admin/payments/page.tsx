'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { getWithAuth, putWithAuth } from '@/services/httpService';
import { PaymentRecord } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  DollarSign, 
  Calendar,
  User,
  Mail,
  LogOut,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function PaymentsPage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const [showPayoutModal, setShowPayoutModal] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await getWithAuth('/admin/payments');
      setPayments(response.data);
      
      // Calculate total revenue
      const total = response.data.reduce((sum: number, payment: PaymentRecord) => sum + payment.totalAmount, 0);
      setTotalRevenue(total);
    } catch (error: any) {
      toast.error('Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayout = async (appointmentId: string, payoutStatus: string) => {
    try {
      await putWithAuth(`/admin/payments/${appointmentId}/payout`, {
        payoutStatus
      });
      
      setPayments(payments.map(payment => 
        payment._id === appointmentId 
          ? { ...payment, payoutStatus, payoutDate: payoutStatus === 'Paid' ? new Date().toISOString() : undefined }
          : payment
      ));
      
      setShowPayoutModal(false);
      setSelectedPayment(null);
      toast.success(`Payout ${payoutStatus.toLowerCase()} successfully`);
    } catch (error: any) {
      toast.error('Failed to process payout');
    }
  };

  const openPayoutModal = (payment: PaymentRecord) => {
    setSelectedPayment(payment);
    setShowPayoutModal(true);
  };

  const handleLogout = () => {
    logout();
    router.push('/admin/login');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
        {/* Revenue Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                From {payments.length} completed consultations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Consultations</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{payments.length}</div>
              <p className="text-xs text-muted-foreground">
                Total completed appointments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Consultation Fee</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(payments.length > 0 ? totalRevenue / payments.length : 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Per consultation
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Payments Table */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Records</CardTitle>
            <CardDescription>
              All completed consultations and their payments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Date</th>
                    <th className="text-left py-3 px-4">Doctor</th>
                    <th className="text-left py-3 px-4">Patient</th>
                    <th className="text-left py-3 px-4">Consultation Fee</th>
                    <th className="text-left py-3 px-4">Platform Fee</th>
                    <th className="text-left py-3 px-4">Total</th>
                    <th className="text-left py-3 px-4">Payout Status</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment._id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center text-sm">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          {new Date(payment.date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">{payment.doctorName}</div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <Mail className="h-3 w-3 mr-1" />
                            {payment.doctorEmail}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2 text-gray-400" />
                          {payment.patientName}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center font-medium text-blue-600">
                          <DollarSign className="h-4 w-4 mr-1" />
                          {formatCurrency(payment.consultationFees)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center font-medium text-orange-600">
                          <DollarSign className="h-4 w-4 mr-1" />
                          {formatCurrency(payment.platformFees)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center font-medium text-green-600">
                          <DollarSign className="h-4 w-4 mr-1" />
                          {formatCurrency(payment.totalAmount)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {payment.payoutStatus === 'Paid' ? (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Paid
                          </Badge>
                        ) : payment.payoutStatus === 'Pending' ? (
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="bg-red-100 text-red-800">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Cancelled
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {payment.payoutStatus === 'Pending' && (
                          <Button
                            size="sm"
                            onClick={() => openPayoutModal(payment)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Process Payout
                          </Button>
                        )}
                        {payment.payoutStatus === 'Paid' && payment.payoutDate && (
                          <div className="text-xs text-gray-500">
                            Paid on {new Date(payment.payoutDate).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {payments.length === 0 && (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No payment records found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

      {/* Payout Modal */}
      {showPayoutModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Process Payout</h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Doctor: {selectedPayment.doctorName}</p>
                <p className="text-sm text-gray-600">Patient: {selectedPayment.patientName}</p>
                <p className="text-sm text-gray-600">Consultation Fee: {formatCurrency(selectedPayment.consultationFees)}</p>
                <p className="text-sm text-gray-600">Platform Fee: {formatCurrency(selectedPayment.platformFees)}</p>
                <p className="text-sm font-medium">Total Amount: {formatCurrency(selectedPayment.totalAmount)}</p>
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-800">Payout Details:</p>
                  <p className="text-sm text-blue-700">Doctor will receive: {formatCurrency(selectedPayment.consultationFees)}</p>
                  <p className="text-sm text-blue-700">Platform keeps: {formatCurrency(selectedPayment.platformFees)}</p>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <Button
                  onClick={() => handleProcessPayout(selectedPayment._id, 'Paid')}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as Paid
                </Button>
                <Button
                  onClick={() => handleProcessPayout(selectedPayment._id, 'Cancelled')}
                  variant="destructive"
                  className="flex-1"
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Cancel Payout
                </Button>
              </div>
              
              <Button
                onClick={() => {
                  setShowPayoutModal(false);
                  setSelectedPayment(null);
                }}
                variant="outline"
                className="w-full"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
