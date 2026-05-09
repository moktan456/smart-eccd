import { useState, useEffect, useRef } from 'react';
import { centerService } from '../../services/center.service';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { THEMES, applyTheme } from '../../utils/themes';
import { CURRENCIES, saveCenterCurrency } from '../../utils/currency';

const EMPTY_FORM = {
  name: '', address: '', phone: '', email: '', website: '',
  logo: '',
  theme: 'sneat', themeColor: '#696CFF',
  currency: 'USD',
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

// Crop the source image to a centered square then scale to `size`×`size` px.
// Returns a base64 JPEG data-URL.
const cropAndResize = (file, size = 128) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img  = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const side = Math.min(img.width, img.height);
      const sx   = (img.width  - side) / 2;
      const sy   = (img.height - side) / 2;
      const canvas = document.createElement('canvas');
      canvas.width  = size;
      canvas.height = size;
      canvas.getContext('2d').drawImage(img, sx, sy, side, side, 0, 0, size, size);
      resolve(canvas.toDataURL('image/jpeg', 0.88));
    };
    img.onerror = reject;
    img.src = url;
  });

const CenterSettings = () => {
  const [centers, setCenters]       = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [form, setForm]             = useState(EMPTY_FORM);
  const [loadingCenters, setLoadingCenters] = useState(true);
  const [saving, setSaving]         = useState(false);
  const [success, setSuccess]       = useState('');
  const [error, setError]           = useState('');
  const [logoUploading, setLogoUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleLogoFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    try {
      const dataUrl = await cropAndResize(file, 128);
      setForm(f => ({ ...f, logo: dataUrl }));
    } finally {
      setLogoUploading(false);
      e.target.value = '';
    }
  };

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
        logo:       c.logo       || '',
        theme:      c.theme      || 'sneat',
        themeColor: c.themeColor || '#696CFF',
        currency:   c.currency   || 'USD',
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
      saveCenterCurrency(form.currency);
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

        {/* Logo */}
        <Card title="Center Logo">
          <p className="text-xs text-gray-500 mb-4">
            Displayed in the sidebar and on printed reports. Upload a file or paste a URL — images are automatically cropped to a 128×128 px square.
          </p>
          <div className="flex items-start gap-5">
            {/* Preview */}
            <div className="flex-shrink-0">
              {form.logo ? (
                <img
                  src={form.logo}
                  alt="Center logo"
                  className="w-20 h-20 rounded-xl object-cover border border-gray-200 shadow-sm"
                  onError={e => { e.currentTarget.style.display = 'none'; }}
                />
              ) : (
                <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center gap-1 text-gray-400">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-[10px] font-medium">No logo</span>
                </div>
              )}
            </div>

            {/* Inputs */}
            <div className="flex-1 space-y-3">
              {/* File upload */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoFile}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={logoUploading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors disabled:opacity-50"
              >
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                {logoUploading ? 'Processing…' : 'Upload Image'}
              </button>

              {/* URL fallback */}
              <Input
                label="Or paste a logo URL"
                value={form.logo.startsWith('data:') ? '' : form.logo}
                onChange={e => setForm(f => ({ ...f, logo: e.target.value }))}
                placeholder="https://example.com/logo.png"
              />

              {form.logo && (
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, logo: '' }))}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Remove logo
                </button>
              )}
            </div>
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

        {/* ── Currency ───────────────────────────────────────────────────── */}
        <Card title="Currency">
          <p className="text-xs text-gray-500 mb-4">Sets the currency symbol used across fees and financial records for this center.</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CURRENCIES.map(c => {
              const isActive = form.currency === c.code;
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, currency: c.code }))}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                    isActive ? 'shadow-md' : 'border-gray-100 hover:border-gray-200'
                  }`}
                  style={isActive ? { borderColor: form.themeColor, backgroundColor: form.themeColor + '10' } : {}}
                >
                  <span className="text-2xl">{c.flag}</span>
                  <span className="text-lg font-bold text-gray-800">{c.symbol}</span>
                  <span className="text-xs font-semibold text-gray-700">{c.code}</span>
                  <span className="text-[10px] text-gray-400 text-center leading-tight">{c.label}</span>
                  {isActive && (
                    <span className="text-[10px] font-semibold" style={{ color: form.themeColor }}>✓ Selected</span>
                  )}
                </button>
              );
            })}
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
            {form.logo ? (
              <img src={form.logo} alt="logo" className="w-9 h-9 rounded-lg object-cover shadow-sm flex-shrink-0 border border-white/20" />
            ) : (
              <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-sm flex-shrink-0"
                style={{ backgroundColor: form.themeColor }}>
                SE
              </div>
            )}
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
