import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

interface SubscriptionData {
  isActive: boolean;
  expiryDate: string;
  plan: string;
}

const TestSubscriptionSystem: React.FC = () => {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const docRef = doc(db, 'subscriptions', 'test');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setSubscription(docSnap.data() as SubscriptionData);
        } else {
          // Initialize with default test subscription
          const defaultSubscription: SubscriptionData = {
            isActive: true,
            expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
            plan: 'test'
          };
          await setDoc(docRef, defaultSubscription);
          setSubscription(defaultSubscription);
        }
      } catch (error) {
        console.error('Error fetching subscription:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, []);

  if (loading) {
    return <div>Loading subscription status...</div>;
  }

  const daysRemaining = subscription
    ? Math.ceil((new Date(subscription.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="bg-white shadow rounded-lg p-4 mb-4">
      <h2 className="text-xl font-semibold mb-2">Test Subscription Status</h2>
      {subscription && (
        <div>
          <p className="mb-2">
            Status:{' '}
            <span
              className={`font-semibold ${
                subscription.isActive ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {subscription.isActive ? 'Active' : 'Inactive'}
            </span>
          </p>
          <p className="mb-2">Plan: {subscription.plan}</p>
          <p className="mb-2">Days Remaining: {daysRemaining}</p>
          <p className="text-sm text-gray-600">
            Expires: {new Date(subscription.expiryDate).toLocaleDateString()}
          </p>
        </div>
      )}
    </div>
  );
};

export default TestSubscriptionSystem;
