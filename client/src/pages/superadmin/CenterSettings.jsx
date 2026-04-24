import { useState, useEffect } from 'react';
import useAuthStore from '../../store/authStore';
import { centerService } from '../../services/center.service';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

const THEMES = [
  { value: 'default', label: 'Indigo',  color: '#4F46E5' },
  { value: 'ocean',   label: 'Ocean',   color: '#0EA5E9' },
  { value: 'forest',  label: 'Forest',  color: '#16A34A' },
  { value: 'sunset',  label: 'Sunset',  color: '#EA580C' },
  { value: 'rose',    label: 'Rose',    color: '#E11D48' },
];

const CenterSettings = () => {
  const { user } = useAuthStore();
  const [center, setCenter] = useState(null);
  const [form, setForm] = useState({
    name: '', address: '', phone: '', email: '', website: '',
    theme: 'default', themeColor: '#4F46E5',
    latitude: '', longitude: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.centerId) { setLoading(false); return; }
    centerService.getById(user.centerId).then(({ data }) => {
      const c = data.data;
      setCenter(c);
      setForm({
        name:       c.name       || '',
        address:    c.address    || '',
        phone:      c.phone      || '',
        email:      c.email      || '',
        website:    c.website    || '',
        theme:      c.theme      || 'default',
        themeColor: c.themeColor || '#4F46E5',
        latitude:   c.latitude   != null ? String(c.latitude)  : '',
        longitude:  c.longitude  != null ? String(c.longitude) : '',
      });
    }).finally(() => setLoading(false));
  }, [user?.centerId]);

  const pickTheme = (t) => setForm(f => ({ ...f, theme: t.value, themeColor: t.color }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = { ...form };
      if (payload.latitude)  payload.latitude  = parseFloat(payload.latitude);
      if (payload.longitude) payload.longitude = parseFloat(payload.longitude);
      if (!payload.latitude)  delete payload.latitude;
      if (!payload.longitude) delete payload.longitude;
      await centerService.update(user.centerId, payload);
      setSuccess('Center settings saved successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-12 text-gray-400">Loading…</div>;

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Center Settings</h1>

      {error   && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
      {success && <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card title="Basic Information">
          <div className="space-y-4">
            <Input label="Center Name"    value={form.name}    onChange={e => setForm(f=>({...f,name:e.target.value}))} required />
            <Input label="Address"        value={form.address} onChange={e => setForm(f=>({...f,address:e.target.value}))} required />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Phone"        value={form.phone}   onChange={e => setForm(f=>({...f,phone:e.target.value}))} />
              <Input label="Email"        type="email" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} />
            </div>
            <Input label="Website (optional)" value={form.website} onChange={e => setForm(f=>({...f,website:e.target.value}))} placeholder="https://…" />
          </div>
        </Card>

        {/* Location */}
        <Card title="Location (optional)">
          <p className="text-xs text-gray-500 mb-3">Used for map display. You can find coordinates at maps.google.com.</p>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Latitude"  value={form.latitude}  onChange={e => setForm(f=>({...f,latitude:e.target.value}))}  placeholder="e.g. 14.5995" />
            <Input label="Longitude" value={form.longitude} onChange={e => setForm(f=>({...f,longitude:e.target.value}))} placeholder="e.g. 120.9842" />
          </div>
        </Card>

        {/* Theme */}
        <Card title="Theme & Branding">
          <p className="text-xs text-gray-500 mb-4">Choose a colour theme for your center's interface.</p>
          <div className="grid grid-cols-5 gap-3">
            {THEMES.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => pickTheme(t)}
                className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${form.theme === t.value ? 'border-gray-900 shadow-md' : 'border-transparent hover:border-gray-200'}`}
              >
                <div className="w-10 h-10 rounded-full shadow-inner" style={{ backgroundColor: t.color }} />
                <span className="text-xs font-medium text-gray-700">{t.label}</span>
                {form.theme === t.value && <span className="text-xs text-gray-500">✓ Active</span>}
              </button>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Custom Colour</label>
            <input
              type="color"
              value={form.themeColor}
              onChange={e => setForm(f=>({...f,themeColor:e.target.value,theme:'default'}))}
              className="h-9 w-16 rounded cursor-pointer border border-gray-200"
            />
            <span className="text-sm text-gray-600 font-mono">{form.themeColor}</span>
          </div>

          {/* Preview */}
          <div className="mt-4 p-4 rounded-xl" style={{ backgroundColor: form.themeColor + '15', borderLeft: `4px solid ${form.themeColor}` }}>
            <p className="text-sm font-semibold" style={{ color: form.themeColor }}>{form.name || 'Your Center Name'}</p>
            <p className="text-xs text-gray-500 mt-0.5">Theme preview · SMART ECCD</p>
          </div>
        </Card>

        <Button type="submit" loading={saving}>Save Settings</Button>
      </form>
    </div>
  );
};

export default CenterSettings;
