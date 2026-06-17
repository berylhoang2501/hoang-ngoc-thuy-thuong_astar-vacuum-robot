import React, { useMemo } from 'react';
import { Line, Text } from '@react-three/drei';
import { cellKey } from './algorithms/vacuumAStar';

const CELL = 10;

function worldPosition(x, y, rows, cols) {
  return [
    (x - (cols + 1) / 2) * CELL,
    0,
    -(y - (rows + 1) / 2) * CELL,
  ];
}

function FloorTile({ x, y, rows, cols, color }) {
  const [worldX, , worldZ] = worldPosition(x, y, rows, cols);
  return (
    <mesh position={[worldX, 0, worldZ]} receiveShadow>
      <boxGeometry args={[CELL - 0.38, 0.55, CELL - 0.38]} />
      <meshStandardMaterial color={color} roughness={0.82} metalness={0.04} />
    </mesh>
  );
}

function DustPile({ x, y, rows, cols }) {
  const [worldX, , worldZ] = worldPosition(x, y, rows, cols);
  return (
    <group position={[worldX, 0.5, worldZ]}>
      <mesh position={[-1.45, 0.65, 0.45]} castShadow>
        <sphereGeometry args={[1.55, 18, 12]} />
        <meshStandardMaterial color="#6f3c18" roughness={0.95} />
      </mesh>
      <mesh position={[1.15, 0.55, 0.75]} castShadow>
        <sphereGeometry args={[1.35, 18, 12]} />
        <meshStandardMaterial color="#875126" roughness={0.95} />
      </mesh>
      <mesh position={[0.05, 0.85, -1.1]} castShadow>
        <sphereGeometry args={[1.7, 18, 12]} />
        <meshStandardMaterial color="#5d3012" roughness={0.95} />
      </mesh>
      <Text
        position={[0, 3.6, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={2.2}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        D
      </Text>
    </group>
  );
}

function VacuumRobot({ x, y, rows, cols }) {
  const [worldX, , worldZ] = worldPosition(x, y, rows, cols);
  return (
    <group position={[worldX, 0.7, worldZ]}>
      <mesh position={[0, 1.15, 0]} castShadow>
        <cylinderGeometry args={[3.2, 3.45, 1.9, 36]} />
        <meshStandardMaterial color="#0c6fb4" roughness={0.35} metalness={0.28} />
      </mesh>
      <mesh position={[0, 2.45, 0]} castShadow>
        <cylinderGeometry args={[1.5, 1.8, 0.8, 32]} />
        <meshStandardMaterial color="#66c9ff" roughness={0.3} metalness={0.22} />
      </mesh>
      <mesh position={[-2.45, 0.25, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.62, 0.62, 1.1, 18]} />
        <meshStandardMaterial color="#202733" roughness={0.85} />
      </mesh>
      <mesh position={[2.45, 0.25, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.62, 0.62, 1.1, 18]} />
        <meshStandardMaterial color="#202733" roughness={0.85} />
      </mesh>
      <mesh position={[0, 2.62, -1.55]} castShadow>
        <sphereGeometry args={[0.28, 16, 10]} />
        <meshStandardMaterial color="#ffe15c" emissive="#9d7610" emissiveIntensity={0.3} />
      </mesh>
      <Text
        position={[0, 4.65, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={2.2}
        color="#073763"
        anchorX="center"
        anchorY="middle"
      >
        R
      </Text>
    </group>
  );
}

function CoordinateLabels({ rows, cols }) {
  const xLabels = [];
  const yLabels = [];
  for (let x = 1; x <= cols; x += 1) {
    const [worldX, , worldZ] = worldPosition(x, 1, rows, cols);
    xLabels.push(
      <Text
        key={`x-${x}`}
        position={[worldX, 0.7, worldZ + CELL * 0.72]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={1.8}
        color="#29465f"
      >
        {x}
      </Text>
    );
  }
  for (let y = 1; y <= rows; y += 1) {
    const [worldX, , worldZ] = worldPosition(1, y, rows, cols);
    yLabels.push(
      <Text
        key={`y-${y}`}
        position={[worldX - CELL * 0.72, 0.7, worldZ]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={1.8}
        color="#29465f"
      >
        {y}
      </Text>
    );
  }
  return <>{xLabels}{yLabels}</>;
}

function GridLines({ rows, cols }) {
  const lines = [];
  const minX = -(cols * CELL) / 2;
  const maxX = (cols * CELL) / 2;
  const minZ = -(rows * CELL) / 2;
  const maxZ = (rows * CELL) / 2;

  for (let col = 0; col <= cols; col += 1) {
    const x = minX + col * CELL;
    lines.push(
      <Line
        key={`v-${col}`}
        points={[[x, 0.61, minZ], [x, 0.61, maxZ]]}
        color="#87a8d7"
        lineWidth={1}
      />
    );
  }
  for (let row = 0; row <= rows; row += 1) {
    const z = minZ + row * CELL;
    lines.push(
      <Line
        key={`h-${row}`}
        points={[[minX, 0.61, z], [maxX, 0.61, z]]}
        color="#87a8d7"
        lineWidth={1}
      />
    );
  }
  return <>{lines}</>;
}

export default function VacuumScene({
  rows,
  cols,
  start,
  initialDirty,
  result,
  currentStep,
}) {
  const state = result?.found
    ? result.states[Math.min(currentStep, result.states.length - 1)]
    : { x: start.x, y: start.y, dirty: initialDirty };

  const pathPositions = result?.found
    ? result.states.slice(0, currentStep + 1).map((item) => ({ x: item.x, y: item.y }))
    : [{ x: start.x, y: start.y }];

  const pathKeys = new Set(pathPositions.map((item) => cellKey(item.x, item.y)));

  const expandedKeys = useMemo(
    () => new Set(result?.visitedPositions || []),
    [result]
  );

  const cleanedKeys = useMemo(() => {
    const cleaned = new Set();
    initialDirty.forEach((key) => {
      if (!state.dirty.has(key)) cleaned.add(key);
    });
    return cleaned;
  }, [initialDirty, state.dirty]);

  const tiles = [];
  for (let y = 1; y <= rows; y += 1) {
    for (let x = 1; x <= cols; x += 1) {
      const key = cellKey(x, y);
      let color = '#d9dde2';
      if (expandedKeys.has(key)) color = '#6659c8';
      if (cleanedKeys.has(key)) color = '#53cfbc';
      if (pathKeys.has(key)) color = '#e9df13';
      if (key === cellKey(start.x, start.y)) color = '#19bd4a';
      tiles.push(
        <FloorTile key={key} x={x} y={y} rows={rows} cols={cols} color={color} />
      );
    }
  }

  const pathPoints = pathPositions.map((position) => {
    const [x, , z] = worldPosition(position.x, position.y, rows, cols);
    return [x, 1.05, z];
  });

  const dirtyObjects = [...state.dirty].map((key) => {
    const [x, y] = key.split(',').map(Number);
    return <DustPile key={key} x={x} y={y} rows={rows} cols={cols} />;
  });

  const maxDimension = Math.max(rows, cols);
  const groundWidth = cols * CELL + CELL * 3;
  const groundDepth = rows * CELL + CELL * 3;

  return (
    <>
      <color attach="background" args={['#e5e7eb']} />
      <fog attach="fog" args={['#e5e7eb', maxDimension * 15, maxDimension * 42]} />
      <ambientLight intensity={1.5} />
      <hemisphereLight intensity={0.8} color="#cfe8ff" groundColor="#7d7566" />
      <directionalLight
        position={[-80, 150, 90]}
        intensity={2.3}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      <mesh position={[0, -0.4, 0]} receiveShadow>
        <boxGeometry args={[groundWidth, 0.45, groundDepth]} />
        <meshStandardMaterial color="#eef0f3" roughness={0.98} />
      </mesh>

      {tiles}
      <GridLines rows={rows} cols={cols} />
      <CoordinateLabels rows={rows} cols={cols} />
      {dirtyObjects}

      {pathPoints.length > 1 && (
        <Line
          points={pathPoints}
          color="#f4e900"
          lineWidth={5}
          transparent
          opacity={0.95}
        />
      )}

      <VacuumRobot x={state.x} y={state.y} rows={rows} cols={cols} />
    </>
  );
}

export { worldPosition, CELL };
