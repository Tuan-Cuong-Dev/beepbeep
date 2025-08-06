'use client';

import { useEffect, useState } from 'react';
import {
  getAllCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from '@/src/lib/services/customers/customerService';
import { Customer } from '@/src/lib/customers/customerTypes';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import UserTopMenu from '@/src/components/landingpage/UserTopMenu';
import CustomerForm from '@/src/components/customers/customerForm';
import CustomerTable from '@/src/components/customers/customerTable';
import NotificationDialog from '@/src/components/ui/NotificationDialog';
import { useUser } from '@/src/context/AuthContext';
import { db } from '@/src/firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import { useTranslation } from 'react-i18next'; // ✅ thêm

const initialCustomer = {
  userId: '',
  name: '',
  email: '',
  phone: '',
  address: '',
  dateOfBirth: null,
  driverLicense: '',
  idNumber: '',
  nationality: '',
  sex: undefined,
  placeOfOrigin: '',
  placeOfResidence: '',
  companyId: '',
};

const ITEMS_PER_PAGE = 10;

export default function CustomersPage() {
  const { companyId, role } = useUser();
  const { t } = useTranslation('common'); // ✅ dùng common
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [newCustomer, setNewCustomer] = useState<Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>>(initialCustomer);
  const [currentPage, setCurrentPage] = useState(1);
  const [companyMap, setCompanyMap] = useState<Record<string, string>>({});

  const [dialog, setDialog] = useState({
    open: false,
    type: 'info' as 'success' | 'error' | 'info' | 'confirm',
    title: '',
    description: '',
    onConfirm: undefined as (() => void) | undefined,
  });

  const totalPages = Math.ceil(customers.length / ITEMS_PER_PAGE);
  const paginatedCustomers = customers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const showDialog = (
    type: 'success' | 'error' | 'info',
    title: string,
    description = ''
  ) => {
    setDialog({ open: true, type, title, description, onConfirm: undefined });
  };

  const confirmDelete = (id: string) => {
    const customer = customers.find((c) => c.id === id);
    if (!customer) return;

    setDialog({
      open: true,
      type: 'confirm',
      title: t('customers_page.dialog.delete_title', { name: customer.name }), // ✅
      description: t('customers_page.dialog.delete_description'), // ✅
      onConfirm: async () => {
        try {
          await deleteCustomer(id);
          setCustomers(customers.filter((c) => c.id !== id));
          setDialog((prev) => ({ ...prev, open: false }));
          showDialog('success', t('customers_page.dialog.delete_success')); // ✅
        } catch (_err) {
          showDialog('error', t('customers_page.dialog.delete_error')); // ✅
        }
      },
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      const data = await getAllCustomers(companyId, role);
      setCustomers(data);
      setCurrentPage(1);
    };
    fetchData();
  }, [companyId, role]);

  useEffect(() => {
    const fetchCompanies = async () => {
      const snapshot = await getDocs(collection(db, 'rentalCompanies'));
      const map: Record<string, string> = {};
      snapshot.forEach((doc) => {
        const data = doc.data();
        map[doc.id] = data.name;
      });
      setCompanyMap(map);
    };
    fetchCompanies();
  }, []);

  const saveCustomer = async () => {
    try {
      if (!companyId) {
        showDialog('error', t('customers_page.dialog.missing_company')); // ✅
        return;
      }

      const customerData = { ...newCustomer, companyId };

      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, customerData);
        setCustomers(customers.map(c => c.id === editingCustomer.id ? { ...c, ...customerData } : c));
        showDialog('success', t('customers_page.dialog.update_success')); // ✅
        setEditingCustomer(null);
      } else {
        const created = await createCustomer(customerData);
        setCustomers([...customers, created]);
        showDialog('success', t('customers_page.dialog.save_success')); // ✅
      }

      setNewCustomer({ ...initialCustomer, companyId });
    } catch (error) {
      console.error('❌ Error in saveCustomer:', error);
      showDialog('error', t('customers_page.dialog.save_error')); // ✅
    }
  };

  const handleEdit = (customer: Customer) => {
    const { id, createdAt, updatedAt, ...dataForForm } = customer;
    setEditingCustomer(customer);
    setNewCustomer(dataForForm);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <UserTopMenu />
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-4 border-[#00d289] border-b-2 pb-2">
          {t('customers_page.title')} {/* ✅ */}
        </h1>

        <CustomerTable
          customers={paginatedCustomers}
          onEdit={handleEdit}
          onDelete={confirmDelete}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          companyMap={companyMap}
        />

        <div className="flex justify-center items-center gap-4 mt-4 text-sm">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded text-gray-600 border ${currentPage === 1 ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:bg-gray-50 border-gray-300'}`}
          >
            {t('customers_page.pagination.previous')} {/* ✅ */}
          </button>

          <span className="text-gray-700">
            {t('customers_page.pagination.page', { current: currentPage, total: totalPages })} {/* ✅ */}
          </span>

          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className={`px-4 py-2 rounded text-gray-600 border ${currentPage === totalPages ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:bg-gray-50 border-gray-300'}`}
          >
            {t('customers_page.pagination.next')} {/* ✅ */}
          </button>
        </div>

        <CustomerForm
          editingCustomer={editingCustomer}
          newCustomer={newCustomer}
          setNewCustomer={setNewCustomer}
          onSave={saveCustomer}
          onCancel={() => {
            setEditingCustomer(null);
            setNewCustomer({ ...initialCustomer, companyId: companyId || '' });
          }}
          companyMap={companyMap}
        />
      </div>
      <Footer />

      <NotificationDialog
        open={dialog.open}
        type={dialog.type}
        title={dialog.title}
        description={dialog.description}
        onClose={() => setDialog((prev) => ({ ...prev, open: false }))}
        onConfirm={dialog.onConfirm}
      />
    </div>
  );
}
