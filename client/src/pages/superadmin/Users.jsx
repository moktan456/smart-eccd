import { useState, useEffect } from 'react';
import { userService } from '../../services/user.service';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import { ROLE_LABELS } from '../../utils/constants';

const roleColor = { SUPER_ADMIN: 'purple', CENTER_MANAGER: 'blue', TEACHER: 'green', PARENT: 'gray' };

const SaUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userService.list({ limit: 50 }).then(({ data }) => setUsers(data.data)).finally(() => setLoading(false));
  }, []);

  const toggle = async (id) => {
    await userService.toggleActivation(id);
    setUsers(u => u.map(x => x.id === id ? {...x, isActive: \!x.isActive} : x));
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role', render: r => <Badge color={roleColor[r.role]}>{ROLE_LABELS[r.role]}</Badge> },
    { key: 'isActive', label: 'Status', render: r => <Badge color={r.isActive ? 'green' : 'gray'}>{r.isActive ? 'Active' : 'Inactive'}</Badge> },
    { key: 'actions', label: '', render: r => <Button size="sm" variant={r.isActive ? 'danger' : 'secondary'} onClick={() => toggle(r.id)}>{r.isActive ? 'Deactivate' : 'Activate'}</Button> },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Users</h1>
      <Card><Table columns={columns} data={users} loading={loading} /></Card>
    </div>
  );
};
export default SaUsers;
