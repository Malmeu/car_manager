import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, addDoc, collection, getDocs, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { getAllCustomers, Customer } from '../../services/customerService';

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  registration: string;
  status: string;
}

interface RentalFormData {
  vehicleId: string;
  clientId: string;
  startDate: Date;
  endDate: Date;
  totalCost: number;
  status: 'active' | 'pending' | 'completed' | 'cancelled';
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  paidAmount: number;
}

const RentalForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [clients, setClients] = useState<Customer[]>([]);
  const [calculatedTotal, setCalculatedTotal] = useState<number>(0);
  const [formData, setFormData] = useState<RentalFormData>({
    vehicleId: '',
    clientId: '',
    startDate: new Date(),
    endDate: new Date(),
    totalCost: 0,
    status: 'active',
    paymentStatus: 'unpaid',
    paidAmount: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch vehicles
        const vehiclesSnapshot = await getDocs(collection(db, 'vehicles'));
        const vehiclesData = vehiclesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Vehicle[];
        setVehicles(vehiclesData);

        // Fetch customers using the new service
        const customersData = await getAllCustomers(currentUser?.uid);
        setClients(customersData);

        // Fetch rental if editing
        if (id) {
          const rentalDoc = await getDoc(doc(db, 'rentals', id));
          if (rentalDoc.exists()) {
            const data = rentalDoc.data() as RentalFormData;
            setFormData({
              ...data,
              startDate: data.startDate instanceof Timestamp ? data.startDate.toDate() : new Date(data.startDate),
              endDate: data.endDate instanceof Timestamp ? data.endDate.toDate() : new Date(data.endDate)
            });
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [id, currentUser]);

  // Calculer le coût total chaque fois que les valeurs pertinentes changent
  useEffect(() => {
    const days = Math.max(1, Math.ceil(
      (formData.endDate.getTime() - formData.startDate.getTime()) / (1000 * 3600 * 24)
    ));
    const totalCost = days * formData.totalCost;
    setCalculatedTotal(totalCost);
  }, [formData.startDate, formData.endDate, formData.totalCost]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      console.log('Form data:', formData);
      const startTimestamp = Timestamp.fromDate(formData.startDate);
      const endTimestamp = Timestamp.fromDate(formData.endDate);
      
      const days = Math.max(1, Math.ceil((endTimestamp.toDate().getTime() - startTimestamp.toDate().getTime()) / (1000 * 3600 * 24)));
      const totalCost = days * formData.totalCost;

      const rentalData = {
        vehicleId: formData.vehicleId,
        clientId: formData.clientId,
        customerId: formData.clientId,
        startDate: startTimestamp,
        endDate: endTimestamp,
        totalCost: totalCost,
        status: formData.status,
        paymentStatus: formData.paymentStatus,
        paidAmount: formData.paymentStatus === 'paid' ? totalCost : 
                   formData.paymentStatus === 'partial' ? formData.paidAmount : 0,
        remainingAmount: formData.paymentStatus === 'paid' ? 0 : 
                        formData.paymentStatus === 'partial' ? totalCost - formData.paidAmount : totalCost,
        wilaya: '',
        contractId: '',
        paymentMethod: 'cash',
        userId: currentUser?.uid || ''
      };

      console.log('Saving rental data:', rentalData);

      try {
        if (id) {
          await updateDoc(doc(db, 'rentals', id), rentalData);
          console.log('Updated existing rental:', id);
        } else {
          const docRef = await addDoc(collection(db, 'rentals'), rentalData);
          console.log('Created new rental:', docRef.id);
        }
        navigate('/rentals');
      } catch (error) {
        console.error('Error saving to Firestore:', error);
      }
    } catch (error) {
      console.error('Error in form submission:', error);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (name === 'startDate' || name === 'endDate') {
      const newDate = new Date(value);
      const otherDateField = name === 'startDate' ? 'endDate' : 'startDate';
      const otherDate = formData[otherDateField];

      // Pour la date de début
      if (name === 'startDate') {
        if (newDate > formData.endDate) {
          // Si la nouvelle date de début est après la date de fin, on met à jour la date de fin
          setFormData(prev => ({
            ...prev,
            [name]: newDate,
            endDate: newDate
          }));
          return;
        }
      }
      // Pour la date de fin
      else if (name === 'endDate') {
        if (newDate < formData.startDate) {
          alert('La date de fin doit être après la date de début');
          return;
        }
      }

      setFormData(prev => ({
        ...prev,
        [name]: newDate
      }));
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: name === 'totalCost' || name === 'paidAmount' 
        ? parseFloat(value) || 0 
        : value
    }));
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">
        {id ? 'Edit Rental' : 'New Rental'}
      </h1>
      <form onSubmit={handleSubmit} className="max-w-lg">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Vehicle
          </label>
          <select
            name="vehicleId"
            value={formData.vehicleId}
            onChange={handleChange}
            className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          >
            <option value="">Select a vehicle</option>
            {vehicles.map(vehicle => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.year} {vehicle.make} {vehicle.model}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Client
          </label>
          <select
            name="clientId"
            value={formData.clientId}
            onChange={handleChange}
            className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          >
            <option value="">Select a client</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>
                {`${client.firstName} ${client.lastName}`}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Start Date
          </label>
          <input
            type="date"
            name="startDate"
            value={formData.startDate.toISOString().split('T')[0]}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            End Date
          </label>
          <input
            type="date"
            name="endDate"
            value={formData.endDate.toISOString().split('T')[0]}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Total Cost
          </label>
          <input
            type="number"
            name="totalCost"
            value={formData.totalCost}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
            min="0"
            step="0.01"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Calculated Total
          </label>
          <input
            type="number"
            value={calculatedTotal}
            readOnly
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Status
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          >
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Payment Status
          </label>
          <select
            name="paymentStatus"
            value={formData.paymentStatus}
            onChange={handleChange}
            className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          >
            <option value="unpaid">Unpaid</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
          </select>
        </div>
        {formData.paymentStatus === 'partial' && (
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Paid Amount
            </label>
            <input
              type="number"
              name="paidAmount"
              value={formData.paidAmount}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
              min="0"
              step="0.01"
            />
          </div>
        )}
        <div className="flex gap-4">
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => navigate('/rentals')}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default RentalForm;
