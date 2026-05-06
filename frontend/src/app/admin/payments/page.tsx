'use client';

import { useEffect, useMemo, useState } from 'react';
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
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getWithAuth('/admin/payments');
      const data = response.data || [];
      setPayments(data);

      const total = data.reduce((sum: number, payment: PaymentRecord) => sum + payment.totalAmount, 0);
      setTotalRevenue(total);
    } catch (err: any) {
      const message = err?.message || 'Failed to fetch payments';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayout = async (appointmentId: string, payoutStatus: string) => {
    try {
      setProcessingId(appointmentId);
      await putWithAuth(`/admin/payments/${appointmentId}/payout`, {
        payoutStatus
      });
      
      setPayments(prev => prev.map(payment =>
        payment._id === appointmentId
          ? { ...payment, payoutStatus, payoutDate: payoutStatus === 'Paid' ? new Date().toISOString() : undefined }
          : payment
      ));
      
      setShowPayoutModal(false);
      setSelectedPayment(null);
      toast.success(`Payout ${payoutStatus.toLowerCase()} successfully`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to process payout');
    } finally {
      setProcessingId(null);
    }
  };

  const openPayoutModal = (payment: PaymentRecord) => {
    setSelectedPayment(payment);
    setShowPayoutModal(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const pendingCount = useMemo(() => payments.filter((payment) => payment.payoutStatus === 'Pending').length, [payments]);
  const paidCount = useMemo(() => payments.filter((payment) => payment.payoutStatus === 'Paid').length, [payments]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <Card key={item} className="animate-pulse border-slate-200">
              <CardContent className="p-6">
                <div className="h-4 w-24 rounded bg-slate-200 mb-3" />
                <div className="h-8 w-20 rounded bg-slate-200" />
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

  if (error && !payments.length) {
    return (
      <Card className="border-red-200 bg-red-50/60">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
          <h2 className="text-xl font-semibold text-slate-900">Unable to load payments</h2>
          <p className="mt-2 max-w-md text-sm text-slate-600">{error}</p>
          <Button className="mt-6 gap-2" onClick={fetchPayments}>
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Revenue Summary */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="border-slate-200 shadow-sm">
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

        <Card className="border-slate-200 shadow-sm">
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

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">
              {paidCount} already paid out
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payments Table */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Payment Records</CardTitle>
          <CardDescription>
            All completed consultations and their payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-y-2">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Doctor</th>
                  <th className="px-4 py-2 text-left">Patient</th>
                  <th className="px-4 py-2 text-left">Consultation Fee</th>
                  <th className="px-4 py-2 text-left">Platform Fee</th>
                  <th className="px-4 py-2 text-left">Total</th>
                  <th className="px-4 py-2 text-left">Payout Status</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment._id} className="rounded-2xl bg-slate-50/80 align-middle hover:bg-slate-100/80">
                    <td className="px-4 py-4 rounded-l-2xl">
                      <div className="flex items-center text-sm text-slate-700">
                        <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                        {new Date(payment.date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <div className="font-medium">{payment.doctorName}</div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          {payment.doctorEmail}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-gray-400" />
                        {payment.patientName}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center font-medium text-blue-600">
                        <DollarSign className="h-4 w-4 mr-1" />
                        {formatCurrency(payment.consultationFees)}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center font-medium text-orange-600">
                        <DollarSign className="h-4 w-4 mr-1" />
                        {formatCurrency(payment.platformFees)}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center font-medium text-green-600">
                        <DollarSign className="h-4 w-4 mr-1" />
                        {formatCurrency(payment.totalAmount)}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {payment.payoutStatus === 'Paid' ? (
                        <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
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
                    <td className="px-4 py-4 rounded-r-2xl">
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
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <CreditCard className="mb-3 h-12 w-12 text-gray-400" />
                <p className="font-medium text-slate-700">No payment records found</p>
                <p className="mt-1 text-sm text-slate-500">Completed consultations will appear here automatically.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payout Modal */}
      {showPayoutModal && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold mb-4">Process Payout</h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Doctor: {selectedPayment.doctorName}</p>
                <p className="text-sm text-gray-600">Patient: {selectedPayment.patientName}</p>
                <p className="text-sm text-gray-600">Consultation Fee: {formatCurrency(selectedPayment.consultationFees)}</p>
                <p className="text-sm text-gray-600">Platform Fee: {formatCurrency(selectedPayment.platformFees)}</p>
                <p className="text-sm font-medium">Total Amount: {formatCurrency(selectedPayment.totalAmount)}</p>
                <div className="mt-3 rounded-2xl bg-blue-50 p-4">
                  <p className="text-sm font-medium text-blue-800">Payout Details:</p>
                  <p className="text-sm text-blue-700">Doctor will receive: {formatCurrency(selectedPayment.consultationFees)}</p>
                  <p className="text-sm text-blue-700">Platform keeps: {formatCurrency(selectedPayment.platformFees)}</p>
                </div>
              </div>
              
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  onClick={() => handleProcessPayout(selectedPayment._id, 'Paid')}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={processingId === selectedPayment._id}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {processingId === selectedPayment._id ? 'Processing...' : 'Mark as Paid'}
                </Button>
                <Button
                  onClick={() => handleProcessPayout(selectedPayment._id, 'Cancelled')}
                  variant="destructive"
                  className="flex-1"
                  disabled={processingId === selectedPayment._id}
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
