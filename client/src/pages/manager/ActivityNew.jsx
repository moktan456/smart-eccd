import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { activityService } from '../../services/activity.service';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { BLOOM_LEVELS, BLOOM_COLORS, BLOOM_LABELS, ACTIVITY_TYPES } from '../../utils/constants';

const MgrActivityNew = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '', description: '', instructions: '',
    bloomLevels: [], activityType: 'Group', ageGroup: '',
    durationMins: 30, learningGoals: [''], status: 'PUBLISHED',
  });

  const toggleBloom = (level) => {
    setForm(f => ({
      ...f,
      bloomLevels: f.bloomLevels.includes(level)
        ? f.bloomLevels.filter(l => l \!== level)
        : [...f.bloomLevels, level],
    }));
  };

  const handleGoalChange = (i, val) => {
    const goals = [...form.learningGoals];
    goals[i] = val;
    setForm(f => ({ ...f, learningGoals: goals }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = { ...form, learningGoals: form.learningGoals.filter(Boolean) };
      await activityService.create(data);
      navigate('/manager/activities');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create activity.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Design New Activity</h1>
      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card title="Basic Information">
          <div className="space-y-4">
            <Input label="Title" value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))} required />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea className="form-input min-h-[80px]" value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
              <textarea className="form-input min-h-[100px]" value={form.instructions} onChange={e => setForm(f=>({...f,instructions:e.target.value}))} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select label="Activity Type" value={form.activityType} onChange={e => setForm(f=>({...f,activityType:e.target.value}))} options={ACTIVITY_TYPES} />
              <Input label="Age Group" value={form.ageGroup} onChange={e => setForm(f=>({...f,ageGroup:e.target.value}))} placeholder="e.g. 4-5 years" required />
            </div>
            <Input label="Duration (minutes)" type="number" value={form.durationMins} onChange={e => setForm(f=>({...f,durationMins:Number(e.target.value)}))} min={5} max={180} required />
          </div>
        </Card>

        <Card title="Bloom's Taxonomy Levels">
          <p className="text-sm text-gray-500 mb-3">Select the cognitive levels this activity targets.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {BLOOM_LEVELS.map(level => (
              <button
                key={level} type="button"
                onClick={() => toggleBloom(level)}
                className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${form.bloomLevels.includes(level) ? 'text-white border-transparent' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'}`}
                style={form.bloomLevels.includes(level) ? { backgroundColor: BLOOM_COLORS[level], borderColor: BLOOM_COLORS[level] } : {}}
              >
                {BLOOM_LABELS[level]}
              </button>
            ))}
          </div>
        </Card>

        <Card title="Learning Goals">
          <div className="space-y-2">
            {form.learningGoals.map((goal, i) => (
              <div key={i} className="flex gap-2">
                <Input className="flex-1" value={goal} onChange={e => handleGoalChange(i, e.target.value)} placeholder={`Goal ${i+1}`} />
                {form.learningGoals.length > 1 && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setForm(f => ({...f, learningGoals: f.learningGoals.filter((_, j) => j \!== i)}))}>✕</Button>
                )}
              </div>
            ))}
            <Button type="button" variant="secondary" size="sm" onClick={() => setForm(f => ({...f, learningGoals: [...f.learningGoals, '']}))}>+ Add Goal</Button>
          </div>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" loading={loading}>Create Activity</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/manager/activities')}>Cancel</Button>
        </div>
      </form>
    </div>
  );
};
export default MgrActivityNew;
