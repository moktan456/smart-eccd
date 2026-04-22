import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { activityService } from '../../services/activity.service';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { BLOOM_LEVELS, BLOOM_LABELS, BLOOM_COLORS } from '../../utils/constants';

const ATTENDANCE_OPTIONS = [
  { value: 'PRESENT', label: 'Present' }, { value: 'ABSENT', label: 'Absent' },
  { value: 'LATE', label: 'Late' }, { value: 'EXCUSED', label: 'Excused' },
];
const COMPLETION_OPTIONS = [
  { value: 'COMPLETED', label: 'Completed' }, { value: 'PARTIAL', label: 'Partial' },
  { value: 'NOT_ATTEMPTED', label: 'Not Attempted' },
];

const ConductActivity = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [assignment, setAssignment] = useState(null);
  const [children, setChildren] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [performances, setPerformances] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get(`/activities/assignments/my`).then(({ data }) => {
      const a = data.data.find(x => x.id === id);
      setAssignment(a);
      const kids = a?.class?.children || [];
      setChildren(kids);
      const att = Object.fromEntries(kids.map(c => [c.id, 'PRESENT']));
      const perf = Object.fromEntries(kids.map(c => [c.id, { completionStatus: 'COMPLETED', bloomLevelAchieved: 'REMEMBER', skillRatings: {}, observationNotes: '' }]));
      setAttendance(att);
      setPerformances(perf);
    });
  }, [id]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        conductedDate: new Date().toISOString(),
        performances: children.map(c => ({
          childId: c.id,
          ...performances[c.id],
          skillRatings: assignment?.activity?.learningGoals?.reduce((acc, g) => ({ ...acc, [g]: performances[c.id]?.skillRatings?.[g] || 3 }), {}) || {},
        })),
        attendances: children.map(c => ({ childId: c.id, status: attendance[c.id] })),
      };
      await activityService.conduct(id, payload);
      navigate('/teacher/activities');
    } finally {
      setLoading(false);
    }
  };

  if (\!assignment) return <LoadingSpinner className="mt-20" />;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Conduct: {assignment.activity?.title}</h1>
      </div>

      {/* Step Indicator */}
      <div className="flex gap-2">
        {['Attendance', 'Performance', 'Review'].map((s, i) => (
          <div key={s} className={`flex-1 text-center py-2 rounded-lg text-sm font-medium ${step === i+1 ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-500'}`}>{s}</div>
        ))}
      </div>

      {/* Step 1: Attendance */}
      {step === 1 && (
        <Card title="Mark Attendance">
          <div className="space-y-3">
            {children.map(child => (
              <div key={child.id} className="flex items-center justify-between">
                <span className="text-sm font-medium">{child.firstName} {child.lastName}</span>
                <Select value={attendance[child.id]} onChange={e => setAttendance(a => ({...a, [child.id]: e.target.value}))} options={ATTENDANCE_OPTIONS} className="w-36" />
              </div>
            ))}
          </div>
          <div className="mt-4"><Button onClick={() => setStep(2)}>Next: Performance →</Button></div>
        </Card>
      )}

      {/* Step 2: Performance */}
      {step === 2 && (
        <div className="space-y-4">
          {children.filter(c => attendance[c.id] \!== 'ABSENT').map(child => (
            <Card key={child.id} title={`${child.firstName} ${child.lastName}`}>
              <div className="space-y-3">
                <Select label="Completion" value={performances[child.id]?.completionStatus}
                  onChange={e => setPerformances(p => ({...p, [child.id]: {...p[child.id], completionStatus: e.target.value}}))}
                  options={COMPLETION_OPTIONS} />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bloom Level Achieved</label>
                  <div className="flex flex-wrap gap-2">
                    {BLOOM_LEVELS.map(l => (
                      <button key={l} type="button"
                        onClick={() => setPerformances(p => ({...p, [child.id]: {...p[child.id], bloomLevelAchieved: l}}))}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${performances[child.id]?.bloomLevelAchieved === l ? 'text-white' : 'bg-gray-100 text-gray-600'}`}
                        style={performances[child.id]?.bloomLevelAchieved === l ? {backgroundColor: BLOOM_COLORS[l]} : {}}>
                        {BLOOM_LABELS[l]}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observation Notes</label>
                  <textarea className="form-input" rows={2} value={performances[child.id]?.observationNotes || ''}
                    onChange={e => setPerformances(p => ({...p, [child.id]: {...p[child.id], observationNotes: e.target.value}}))} />
                </div>
              </div>
            </Card>
          ))}
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setStep(1)}>← Back</Button>
            <Button onClick={() => setStep(3)}>Next: Review →</Button>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <Card title="Review & Submit">
          <p className="text-sm text-gray-600 mb-4">{children.length} children · {Object.values(attendance).filter(s => s === 'PRESENT').length} present</p>
          <div className="space-y-2 mb-6">
            {children.map(c => (
              <div key={c.id} className="flex justify-between text-sm py-1 border-b border-gray-100">
                <span>{c.firstName} {c.lastName}</span>
                <span className="text-gray-500">{attendance[c.id]} · {performances[c.id]?.bloomLevelAchieved}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setStep(2)}>← Back</Button>
            <Button loading={loading} onClick={handleSubmit}>Submit Activity Record</Button>
          </div>
        </Card>
      )}
    </div>
  );
};
export default ConductActivity;
