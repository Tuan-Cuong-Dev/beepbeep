'use client';

import { useEffect, useMemo, useState } from 'react';
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
import type { AddressCore } from '@/src/lib/locations/addressTypes';
import { useTranslation } from 'react-i18next';
import UserSearch from '@/src/components/users/UserSearch';

export default function Users() {
  const { t } = useTranslation('common');

  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);

  const [user, setUser] = useState<Partial<User>>({
    firstName: '',
    lastName: '',
    name: '',
    email: '',
    phone: '',
    photoURL: '',
    role: 'customer',
    profileAddress: {
      line1: '',
      line2: '',
      locality: '',
      adminArea: '',
      postalCode: '',
      countryCode: '',
      formatted: '',
    } as AddressCore,
    homeAirport: '',
  });
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // ===== Pagination (applies on filtered list) =====
  const USERS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil((filteredUsers.length || 0) / USERS_PER_PAGE));
  const paginatedUsers = useMemo(
    () =>
      filteredUsers.slice(
        (currentPage - 1) * USERS_PER_PAGE,
        currentPage * USERS_PER_PAGE,
      ),
    [filteredUsers, currentPage],
  );

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
      setFilteredUsers(list); // default filtered = all
      setCurrentPage(1);
    };
    fetchUsers();
  }, []);

  // Ensure current page stays valid when filter changes
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

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
    onConfirm?: () => void,
  ) => {
    setDialog({ open: true, title, description: '', type, onConfirm });
  };

  const addOrUpdateUser = async () => {
    const fullName =
      user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`.trim()
        : user.name || '';

    const userData: Partial<User> = {
      ...user,
      name: fullName,
    };

    try {
      if (editingUser) {
        const ref = doc(db, 'users', editingUser.uid);
        await updateDoc(ref, {
          ...userData,
          updatedAt: Timestamp.now(),
        });

        setUsers((prev) =>
          prev.map((u) =>
            u.uid === editingUser.uid
              ? ({ ...u, ...userData, updatedAt: Timestamp.now() } as User)
              : u,
          ),
        );

        // reflect in filtered list, too
        setFilteredUsers((prev) =>
          prev.map((u) =>
            u.uid === editingUser.uid
              ? ({ ...u, ...userData, updatedAt: Timestamp.now() } as User)
              : u,
          ),
        );

        notify(t('user_notify.updated', '✅ User updated!'), 'success');
        setEditingUser(null);
      } else {
        const ref = await addDoc(collection(db, 'users'), {
          ...userData,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });

        const created: User = {
          ...(userData as User),
          uid: ref.id,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };

        setUsers((prev) => [...prev, created]);
        setFilteredUsers((prev) => [
          ...prev,
          created,
        ]);

        notify(t('user_notify.added', '✅ User added!'), 'success');
      }
    } catch (err) {
      console.error('User save failed:', err);
      notify(t('user_notify.save_failed', '❌ Failed to save user.'), 'error');
    }

    setUser({
      firstName: '',
      lastName: '',
      name: '',
      email: '',
      phone: '',
      photoURL: '',
      role: 'customer',
      profileAddress: {
        line1: '',
        line2: '',
        locality: '',
        adminArea: '',
        postalCode: '',
        countryCode: '',
        formatted: '',
      },
      homeAirport: '',
    });
  };

  const deleteUser = async (uid: string) => {
    setDialog({
      open: true,
      type: 'confirm',
      title: t('user_notify.delete_confirm_title', 'Delete user?'),
      description: t('user_notify.delete_confirm_desc', 'This action cannot be undone.'),
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'users', uid));
          setUsers((prev) => prev.filter((u) => u.uid !== uid));
          setFilteredUsers((prev) => prev.filter((u) => u.uid !== uid));
          notify(t('user_notify.deleted', '🗑️ User deleted.'), 'success');
        } catch (error) {
          console.error('Delete failed:', error);
          notify(t('user_notify.delete_failed', '❌ Failed to delete user.'), 'error');
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
      profileAddress: userToEdit.profileAddress ?? {
        line1: '',
        line2: '',
        locality: '',
        adminArea: '',
        postalCode: '',
        countryCode: '',
        formatted: '',
      },
      homeAirport: userToEdit.homeAirport || '',
    });
  };

  // ===== Search wiring =====
  const handleSearchResult = (filtered: User[]) => {
    setFilteredUsers(filtered);
    setCurrentPage(1); // reset to first page whenever search changes
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <UserTopMenu />
      <div className="p-6">
        <h1 className="mb-4 border-b-2 border-[#00d289] pb-2 text-2xl font-semibold">
          {t('user_page.title', 'Users Management')}
        </h1>

        {/* Search + quick meta */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <UserSearch users={users} onResult={handleSearchResult} />
          <div className="text-sm text-gray-600">
            {t('user_page.showing', 'Showing')} {paginatedUsers.length} {t('user_page.of', 'of')}{' '}
            {filteredUsers.length} {t('user_page.filtered_users', 'filtered users')}
          </div>
        </div>

        {/* Summary reacts to current filtered list */}
        <UserSummaryCard users={filteredUsers} />

        <UserTable users={paginatedUsers} onEdit={handleEditUser} onDelete={deleteUser} />

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-center gap-4">
          <button
            className={`px-4 py-2 rounded border text-sm transition
              ${
                currentPage === 1
                  ? 'cursor-not-allowed border-gray-200 bg-white text-gray-400'
                  : 'border-gray-300 text-gray-800 hover:bg-gray-100'
              }`}
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            {t('pagination.previous', 'Previous')}
          </button>

          <span className="text-sm text-gray-600">
            {t('pagination.page', 'Page')} {currentPage} {t('pagination.of', 'of')} {totalPages}
          </span>

          <button
            className={`px-4 py-2 rounded border text-sm transition
              ${
                currentPage === totalPages
                  ? 'cursor-not-allowed border-gray-200 bg-white text-gray-400'
                  : 'border-gray-300 text-gray-800 hover:bg-gray-100'
              }`}
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          >
            {t('pagination.next', 'Next')}
          </button>
        </div>

        {/* Form */}
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
