import { useState, useEffect } from 'react';
import { centerService } from '../../services/center.service';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { THEMES, applyTheme } from '../../utils/themes';

const EMPTY_FORM = {
  name: '', address: '', phone: '', email: '', website: '',
  theme: 'sneat', themeColor: '#696CFF',
  latitude: '', longitude: '',
};

// Mini sidebar preview strip rendered inside each theme card
const ThemePreview = ({ palette, name }) => (
  <div className="w-full rounded-lg overflow-hidden border border-gray-100 flex" style={{ height: 56 }}>
    {/* Sidebar strip */}
    <div className="flex flex-col justify-between p-1.5" style={{ width: 18, backgroundColor: palette[700] }}>
      {[1,2,3,4].map(i => (
        <div key={i} className="rounded-sm" style={{ height: 3, backgroundColor: i === 1 ? '#fff' : palette[500], opacity: i === 1 ? 1 : 0.5 }} />
      ))}
    </div>
    {/* Content area */}
    <div className="flex-1 p-1.5 bg-gray-50 flex flex-col gap-1">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="h-1.5 rounded-full w-10 bg-gray-200" />
        <div className="h-4 w-4 rounded-full" style={{ backgroundColor: palette[600] }} />
      </div>
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-1 flex-1">
        {[palette[600], palette[500]].map((c, i) => (
          <div key={i} className="rounded" style={{ backgroundColor: c + (i === 0 ? '' : '30'), height: '100%' }} />
        ))}
      </div>
    </div>
  </div>
);

const CenterSettings = () => {
  const [centers, setCenters]       = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [form, setForm]             = useState(EMPTY_FORM);
  const [loadingCenters, setLoadingCenters] = useState(true);
  const [saving, setSaving]         = useState(false);
  const [success, setSuccess]       = useState('');
  const [error, setError]           = useState('');

  // Selected theme object (for live preview while picking)
  const activeTheme = THEMES.find(t => t.value === form.theme);

  // Load all centers for SA to pick from
  useEffect(() => {
    centerService.list({ limit: 100 })
      .then(({ data }) => {
        setCenters(data.data || []);
        if (data.data?.length > 0) setSelectedId(data.data[0].id);
      })
      .finally(() => setLoadingCenters(false));
  }, []);

  // Load selected center's settings into form
  useEffect(() => {
    if (!selectedId) return;
    centerService.getById(selectedId).then(({ data }) => {
      const c = data.data;
      setForm({
        name:       c.name       || '',
        address:    c.address    || '',
        phone:      c.phone      || '',
        email:      c.email      || '',
        website:    c.website    || '',
        theme:      c.theme      || 'sneat',
        themeColor: c.themeColor || '#696CFF',
        latitude:   c.latitude   != null ? String(c.latitude)  : '',
        longitude:  c.longitude  != null ? String(c.longitude) : '',
      });
    });
  }, [selectedId]);

  const pickTheme = (t) => {
    setForm(f => ({ ...f, theme: t.value, themeColor: t.color }));
    // Live preview while selecting (not saved yet)
    applyTheme(t.value, t.color);
  };

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
      await centerService.update(selectedId, payload);
      applyTheme(form.theme, form.themeColor);
      setSuccess('Center settings saved successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const centerOptions = centers.map(c => ({ value: c.id, label: c.name }));

  if (loadingCenters) return <div className="text-center py-12 text-gray-400">Loading…</div>;
  if (centers.length === 0) return <div className="text-center py-12 text-gray-400">No centers found. Create a center first.</div>;

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Center Settings</h1>

      {/* Center Selector */}
      <Card title="Select Center">
        <Select
          label="Configure settings for"
          value={selectedId}
          onChange={e => { setSelectedId(e.target.value); setSuccess(''); setError(''); }}
          options={centerOptions}
        />
      </Card>

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
          <p className="text-xs text-gray-500 mb-3">Used for map display. Find coordinates at maps.google.com.</p>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Latitude"  value={form.latitude}  onChange={e => setForm(f=>({...f,latitude:e.target.value}))}  placeholder="e.g. 14.5995" />
            <Input label="Longitude" value={form.longitude} onChange={e => setForm(f=>({...f,longitude:e.target.value}))} placeholder="e.g. 120.9842" />
          </div>
        </Card>

        {/* ── Theme Selector ─────────────────────────────────────────────── */}
        <Card title="Theme & Branding">
          <p className="text-xs text-gray-500 mb-5">
            Choose a colour theme for this center's interface. Click a theme to preview it live — changes apply to everyone in this center when saved.
          </p>

          {/* Theme cards grid */}
          <div className="grid grid-cols-5 gap-3">
            {THEMES.map(t => {
              const isActive = form.theme === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => pickTheme(t)}
                  className={`group relative flex flex-col gap-2 p-2 rounded-xl border-2 transition-all text-left ${
                    isActive
                      ? 'shadow-lg ring-2 ring-offset-2'
                      : 'border-gray-100 hover:border-gray-200 hover:shadow-sm'
                  }`}
                  style={isActive ? { borderColor: t.color, ringColor: t.color } : {}}
                >
                  {/* Active badge */}
                  {isActive && (
                    <span
                      className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold shadow"
                      style={{ backgroundColor: t.color }}
                    >
                      ✓
                    </span>
                  )}

                  {/* Mini UI preview */}
                  <ThemePreview palette={t.palette} name={t.label} />

                  {/* Color dot + name */}
                  <div className="flex items-center gap-1.5 px-0.5">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: t.color }} />
                    <span className="text-xs font-semibold text-gray-800 truncate">{t.label}</span>
                  </div>
                  <span className="text-[10px] text-gray-400 px-0.5 leading-tight">{t.tagline}</span>
                </button>
              );
            })}
          </div>

          {/* Custom colour picker */}
          <div className="mt-5 pt-4 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-600 mb-2">Or pick a custom colour</p>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.themeColor}
                onChange={e => {
                  const hex = e.target.value;
                  setForm(f => ({ ...f, themeColor: hex, theme: 'custom' }));
                  applyTheme('custom', hex);
                }}
                className="h-10 w-12 rounded-lg cursor-pointer border border-gray-200 p-0.5"
              />
              <div>
                <p className="text-sm font-mono text-gray-700">{form.themeColor}</p>
                {form.theme === 'custom' && (
                  <p className="text-xs text-gray-400">Custom theme active</p>
                )}
              </div>
            </div>
          </div>

          {/* Live preview banner */}
          <div
            className="mt-4 p-4 rounded-xl flex items-center gap-4 transition-all duration-300"
            style={{ backgroundColor: form.themeColor + '18', borderLeft: `4px solid ${form.themeColor}` }}
          >
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-sm flex-shrink-0"
              style={{ backgroundColor: form.themeColor }}>
              SE
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: form.themeColor }}>
                {form.name || 'Your Center Name'}
              </p>
              <p className="text-xs text-gray-500">
                {activeTheme ? `${activeTheme.label} theme` : 'Custom theme'} · SMART ECCD preview
              </p>
            </div>
            <div className="ml-auto flex gap-1.5">
              {[form.themeColor, form.themeColor + '80', form.themeColor + '40'].map((c, i) => (
                <div key={i} className="w-4 h-4 rounded-full" style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
        </Card>

        <Button type="submit" loading={saving}>Save Settings</Button>
      </form>
    </div>
  );
};

export default CenterSettings;
