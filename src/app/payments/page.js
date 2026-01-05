"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DataTable from "@/components/common/DataTable";
import StatusPill from "@/components/common/StatusPill";
import Modal from "@/components/common/Modal";
import FormField from "@/components/common/FormField";
import PageLoader from "@/components/common/PageLoader";
import { getAllPayments, createPayment } from "@/lib/api";
import { getAllGuests } from "@/lib/api";
import { getAllProperties } from "@/lib/api";
import { useRequireAuth } from "@/hooks/useAuth";
import { useSEO } from "@/hooks/useSEO";

export default function PaymentsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();
  
  // SEO
  useSEO({
    title: "Payments | Zuha Host",
    description: "Track payment settlements, manage transactions, and capture manual payments.",
    keywords: "payments, transactions, settlements, finance management",
  });
  
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [paymentsData, setPaymentsData] = useState([]);
  const [guestsData, setGuestsData] = useState([]);
  const [propertiesData, setPropertiesData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [viewMode, setViewMode] = useState(() => {
    // Default to table on desktop, cards on mobile
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768 ? "table" : "cards";
    }
    return "table";
  });
  const [formData, setFormData] = useState({
    guest: "",
    property: "",
    amount: "",
    method: "Card",
    status: "Completed",
    notes: "",
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdownId && !event.target.closest('.dropdown-container')) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdownId]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [payments, guests, properties] = await Promise.all([
          getAllPayments(),
          getAllGuests(),
          getAllProperties()
        ]);
        setPaymentsData(Array.isArray(payments) ? payments : []);
        setGuestsData(Array.isArray(guests) ? guests : []);
        setPropertiesData(Array.isArray(properties) ? properties : []);
      } catch (err) {
        setError(err.message || "Failed to load data");
        console.error("Error loading data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isAuthenticated]);

  const handleCreatePayment = async () => {
    try {
      const selectedGuest = guestsData.find(g => (g.name || g.email) === formData.guest);
      const selectedProperty = propertiesData.find(p => (p.name || p.propertyName) === formData.property);

      const paymentData = {
        guestId: selectedGuest?.id || selectedGuest?._id,
        propertyId: selectedProperty?.id || selectedProperty?._id,
        amount: parseFloat(formData.amount || 0),
        method: formData.method,
        status: formData.status,
        notes: formData.notes,
      };
      const newPayment = await createPayment(paymentData);
      setPaymentsData((prev) => [...prev, newPayment]);
      setCreateOpen(false);
      setFormData({
        guest: "",
        property: "",
        amount: "",
        method: "Card",
        status: "Completed",
        notes: "",
      });
    } catch (err) {
      setError(err.message || "Failed to create payment");
    }
  };

  if (authLoading || !isAuthenticated) {
    return <PageLoader message="Checking your access..." />;
  }

  if (isLoading) {
    return <PageLoader message="Loading payments..." />;
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-rose-100 bg-rose-50/80 p-8 text-center text-rose-600">
        {error}
      </div>
    );
  }

  const rows = paymentsData.map((payment, index) => {
          const paymentId = payment.id || payment._id || `payment-${index}`;
          const guest = guestsData.find(g => (g.id || g._id) === payment.guestId || payment.guest) || {};
          const property = propertiesData.find(p => (p.id || p._id) === payment.propertyId || payment.property) || {};
          return {
            id: paymentId,
            cells: [
              paymentId,
              payment.guestName || guest.name || payment.guest || "N/A",
              payment.propertyName || property.name || payment.property || "N/A",
              `$${payment.amount || payment.total || 0}`,
              payment.method || payment.paymentMethod || "N/A",
              payment.date || payment.paymentDate || payment.createdAt || "N/A",
              <StatusPill key={`status-${paymentId}`} label={payment.status || "Pending"} />,
            ],
          };
  });

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <button
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors shrink-0 lg:hidden mt-2"
          >
            <svg className="w-6 h-6 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Finance
            </p>
            <h1 className="mt-2 text-2xl lg:text-3xl font-semibold text-slate-900">Payments</h1>
            <p className="text-sm text-slate-500">
              Track settlement status and capture manual payments.
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {/* View Mode Switcher - Hidden on mobile */}
          <div className="hidden md:flex rounded-full border border-slate-200 p-1">
            <button
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === "cards"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
              onClick={() => setViewMode("cards")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
            </button>
            <button
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === "table"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
              onClick={() => setViewMode("table")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </button>
          </div>

          <button
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            onClick={() => setCreateOpen(true)}
          >
            <span className="hidden sm:inline">Add payment</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Card View (Mobile) */}
      {viewMode === "cards" && (
        <>
          {paymentsData.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No payments yet</h3>
              <p className="text-sm text-slate-600 mb-6">Get started by recording your first payment</p>
              <button
                className="rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                onClick={() => setCreateOpen(true)}
              >
                Add payment
              </button>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {paymentsData.map((payment, index) => {
                const paymentId = payment.id || payment._id || `payment-${index}`;
                const guest = guestsData.find(g => (g.id || g._id) === payment.guestId || payment.guest) || {};
                const property = propertiesData.find(p => (p.id || p._id) === payment.propertyId || payment.property) || {};
                const guestName = payment.guestName || guest.name || payment.guest || "N/A";
                const propertyName = payment.propertyName || property.name || payment.property || "N/A";
                const amount = payment.amount || payment.total || 0;
                const method = payment.method || payment.paymentMethod || "N/A";
                const date = payment.date || payment.paymentDate || payment.createdAt || "N/A";
                const status = payment.status || "Pending";
                
                return (
                  <div
                    key={paymentId}
                    className="rounded-2xl border border-slate-200 bg-white p-4 hover:shadow-md transition-shadow"
                  >
                    {/* Payment Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-slate-900 truncate">{guestName}</h3>
                          <StatusPill label={status} />
                        </div>
                        <p className="text-sm text-slate-600 truncate">{propertyName}</p>
                      </div>
                      
                      {/* Actions Dropdown */}
                      <div className="relative dropdown-container">
                        <button
                          onClick={() => setOpenDropdownId(openDropdownId === paymentId ? null : paymentId)}
                          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100 active:bg-slate-200 transition-colors"
                        >
                          <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        </button>
                        
                        {/* Dropdown Menu */}
                        {openDropdownId === paymentId && (
                          <div className="absolute right-0 top-10 z-20 w-40 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
                            <button
                              className="w-full px-4 py-2.5 text-left text-sm text-slate-900 hover:bg-slate-50 transition-colors flex items-center gap-2"
                              onClick={() => {
                                setSelectedPayment(payment);
                                setOpenDropdownId(null);
                              }}
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              View Details
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Payment Details Grid */}
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                      <div>
                        <span className="text-xs text-slate-500 block mb-1">Amount</span>
                        <span className="text-lg font-semibold text-slate-900">${amount}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-500 block mb-1">Method</span>
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                          {method}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-xs text-slate-500 block mb-1">Date</span>
                        <span className="text-sm text-slate-900">{new Date(date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Table View (Desktop) */}
      {viewMode === "table" && (
        <>
          {paymentsData.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No payments yet</h3>
              <p className="text-sm text-slate-600 mb-6">Get started by recording your first payment</p>
              <button
                className="rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                onClick={() => setCreateOpen(true)}
              >
                Add payment
              </button>
            </div>
          ) : (
            <DataTable
              headers={["ID", "Guest", "Property", "Amount", "Method", "Date", "Status"]}
              rows={rows}
            />
          )}
        </>
      )}

      <Modal
        title="Add payment"
        description="Capture refunds, manual adjustments, or walk-in payments."
        isOpen={isCreateOpen}
        onClose={() => {
          setCreateOpen(false);
          setFormData({
            guest: "",
            property: "",
            amount: "",
            method: "Card",
            status: "Completed",
            notes: "",
          });
        }}
        primaryActionLabel="Record payment"
        primaryAction={handleCreatePayment}
      >
        <div className="space-y-4">
          <FormField
            name="guest"
            label="Guest"
            as="select"
            value={formData.guest || (guestsData[0]?.name || guestsData[0]?.email || "")}
            onChange={(e) => setFormData({ ...formData, guest: e.target.value })}
            options={guestsData.map((guest) => guest.name || guest.email || "N/A")}
          />
          <FormField
            name="property"
            label="Property"
            as="select"
            value={formData.property || (propertiesData[0]?.name || propertiesData[0]?.propertyName || "")}
            onChange={(e) => setFormData({ ...formData, property: e.target.value })}
            options={propertiesData.map((property) => property.name || property.propertyName || "N/A")}
          />
          <FormField 
            name="amount" 
            label="Amount" 
            type="number" 
            placeholder="0.00"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          />
          <FormField
            name="method"
            label="Method"
            as="select"
            value={formData.method}
            onChange={(e) => setFormData({ ...formData, method: e.target.value })}
            options={["Card", "Cash", "ACH", "Wire"]}
          />
          <FormField 
            name="status" 
            label="Status" 
            as="select" 
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            options={["Completed", "Pending", "Failed"]} 
          />
          <FormField 
            name="notes" 
            label="Notes" 
            as="textarea" 
            rows={3} 
            placeholder="Optional memo"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </div>
      </Modal>

      {/* Payment Details Modal */}
      <Modal
        title="Payment Details"
        description="View payment information"
        isOpen={Boolean(selectedPayment)}
        onClose={() => setSelectedPayment(null)}
        primaryActionLabel="Close"
        primaryAction={() => setSelectedPayment(null)}
      >
        {selectedPayment && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Payment ID</label>
              <p className="mt-1 text-sm text-slate-900">{selectedPayment.id || selectedPayment._id || "N/A"}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Guest</label>
              <p className="mt-1 text-sm text-slate-900">
                {selectedPayment.guestName || 
                 guestsData.find(g => (g.id || g._id) === selectedPayment.guestId)?.name || 
                 selectedPayment.guest || "N/A"}
              </p>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Property</label>
              <p className="mt-1 text-sm text-slate-900">
                {selectedPayment.propertyName || 
                 propertiesData.find(p => (p.id || p._id) === selectedPayment.propertyId)?.name || 
                 selectedPayment.property || "N/A"}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Amount</label>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  ${selectedPayment.amount || selectedPayment.total || 0}
                </p>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Method</label>
                <p className="mt-1 text-sm text-slate-900">
                  {selectedPayment.method || selectedPayment.paymentMethod || "N/A"}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Status</label>
                <div className="mt-1">
                  <StatusPill label={selectedPayment.status || "Pending"} />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Date</label>
                <p className="mt-1 text-sm text-slate-900">
                  {new Date(selectedPayment.date || selectedPayment.paymentDate || selectedPayment.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            {selectedPayment.notes && (
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Notes</label>
                <p className="mt-1 text-sm text-slate-900">{selectedPayment.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
