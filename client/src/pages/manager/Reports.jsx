import { useState, useEffect } from 'react';
import { reportService } from '../../services/report.service';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import BloomBarChart from '../../components/charts/BloomBarChart';

const MgrReports = () => {
  const [report, setReport] = useState(null);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/children?limit=50').then(({ data }) => setChildren(data.data));
    loadCenterReport();
  }, []);

  const loadCenterReport = () => {
    setLoading(true);
    reportService.getCenterReport().then(({ data }) => setReport(data.data)).finally(() => setLoading(false));
  };

  const downloadChildReport = async (id, name) => {
    const { data } = await reportService.getChildReport(id);
    alert(`Report for ${name} generated. PDF generation requires ENABLE_PDF_REPORTS=true. JSON data logged.`);
    console.log(data);
  };

  const childColumns = [
    { key: 'name', label: 'Child', render: r => `${r.firstName} ${r.lastName}` },
    { key: 'class', label: 'Class', render: r => r.class?.name || '—' },
    { key: 'actions', label: '', render: r => <Button size="sm" variant="secondary" onClick={() => downloadChildReport(r.id, `${r.firstName}`)}>Download Report</Button> },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
      <Card title="Center Bloom's Coverage">
        <BloomBarChart coverage={report?.bloomCoverage || {}} />
      </Card>
      <Card title="Child Reports">
        <Table columns={childColumns} data={children} loading={loading} />
      </Card>
    </div>
  );
};
export default MgrReports;
