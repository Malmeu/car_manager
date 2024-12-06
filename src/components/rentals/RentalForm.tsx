import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, addDoc, collection, getDocs, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
}

interface Client {
  id: string;
  name: string;
}

interface RentalFormData {
  vehicleId: string;
  clientId: string;
  startDate: string;
  endDate: string;
  dailyRate: number;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  withDriver: boolean;
  driverCost: number;
  paymentStatus: 'pending' | 'partial' | 'paid';
  paidAmount: number;
}

const RentalForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [formData, setFormData] = useState<RentalFormData>({
    vehicleId: '',
    clientId: '',
    startDate: '',
    endDate: '',
    dailyRate: 0,
    status: 'pending',
    withDriver: false,
    driverCost: 0,
    paymentStatus: 'pending',
    paidAmount: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      // Fetch vehicles
      const vehiclesSnapshot = await getDocs(collection(db, 'vehicles'));
      const vehiclesList = vehiclesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Vehicle));
      setVehicles(vehiclesList);

      // Fetch clients
      const clientsSnapshot = await getDocs(collection(db, 'clients'));
      const clientsList = clientsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Client));
      setClients(clientsList);

      // Fetch rental if editing
      if (id) {
        const rentalDoc = await getDoc(doc(db, 'rentals', id));
        if (rentalDoc.exists()) {
          setFormData(rentalDoc.data() as RentalFormData);
        }
      }
    };

    fetchData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const startTimestamp = Timestamp.fromDate(new Date(formData.startDate));
      const endTimestamp = Timestamp.fromDate(new Date(formData.endDate));
      
      // Calculer le nombre de jours
      const days = Math.ceil((endTimestamp.toDate().getTime() - startTimestamp.toDate().getTime()) / (1000 * 3600 * 24));
      
      // Calculer le coût total (location + chauffeur si applicable)
      const rentalCost = days * formData.dailyRate;
      const driverTotalCost = formData.withDriver ? days * formData.driverCost : 0;
      const totalCost = rentalCost + driverTotalCost;

      const rentalData = {
        vehicleId: formData.vehicleId,
        customerId: formData.clientId,
        startDate: startTimestamp,
        endDate: endTimestamp,
        totalCost,
        status: formData.status,
        paymentStatus: formData.paymentStatus,
        paidAmount: formData.paymentStatus === 'paid' ? totalCost : 
                   formData.paymentStatus === 'partial' ? formData.paidAmount : 0,
        remainingAmount: formData.paymentStatus === 'paid' ? 0 : 
                        formData.paymentStatus === 'partial' ? totalCost - formData.paidAmount : totalCost,
        wilaya: '',
        contractId: '',
        paymentMethod: 'cash',
        userId: currentUser?.uid || '',
        withDriver: formData.withDriver,
        driverCost: formData.driverCost
      };

      if (id) {
        await updateDoc(doc(db, 'rentals', id), rentalData);
      } else {
        await addDoc(collection(db, 'rentals'), rentalData);
      }

      navigate('/rentals');
    } catch (error) {
      console.error('Error saving rental:', error);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'dailyRate' || name === 'driverCost' || name === 'paidAmount' ? parseFloat(value) : value
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
                {client.name}
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
            value={formData.startDate}
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
            value={formData.endDate}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Daily Rate
          </label>
          <input
            type="number"
            name="dailyRate"
            value={formData.dailyRate}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
            min="0"
            step="0.01"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            With Driver
          </label>
          <input
            type="checkbox"
            name="withDriver"
            checked={formData.withDriver}
            onChange={handleChange}
            className="mr-2"
          />
        </div>
        {formData.withDriver && (
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Driver Cost
            </label>
            <input
              type="number"
              name="driverCost"
              value={formData.driverCost}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
              min="0"
              step="0.01"
            />
          </div>
        )}
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
            <option value="pending">Pending</option>
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
