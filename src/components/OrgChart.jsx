import React from 'react';
import { Link } from 'react-router-dom';

// A color palette for departmental grouping.
const departmentColors = [
  '#4A90E2', // Blue
  '#50E3C2', // Teal
  '#9013FE', // Purple
  '#F5A623', // Orange
  '#D0021B', // Red
  '#BD10E0', // Pink
];

// A simple hash function to assign a consistent color to each department.
const getColorForDepartment = (department) => {
  if (!department) return '#4A90E2'; // Default color
  let hash = 0;
  for (let i = 0; i < department.length; i++) {
    hash = department.charCodeAt(i) + ((hash << 5) - hash);
  }
  return departmentColors[Math.abs(hash) % departmentColors.length];
};

// EmployeeCard component remains the same, but will be used in the new structure.
const EmployeeCard = ({ employee, isCurrentUser, color }) => (
  <div className={`relative flex flex-col items-center p-4 bg-white rounded-xl shadow-lg border-t-4 min-w-[180px]`} style={{ borderTopColor: color }}>
    <img
      src={`https://placehold.co/64x64/E2E8F0/4A5568?text=${employee.name.charAt(0)}`}
      alt={employee.name}
      className="w-16 h-16 rounded-full mb-3 border-2 border-white shadow-md"
    />
    <Link to={`/people/${employee.id}`} className="font-bold text-gray-800 text-center hover:text-blue-600 transition-colors">{employee.name}</Link>
    <p className="text-xs text-gray-500 text-center">{employee.position}</p>
    <p className="text-xs font-semibold mt-1" style={{ color }}>{employee.department || 'No Department'}</p>
    {isCurrentUser && <span className="absolute top-2 right-2 text-xs font-bold bg-blue-100 text-blue-600 px-2 py-1 rounded-full">You</span>}
  </div>
);

// TreeNode component is updated to render the new layout with department tags above the lines.
const TreeNode = ({ node, currentUser }) => {
  const departments = (node.children || []).reduce((acc, child) => {
    const dept = child.department || 'No Department';
    if (!acc[dept]) {
      acc[dept] = [];
    }
    acc[dept].push(child);
    return acc;
  }, {});

  const departmentColor = getColorForDepartment(node.department);

  return (
    <div className="flex flex-col items-center">
      <EmployeeCard employee={node} isCurrentUser={node.email === currentUser?.email} color={departmentColor} />
      {Object.keys(departments).length > 0 && (
        <>
          {/* Vertical line from manager down to the horizontal connector */}
          <div className="w-px h-12 bg-gray-400" />
          
          <div className="flex justify-center relative">
            {/* Main horizontal line connecting the department groups */}
            <div className="absolute top-6 h-px w-full bg-gray-400" />

            {Object.entries(departments).map(([department, children]) => (
              <div key={department} className="px-6 relative">
                {/* Vertical line from horizontal connector down towards the children cards */}
                <div className="absolute top-6 left-1/2 w-px h-6 bg-gray-400 -translate-x-1/2" />
                
                <div className="flex flex-col items-center pt-12"> {/* Add padding to create space for the tag */}
                  {/* Department Tag - positioned absolutely above the horizontal line */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2">
                    <div className="px-4 py-1 rounded-full text-xs font-bold text-white" style={{ backgroundColor: getColorForDepartment(department) }}>
                      {department}
                    </div>
                  </div>

                  <div className="flex justify-center items-start gap-8">
                    {children.map(child => (
                      <TreeNode key={child.id} node={child} currentUser={currentUser} />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

function OrgChart({ employees, currentUser }) {
  const buildTree = () => {
    const nodes = {};
    employees.forEach(emp => {
      nodes[emp.id] = { ...emp, children: [] };
    });

    const tree = [];
    Object.values(nodes).forEach(node => {
      const manager = employees.find(m => m.email === node.managerEmail);
      
      if (manager && manager.id !== node.id && nodes[manager.id]) {
        nodes[manager.id].children.push(node);
      } else {
        tree.push(node);
      }
    });

    return tree;
  };

  const tree = buildTree();

  if (employees.length === 0) {
    return <div className="text-center text-gray-500 p-8">No employees to display in the chart.</div>;
  }
  
  if (tree.length === 0 && employees.length > 0) {
    return <div className="text-center text-gray-500 p-8">Could not determine a top-level manager. Please check your data for circular reporting structures.</div>;
  }

  return (
    <div className="p-12 bg-gray-50 rounded-b-lg overflow-x-auto">
      <div className="flex justify-center items-start gap-8">
        {tree.map(rootNode => (
          <TreeNode key={rootNode.id} node={rootNode} currentUser={currentUser} />
        ))}
      </div>
    </div>
  );
}

export default OrgChart;