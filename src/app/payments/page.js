"use client";

import { useState, useEffect } from "react";
import DataTable from "@/components/common/DataTable";
import StatusPill from "@/components/common/StatusPill";
import Modal from "@/components/common/Modal";
import FormField from "@/components/common/FormField";
import { getAllPayments, createPayment } from "@/lib/api";
import { getAllGuests } from "@/lib/api";
import { getAllProperties } from "@/lib/api";
import { useRequireAuth } from "@/hooks/useAuth";

export default function PaymentsPage() {
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [paymentsData, setPaymentsData] = useState([]);
  const [guestsData, setGuestsData] = useState([]);
  const [propertiesData, setPropertiesData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    guest: "",
    property: "",
    amount: "",
    method: "Card",
    status: "Completed",
    notes: "",
  });

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
    return (
      <div className="rounded-3xl border border-slate-100 bg-white p-8 text-center text-slate-600">
        Checking your access…
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-slate-100 bg-white p-8 text-center text-slate-600">
        Loading payments…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-rose-100 bg-rose-50/80 p-8 text-center text-rose-600">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Finance
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Payments</h1>
          <p className="text-sm text-slate-500">
            Track settlement status and capture manual payments.
          </p>
        </div>
        <button
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          onClick={() => setCreateOpen(true)}
        >
          Add payment
        </button>
      </div>

      <DataTable
        headers={["ID", "Guest", "Property", "Amount", "Method", "Date", "Status"]}
        rows={paymentsData.map((payment, index) => {
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
        })}
      />

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
    </div>
  );
}

