'use client';

import { useEffect, useState } from 'react';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import UserTopMenu from '@/src/components/landingpage/UserTopMenu';
import { User } from '@/src/lib/users/userTypes';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import UserForm from '@/src/components/users/UserForm';
import UserTable from '@/src/components/users/UserTable';
import NotificationDialog from '@/src/components/ui/NotificationDialog';
import UserSummaryCard from '@/src/components/users/UserSummaryCard';

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [user, setUser] = useState<Partial<User>>({
    firstName: '',
    lastName: '',
    name: '',
    email: '',
    phone: '',
    photoURL: '',
    role: 'customer',
    address: '',
    address2: '',
    city: '',
    state: '',
    zip: '',
    country: '',
    homeAirport: '',
  });
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const USERS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(users.length / USERS_PER_PAGE);
  const paginatedUsers = users.slice(
    (currentPage - 1) * USERS_PER_PAGE,
    currentPage * USERS_PER_PAGE
  );

  const [dialog, setDialog] = useState({
    open: false,
    title: '',
    description: '',
    type: 'info' as 'success' | 'error' | 'info' | 'confirm',
    onConfirm: undefined as (() => void) | undefined,
  });

  const notify = (
    title: string,
    type: 'success' | 'error' | 'info' | 'confirm' = 'info',
    onConfirm?: () => void
  ) => {
    setDialog({ open: true, title, description: '', type, onConfirm });
  };

  useEffect(() => {
    const fetchUsers = async () => {
      const snapshot = await getDocs(collection(db, 'users'));
      const list = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          ...(data as User),
          uid: docSnap.id,
        };
      });
      setUsers(list);
    };
    fetchUsers();
  }, []);

  const addOrUpdateUser = async () => {
    const fullName =
      user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`.trim()
        : user.name || '';

    const userData = {
      ...user,
      name: fullName,
    } as Partial<User>;

    const now = new Date();
    const nowTimestamp = Timestamp.fromDate(now);

    try {
      if (editingUser) {
        const ref = doc(db, 'users', editingUser.uid);
        await updateDoc(ref, {
          ...userData,
          updatedAt: now,
        });

        setUsers((prev) =>
          prev.map((u) =>
            u.uid === editingUser.uid
              ? { ...u, ...userData, updatedAt: now } as User
              : u
          )
        );

        notify('✅ User updated!', 'success');
        setEditingUser(null);
      } else {
        const ref = await addDoc(collection(db, 'users'), {
          ...userData,
          createdAt: now,
          updatedAt: now,
        });

        setUsers([
          ...users,
          {
            ...(userData as User),
            uid: ref.id,
            createdAt: now,
            updatedAt: now,
          },
        ]);

        notify('✅ User added!', 'success');
      }
    } catch (err) {
      console.error('User save failed:', err);
      notify('❌ Failed to save user.', 'error');
    }

    setUser({
      firstName: '',
      lastName: '',
      name: '',
      email: '',
      phone: '',
      photoURL: '',
      role: 'customer',
      address: '',
      address2: '',
      city: '',
      state: '',
      zip: '',
      country: '',
      homeAirport: '',
    });
  };

  const deleteUser = async (uid: string) => {
    setDialog({
      open: true,
      type: 'confirm',
      title: 'Delete user?',
      description: 'This action cannot be undone.',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'users', uid));
          setUsers(users.filter((u) => u.uid !== uid));
          notify('🗑️ User deleted.', 'success');
        } catch (error) {
          console.error('Delete failed:', error);
          notify('❌ Failed to delete user.', 'error');
        }
      },
    });
  };

  const handleEditUser = (userToEdit: User) => {
    setEditingUser(userToEdit);
    setUser({
      firstName: userToEdit.firstName || '',
      lastName: userToEdit.lastName || '',
      name: userToEdit.name || '',
      email: userToEdit.email || '',
      phone: userToEdit.phone || '',
      photoURL: userToEdit.photoURL || '',
      role: userToEdit.role || 'customer',
      address: userToEdit.address || '',
      address2: userToEdit.address2 || '',
      city: userToEdit.city || '',
      state: userToEdit.state || '',
      zip: userToEdit.zip || '',
      country: userToEdit.country || '',
      homeAirport: userToEdit.homeAirport || '',
    });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <UserTopMenu />
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-4 border-[#00d289] border-b-2 pb-2">
          Users Management
        </h1>
        <UserSummaryCard users={users} />
        <UserTable users={paginatedUsers} onEdit={handleEditUser} onDelete={deleteUser} />

        {/* Pagination */}
        <div className="flex justify-center items-center gap-4 mt-4">
          <button
            className={`px-4 py-2 rounded border text-sm transition
              ${currentPage === 1
                ? 'text-gray-400 border-gray-200 bg-white cursor-not-allowed'
                : 'text-gray-800 border-gray-300 hover:bg-gray-100'}
            `}
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            Previous
          </button>

          <span className="text-gray-600 text-sm">
            Page {currentPage} of {totalPages}
          </span>

          <button
            className={`px-4 py-2 rounded border text-sm transition
              ${currentPage === totalPages
                ? 'text-gray-400 border-gray-200 bg-white cursor-not-allowed'
                : 'text-gray-800 border-gray-300 hover:bg-gray-100'}
            `}
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Next
          </button>
        </div>

        <UserForm
          user={user}
          setUser={setUser}
          editingUser={editingUser}
          setEditingUser={setEditingUser}
          onSubmit={addOrUpdateUser}
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
