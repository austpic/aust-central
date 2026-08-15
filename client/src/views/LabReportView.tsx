import { useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Tag,
  Book,
  FileText,
  CalendarCheck,
  CalendarDays,
  User,
  UserRound,
  Hash,
  Users,
  School,
  Eye,
} from 'lucide-react';
import { Dialog } from '../components/Modal';
import austLogo from '../assets/aust_logo.jpeg';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface CoverForm {
  courseNo: string;
  courseName: string;
  assignmentNo: string;
  performanceDate: string;
  submissionDate: string;
  submittedTo: string;
  name: string;
  id: string;
  group: string;
  section: string;
}

const EMPTY_FORM: CoverForm = {
  courseNo: '',
  courseName: '',
  assignmentNo: '',
  performanceDate: '',
  submissionDate: '',
  submittedTo: '',
  name: '',
  id: '',
  group: '',
  section: '',
};

function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getDate().toString().padStart(2, '0')} ${MONTHS[d.getMonth()]}, ${d.getFullYear()}`;
}

// Mirrors LabReportScreen in lib/screens/lab_report_screen.dart — the form and
// cover-page preview (PDF preview rendered as an HTML mirror).
export default function LabReportView() {
  const [form, setForm] = useState<CoverForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof CoverForm, string>>>({});
  const [showPreview, setShowPreview] = useState(false);

  function set<K extends keyof CoverForm>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate(): boolean {
    const next: Partial<Record<keyof CoverForm, string>> = {};
    (Object.keys(EMPTY_FORM) as (keyof CoverForm)[]).forEach((key) => {
      if (!form[key].trim()) next[key] = `Please enter ${labelFor(key)}`;
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function onPreview() {
    if (validate()) setShowPreview(true);
  }

  return (
    <div className="min-h-svh">
      {/* Header */}
      <div className="glass-accent glass-sheen sticky top-0 z-10 flex items-center">
        <button
          type="button"
          onClick={() => history.back()}
          aria-label="Back"
          className="p-3 text-white"
        >
          <ArrowLeft size={22} />
        </button>
        <span className="flex-1 py-4 text-center text-[17px] font-bold tracking-[0.5px] text-white">
          Cover Page Maker
        </span>
        <span className="w-11" />
      </div>

      <div className="mx-auto w-full max-w-2xl px-5 py-5">
        <SectionCard title="Course Details" icon={<BookOpen size={22} />}>
          <TextField
            label="Course Number"
            value={form.courseNo}
            onChange={(v) => set('courseNo', v)}
            error={errors.courseNo}
            icon={<Tag size={18} />}
          />
          <TextField
            label="Course Name"
            value={form.courseName}
            onChange={(v) => set('courseName', v)}
            error={errors.courseName}
            icon={<Book size={18} />}
          />
          <TextField
            label="Assignment Number"
            value={form.assignmentNo}
            onChange={(v) => set('assignmentNo', v)}
            error={errors.assignmentNo}
            icon={<FileText size={18} />}
          />
          <DateField
            label="Date of Performance"
            value={form.performanceDate}
            onChange={(v) => set('performanceDate', v)}
            error={errors.performanceDate}
            icon={<CalendarCheck size={18} />}
          />
          <DateField
            label="Date of Submission"
            value={form.submissionDate}
            onChange={(v) => set('submissionDate', v)}
            error={errors.submissionDate}
            icon={<CalendarDays size={18} />}
          />
          <TextField
            label="Submitted To"
            value={form.submittedTo}
            onChange={(v) => set('submittedTo', v)}
            error={errors.submittedTo}
            icon={<User size={18} />}
          />
        </SectionCard>

        <SectionCard title="Student Details" icon={<UserRound size={22} />}>
          <TextField
            label="Name"
            value={form.name}
            onChange={(v) => set('name', v)}
            error={errors.name}
            icon={<User size={18} />}
          />
          <TextField
            label="ID"
            value={form.id}
            onChange={(v) => set('id', v)}
            error={errors.id}
            icon={<Hash size={18} />}
          />
          <TextField
            label="Group"
            value={form.group}
            onChange={(v) => set('group', v)}
            error={errors.group}
            icon={<Users size={18} />}
          />
          <TextField
            label="Section"
            value={form.section}
            onChange={(v) => set('section', v)}
            error={errors.section}
            icon={<School size={18} />}
          />
        </SectionCard>

        <button
          type="button"
          onClick={onPreview}
          className="glass-accent glass-sheen mt-6 flex h-[54px] w-full items-center justify-center gap-2 rounded-[14px] text-[16px] font-bold text-white transition-transform duration-200 hover:-translate-y-0.5"
        >
          <Eye size={22} />
          Preview Cover Page
        </button>
        <div className="h-6" />
      </div>

      {showPreview && (
        <Dialog
          title="Cover Page Preview"
          onClose={() => setShowPreview(false)}
          wide
        >
          <CoverPagePreview form={form} />
        </Dialog>
      )}
    </div>
  );
}

function labelFor(key: keyof CoverForm): string {
  const map: Record<keyof CoverForm, string> = {
    courseNo: 'Course Number',
    courseName: 'Course Name',
    assignmentNo: 'Assignment Number',
    performanceDate: 'Date of Performance',
    submissionDate: 'Date of Submission',
    submittedTo: 'Submitted To',
    name: 'Name',
    id: 'ID',
    group: 'Group',
    section: 'Section',
  };
  return map[key];
}

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="glass glass-sheen mb-6 overflow-hidden rounded-[20px] transition-shadow duration-200 hover:shadow-glass-lg">
      <div
        className="h-1"
        style={{ background: 'linear-gradient(90deg, #407362 0%, #8cd4b8 100%)' }}
      />
      <div className="p-5">
        <div className="flex items-center">
          <span className="glass-tint rounded-[10px] p-2 text-mint-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
            {icon}
          </span>
          <span className="ml-3 font-display text-[18px] font-bold tracking-tight text-labtext">{title}</span>
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  error,
  icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <div
        className={`glass-input flex items-center rounded-[12px] ${error ? '!border-danger/70' : ''}`}
      >
        {icon && (
          <span className="pl-4 text-cgpalight">{icon}</span>
        )}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={label}
          aria-label={label}
          className="w-full bg-transparent px-4 py-4 text-[14px] text-labtext outline-none placeholder:text-cgpalight"
        />
      </div>
      {error && <div className="mt-1 text-xs text-cgpaerror">{error}</div>}
    </div>
  );
}

function DateField({
  label,
  value,
  onChange,
  error,
  icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <div
        className={`glass-input flex items-center rounded-[12px] ${error ? '!border-danger/70' : ''}`}
      >
        {icon && (
          <span className="pl-4 text-cgpalight">{icon}</span>
        )}
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={label}
          className="w-full bg-transparent px-4 py-4 text-[14px] text-labtext outline-none"
        />
        <CalendarDays size={18} className="mr-4 text-primary" />
      </div>
      {error && <div className="mt-1 text-xs text-cgpaerror">{error}</div>}
    </div>
  );
}

function CoverPagePreview({ form }: { form: CoverForm }) {
  const rows: { label: string; value: string }[] = [
    { label: 'Course No', value: form.courseNo },
    { label: 'Course Name', value: form.courseName },
    { label: 'Assignment No', value: form.assignmentNo },
    { label: 'Date of Performance', value: formatDate(form.performanceDate) },
    { label: 'Date of Submission', value: formatDate(form.submissionDate) },
    { label: 'Submitted To', value: form.submittedTo },
  ];
  const studentRows = [
    { label: 'Name', value: form.name },
    { label: 'Id', value: form.id },
    { label: 'Group', value: form.group },
    { label: 'Section', value: form.section },
  ];

  return (
    <div className="glass-strong glass-sheen rounded-[18px] p-4">
      <div className="mx-auto aspect-[210/297] max-w-[560px] bg-white p-8 text-[12px] leading-snug text-black" style={{ boxShadow: 'inset 0 0 0 1px #e5e7eb, 0 8px 24px -12px rgba(27,67,50,0.25)' }}>
        <div className="flex justify-center">
          <img src={austLogo} alt="AUST logo" className="h-[90px] w-[90px] object-contain" />
        </div>
        <div className="mt-4 flex justify-center bg-black px-4 py-2 text-center">
          <span className="text-[17px] font-bold text-white">
            Ahsanullah University of Science &amp; Technology
          </span>
        </div>
        <div className="mt-1.5 text-center">
          Department of Computer Science &amp; Engineering
        </div>
        <div className="mt-8">
          {rows.map((r) => (
            <PreviewRow key={r.label} label={r.label} value={r.value} />
          ))}
        </div>
        <div className="mt-8 text-[13px]">Submitted by -</div>
        <div className="mt-3.5 pl-6">
          {studentRows.map((r) => (
            <PreviewRow key={r.label} label={r.label} value={r.value} />
          ))}
        </div>
      </div>
    </div>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-2.5 flex items-start">
      <span className="w-[150px] shrink-0 font-bold">{label}</span>
      <span className="mx-1.5">:</span>
      <span>{value}</span>
    </div>
  );
}
