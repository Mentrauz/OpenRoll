interface Employee {
  name: string;
  role: string;
  avatar: string;
  score: number;
}

interface TopEmployeesProps {
  employees: Employee[];
}

export default function TopEmployees({ employees }: TopEmployeesProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700 h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-slate-900 dark:text-white">Top Employee</h3>
        <button className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-400">More view</button>
      </div>
      <div className="space-y-4">
        {employees.map((employee, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white text-lg">
                {employee.avatar}
              </div>
              <div>
                <div className="font-medium text-slate-900 dark:text-white text-sm">{employee.name}</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">{employee.role}</div>
              </div>
            </div>
            <div className={`font-semibold ${
              employee.score >= 90 ? 'text-green-700' : 
              employee.score >= 80 ? 'text-blue-700' : 
              'text-orange-600'
            }`}>
              {employee.score}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}





















