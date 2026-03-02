import React, { useState } from "react";
import OrderForm from "../components/OrderForm";
import OrdersList from "../components/OrdersList";
import OrderStats from "../components/OrderStats";


export default function Dashboard() {
  const [refreshList, setRefreshList] = useState(false);

  const handleOrderAdded = () => {
    setRefreshList(prev => !prev);
  };

  return (
    <div className="dashboard">
      <OrderStats />
      
      <div className="dashboard-grid">
        <div className="form-section">
          <OrderForm onOrderAdded={handleOrderAdded} />
        </div>
        
        <div className="list-section">
          <OrdersList refresh={refreshList} />
        </div>
      </div>
    </div>
  );
}