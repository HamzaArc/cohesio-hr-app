import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ReactFlow, Controls, Background, Handle, Position, useNodesState, useEdgesState, Panel } from '@xyflow/react';
import dagre from 'dagre';
import '@xyflow/react/dist/style.css';

// --- Dagre layouting ---
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));
const nodeWidth = 200;
const nodeHeight = 120;

const getLayoutedElements = (nodes, edges, direction = 'TB') => {
  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({
    rankdir: direction,
    ranksep: 120, // Increased vertical spacing
    nodesep: 70,  // Increased horizontal spacing
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = isHorizontal ? Position.Left : Position.Top;
    node.sourcePosition = isHorizontal ? Position.Right : Position.Bottom;
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };
  });

  return { nodes, edges };
};

// --- Color Palette ---
const departmentColors = [
  '#4A90E2', '#50E3C2', '#9013FE', '#F5A623', '#D0021B', '#BD10E0',
];

const getColorForDepartment = (department) => {
  if (!department) return '#4A90E2';
  let hash = 0;
  for (let i = 0; i < department.length; i++) {
    hash = department.charCodeAt(i) + ((hash << 5) - hash);
  }
  return departmentColors[Math.abs(hash) % departmentColors.length];
};

// --- Custom Node Component ---
const EmployeeNode = React.memo(({ data }) => {
  const { employee, isCurrentUser } = data;
  const color = getColorForDepartment(employee.department);

  return (
    <>
      <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
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
      <Handle type="source" position={Position.Bottom} style={{ background: '#555' }} />
    </>
  );
});

// --- Main OrgChart Component ---
function OrgChart({ employees, currentUser, onLayout }) {
  const nodeTypes = useMemo(() => ({ employee: EmployeeNode }), []);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const dragData = useRef(null);

  useEffect(() => {
    if (employees.length > 0) {
      // Sort employees to encourage departmental grouping by dagre
      const employeesById = new Map(employees.map(e => [e.id, e]));
      const sortedEmployees = [...employees].sort((a, b) => {
        const deptA = a.department || 'zzz';
        const deptB = b.department || 'zzz';
        if (deptA < deptB) return -1;
        if (deptA > deptB) return 1;
        return a.name.localeCompare(b.name);
      });

      const initialNodes = sortedEmployees.map(emp => ({
        id: emp.id,
        type: 'employee',
        data: { employee: emp, isCurrentUser: emp.email === currentUser?.email },
        position: { x: 0, y: 0 }
      }));
  
      const initialEdges = sortedEmployees
        .map(emp => {
          const manager = employees.find(m => m.email === emp.managerEmail);
          if (manager && manager.id !== emp.id) {
            return {
              id: `e-${manager.id}-${emp.id}`,
              source: manager.id,
              target: emp.id,
              type: 'smoothstep',
              animated: true,
            };
          }
          return null;
        })
        .filter(Boolean);
  
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(initialNodes, initialEdges);
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
    }
  }, [employees, currentUser, setNodes, setEdges, onLayout]); // Rerun onLayout when reset is clicked
  
  const getDescendants = useCallback((nodeId, allEdges) => {
    const descendants = new Set();
    const queue = [nodeId];
    while (queue.length > 0) {
      const currentId = queue.shift();
      const childrenEdges = allEdges.filter(edge => edge.source === currentId);
      childrenEdges.forEach(edge => {
        if (!descendants.has(edge.target)) {
          descendants.add(edge.target);
          queue.push(edge.target);
        }
      });
    }
    return Array.from(descendants);
  }, []);

  const onNodeDragStart = useCallback((_, node) => {
    const descendantIds = getDescendants(node.id, edges);
    const draggedNode = nodes.find(n => n.id === node.id);
    const descendants = nodes.filter(n => descendantIds.includes(n.id));
    
    dragData.current = {
      draggedNode,
      descendants: descendants.map(desc => ({
        ...desc,
        dx: desc.position.x - draggedNode.position.x,
        dy: desc.position.y - draggedNode.position.y,
      })),
    };
  }, [nodes, edges, getDescendants]);

  const onNodeDrag = useCallback((_, node) => {
    if (!dragData.current) return;
    const { descendants } = dragData.current;
    
    setNodes(nds =>
      nds.map(n => {
        if (n.id === node.id) {
          return { ...n, position: node.position };
        }
        const descendant = descendants.find(d => d.id === n.id);
        if (descendant) {
          return {
            ...n,
            position: {
              x: node.position.x + descendant.dx,
              y: node.position.y + descendant.dy,
            },
          };
        }
        return n;
      })
    );
  }, [setNodes]);

  const onNodeDragStop = useCallback(() => {
    dragData.current = null;
  }, []);


  if (employees.length === 0) {
    return <div className="text-center text-gray-500 p-8">No employees to display in the chart.</div>;
  }

  return (
    <div className="p-2 bg-gray-50 rounded-b-lg" style={{ height: '70vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onNodeDragStart={onNodeDragStart}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        fitView
        className="bg-gray-100"
      >
        <Panel position="top-right">
          <button onClick={onLayout} className="bg-white text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-100 border border-gray-300 shadow-sm">
            Reset Layout
          </button>
        </Panel>
        <Controls />
        <Background gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}

export default OrgChart;