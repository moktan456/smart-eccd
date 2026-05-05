import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { activityService } from '../../services/activity.service';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const TeacherActivityAssign = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activity, setActivity] = useState(null);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ classId: '', scheduledDate: '', scheduledTime: '09:00' });

  useEffect(() => {
    Promise.all([
      activityService.getById(id),
      api.get('/classes'),
    ]).then(([actRes, clsRes]) => {
      setActivity(actRes.data.data);
      const myClasses = clsRes.data.data || [];
      setClasses(myClasses);
      if (myClasses.length > 0) setForm(f => ({ ...f, classId: myClasses[0].id }));
    });
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await activityService.assign(id, { ...form, teacherId: user?.id });
      navigate('/teacher/activities');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!activity) return <LoadingSpinner className="mt-20" />;

  const classOptions = classes.map(c => ({ value: c.id, label: c.name }));

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Assign Activity</h1>
      <Card title={activity.title}>
        <p className="text-sm text-gray-500">{activity.description}</p>
      </Card>
      {classes.length === 0 ? (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
          You are not assigned to any class yet. Ask your center manager to assign you to a class first.
        </div>
      ) : (
        <Card title="Assignment Details">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Select label="Class" value={form.classId} onChange={e => setForm(f=>({...f,classId:e.target.value}))} options={classOptions} required />
            <Input label="Scheduled Date" type="date" value={form.scheduledDate} onChange={e => setForm(f=>({...f,scheduledDate:e.target.value}))} required />
            <Input label="Scheduled Time" type="time" value={form.scheduledTime} onChange={e => setForm(f=>({...f,scheduledTime:e.target.value}))} required />
            <div className="flex gap-3">
              <Button type="submit" loading={loading}>Assign</Button>
              <Button type="button" variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
};

export default TeacherActivityAssign;
