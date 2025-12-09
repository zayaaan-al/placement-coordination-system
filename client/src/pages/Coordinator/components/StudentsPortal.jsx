import { useMemo, useState } from 'react';
import { FiSearch, FiFilter, FiUsers, FiCalendar, FiArrowUpRight } from 'react-icons/fi';

const studentsMock = [
  {
    id: 'stu-101',
    name: 'Aarav Menon',
    department: 'Computer Science',
    graduationYear: 2025,
    status: 'Placement Ready',
    offers: 2,
    cgpa: 8.9,
    updatedAt: '2h ago'
  },
  {
    id: 'stu-117',
    name: 'Diya Sharma',
    department: 'Information Technology',
    graduationYear: 2024,
    status: 'Interview Scheduled',
    offers: 1,
    cgpa: 8.4,
    updatedAt: '5h ago'
  },
  {
    id: 'stu-132',
    name: 'Karthik Rao',
    department: 'Electronics',
    graduationYear: 2025,
    status: 'Needs Attention',
    offers: 0,
    cgpa: 7.6,
    updatedAt: '1d ago'
  },
  {
    id: 'stu-145',
    name: 'Sneha Patil',
    department: 'Mechanical',
    graduationYear: 2024,
    status: 'Training',
    offers: 0,
    cgpa: 8.1,
    updatedAt: '3d ago'
  }
];

const statusStyles = {
  'Placement Ready': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Interview Scheduled': 'bg-blue-50 text-blue-700 border-blue-200',
  'Needs Attention': 'bg-rose-50 text-rose-700 border-rose-200',
  Training: 'bg-amber-50 text-amber-700 border-amber-200'
};

export default function StudentsPortal() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const filteredStudents = useMemo(() =>
    studentsMock.filter((student) => {
      const matchesSearch = `${student.name} ${student.department}`
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesFilter = filter === 'all' || student.status === filter;
      return matchesSearch && matchesFilter;
    }),
    [search, filter]
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Students Overview</h1>
          <p className="text-gray-600">Track placement readiness, interviews, and support requirements</p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
            <FiCalendar className="mr-2" />
            Cohort 2024
          </button>
          <button className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
            Export List
          </button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[{
          title: 'Total Students',
          value: '1,240',
          change: '+32 this month',
          icon: <FiUsers />, color: 'bg-blue-50 text-blue-600'
        }, {
          title: 'Placement Ready',
          value: '420',
          change: '67% of final year',
          icon: <FiArrowUpRight />, color: 'bg-emerald-50 text-emerald-600'
        }, {
          title: 'Interview Scheduled',
          value: '118',
          change: '+14 this week',
          icon: <FiCalendar />, color: 'bg-amber-50 text-amber-600'
        }, {
          title: 'Needs Support',
          value: '36',
          change: 'Mentors assigned',
          icon: <FiFilter />, color: 'bg-rose-50 text-rose-600'
        }].map((card) => (
          <div key={card.title} className="p-5 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.title}</p>
                <p className="text-2xl font-semibold text-gray-900">{card.value}</p>
                <p className="text-xs text-gray-400 mt-1">{card.change}</p>
              </div>
              <div className={`p-3 rounded-lg ${card.color}`}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between p-4 border-b border-gray-100">
          <div className="relative flex-1 max-w-md">
            <FiSearch className="absolute left-3 inset-y-0 my-auto text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Search students by name or department"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['all', 'Placement Ready', 'Interview Scheduled', 'Needs Attention', 'Training'].map((badge) => (
              <button
                key={badge}
                onClick={() => setFilter(badge)}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition ${
                  filter === badge
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-gray-50 text-gray-600 border-gray-200'
                }`}
              >
                {badge === 'all' ? 'All' : badge}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y">
          {filteredStudents.map((student) => (
            <div key={student.id} className="flex flex-wrap items-center gap-4 p-4">
              <div>
                <p className="font-medium text-gray-900">{student.name}</p>
                <p className="text-sm text-gray-500">{student.department} • Batch {student.graduationYear}</p>
              </div>
              <span className={`ml-auto inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${statusStyles[student.status]}`}>
                {student.status}
              </span>
              <div className="flex items-center gap-6 w-full md:w-auto text-sm text-gray-500">
                <span>Offers: <span className="font-semibold text-gray-900">{student.offers}</span></span>
                <span>CGPA: <span className="font-semibold text-gray-900">{student.cgpa}</span></span>
                <span>Updated {student.updatedAt}</span>
              </div>
              <button className="text-blue-600 text-sm font-medium">View Profile</button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
