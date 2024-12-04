import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Link } from 'react-router-dom';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
}

const ClientList: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    const fetchClients = async () => {
      const querySnapshot = await getDocs(collection(db, 'clients'));
      const clientList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Client));
      setClients(clientList);
    };

    fetchClients();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Clients</h1>
        <Link
          to="/clients/new"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Add New Client
        </Link>
      </div>
      <div className="grid gap-4">
        {clients.map((client) => (
          <div
            key={client.id}
            className="border p-4 rounded shadow hover:shadow-md transition-shadow"
          >
            <Link to={`/clients/${client.id}`}>
              <h2 className="text-xl font-semibold">{client.name}</h2>
              <p className="text-gray-600">{client.email}</p>
              <p className="text-gray-600">{client.phone}</p>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClientList;
