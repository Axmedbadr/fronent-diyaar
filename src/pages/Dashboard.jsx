import React, { useState } from "react";
import OrderForm from "../components/OrderForm";
import OrdersList from "../components/OrdersList";
import OrderStats from "../components/OrderStats";

export default function Dashboard() {
  const [refreshList, setRefreshList] = useState(false);
  const [showForm, setShowForm] = useState(true);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats */}
      <OrderStats />

      {/* Main columns */}
      <div className="flex gap-4 items-start">
        {/* Form column */}
        <div className={`shrink-0 transition-all duration-300 ${showForm ? "w-72 xl:w-80" : "w-0 overflow-hidden opacity-0"}`}>
          {showForm && (
            <OrderForm onOrderAdded={() => setRefreshList(p => !p)} />
          )}
        </div>

        {/* List column */}
        <div className="flex-1 min-w-0">
          {/* Toggle form button */}
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => setShowForm(p => !p)}
              className="btn-ghost text-xs flex items-center gap-1.5"
            >
              {showForm ? (
                <><span>←</span> Hide Form</>
              ) : (
                <><span>+</span> Add Order</>
              )}
            </button>
          </div>
          <OrdersList refresh={refreshList} />
        </div>
      </div>

      {/* Mobile FAB */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="fixed bottom-6 right-6 w-12 h-12 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl shadow-glow flex items-center justify-center text-xl transition-all duration-200 md:hidden z-40"
          aria-label="Add Order"
        >
          +
        </button>
      )}
    </div>
  );
}
