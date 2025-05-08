import { useEffect, useState } from "react";
import { getPaymentData } from "../../../../helpers/user";
import ShimmerPayment from "../../../../components/common/shimmer/paymentShimmer"

const PaymentData = () => {
  const [userCard, setUserCard] = useState({});
  const [loading, setLoading] = useState(true);

  const userPayment = async () => {
    const response = await getPaymentData();
    setUserCard(response);
    setLoading(false);
  };

  useEffect(() => {
    userPayment();
  }, []);

  if (loading) {
    return <ShimmerPayment/>
  }

  return (
    <div className="space-y-6">
      {/* Cards Section */}
      <div className="bg-white shadow-lg rounded-xl border broder-gray-300 p-4">
        <h2 className="text-xl font-semibold text-gray-800 pb-1">Linked Cards</h2>
        {userCard?.cards?.length !== 0 ? <div className="space-y-4">
          {userCard?.cards?.map((card) => (
            <div
              key={card.id}
              className="flex justify-between items-center p-4 border-b md:flex-row flex-col"
            >
              <div>
                <span className="text-gray-700 font-semibold">Brand:</span>{" "}
                {card.brand.toUpperCase()}
                <div className="text-sm font-semibold text-gray-500 py-2">
                 <span className="text-black font-normal">Card Number : </span><span>**** **** **** {card.last4}</span>
                </div>
                <div className="text-sm text-gray-800">
                  Expiry: {card.exp_month}/{card.exp_year}
                </div>
              </div>
            </div>
          ))}
        </div>:<p className="text-center border-t py-3 text-md text-gray-600 dark:text-gray-400 italic">No cards available</p>}
      </div>

      {/* Payment History Section */}
      <div className="bg-white shadow-md rounded-xl p-4 border broder-gray-300 mb-12" style={{marginBottom: "20px"}}>
        <h2 className="text-xl font-semibold text-gray-800 mb-1">Payment Records</h2>
        {userCard?.payments?.length !== 0 ? <div className="mt-4 space-y-4">
          {userCard?.payments?.map((payment) => (
            <div
              key={payment?.id}
              className="flex justify-between items-center p-4 border-b md:flex-row flex-col"
            >
              <div>
                <div className="text-gray-700">
                  <span className="font-semibold">Amount :</span> ${payment?.amount}
                </div>
                <div className="text-sm text-gray-500 py-1">
                  Status: <span className="text-green-500">{payment?.status}</span>
                </div>
                <div className="text-sm text-gray-600 py-1">
                  Method: {payment?.payment_method}
                </div>
                <div className="text-sm text-gray-500">
                  Date: {new Date(payment?.created).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>:<p className="text-center border-t py-3 text-md text-gray-600 dark:text-gray-400 italic">No Payment History</p>}
      </div>
    </div>
  );
};

export default PaymentData;
