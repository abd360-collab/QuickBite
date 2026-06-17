import { useEffect, useState } from "react";
import axios from "axios";
import { restaurantService } from "../main";

type Props = {
  restaurantId: string;
};

const Sales = ({ restaurantId }: Props) => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
  if (!restaurantId) return;

  const fetchData = async () => {
    try {
      const res = await axios.get(
        `${restaurantService}/api/order/sales/${restaurantId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setData(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  fetchData();
}, [restaurantId]);

  if (!data) return <p className="text-gray-500">Loading sales...</p>;

  return (
    <div className="space-y-6">

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="bg-white p-4 rounded-xl shadow">
          <p className="text-sm text-gray-500">Total Orders</p>
          <h2 className="text-xl font-semibold">{data.totalOrders}</h2>
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          <p className="text-sm text-gray-500">Total Revenue</p>
          <h2 className="text-xl font-semibold">₹{data.totalRevenue}</h2>
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          <p className="text-sm text-gray-500">Today's Orders</p>
          <h2 className="text-xl font-semibold">{data.todayOrders}</h2>
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          <p className="text-sm text-gray-500">Today's Revenue</p>
          <h2 className="text-xl font-semibold">₹{data.todayRevenue}</h2>
        </div>

      </div>

      {/* Top Items */}
      <div className="bg-white p-5 rounded-xl shadow">
        <h3 className="text-lg font-semibold mb-3">Top Selling Items</h3>

        {data.topItems.length === 0 ? (
          <p className="text-gray-500">No sales yet</p>
        ) : (
          data.topItems.map((item: any, i: number) => (
            <div key={i} className="flex justify-between text-sm py-1">
              <span>{item._id}</span>
              <span>{item.totalSold}</span>
            </div>
          ))
        )}
      </div>

    </div>
  );
};

export default Sales;