"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function NetworkParticles() {
  const pointsRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);

  const [positions, riskColors, linePositions] = useMemo(() => {
    const tempPositions: number[] = [];
    const tempColors: number[] = [];
    const count = 90;
    const radius = 2.1;

    for (let i = 0; i < count; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = radius * (0.85 + Math.random() * 0.3);

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      tempPositions.push(x, y, z);

      const rand = Math.random();
      if (rand > 0.85) {
        // Suspicious — red
        tempColors.push(0.96, 0.25, 0.37);
      } else if (rand > 0.65) {
        // Monitored — cyan
        tempColors.push(0.0, 0.96, 1.0);
      } else if (rand > 0.4) {
        // Purple — AI investigated
        tempColors.push(0.66, 0.33, 0.97);
      } else {
        // Teal — legitimate
        tempColors.push(0.08, 0.72, 0.65);
      }
    }

    const lineCoords: number[] = [];
    for (let i = 0; i < count; i++) {
      const idxA = i * 3;
      const xA = tempPositions[idxA];
      const yA = tempPositions[idxA + 1];
      const zA = tempPositions[idxA + 2];

      for (let j = i + 1; j < count; j++) {
        const idxB = j * 3;
        const xB = tempPositions[idxB];
        const yB = tempPositions[idxB + 1];
        const zB = tempPositions[idxB + 2];

        const dist = Math.sqrt((xA - xB) ** 2 + (yA - yB) ** 2 + (zA - zB) ** 2);
        if (dist < 1.4 && Math.random() > 0.35) {
          lineCoords.push(xA, yA, zA, xB, yB, zB);
        }
      }
    }

    return [
      new Float32Array(tempPositions),
      new Float32Array(tempColors),
      new Float32Array(lineCoords),
    ];
  }, []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const targetX = state.pointer.x * 0.4;
    const targetY = state.pointer.y * 0.4;

    if (pointsRef.current) {
      pointsRef.current.rotation.y = time * 0.04 + targetX;
      pointsRef.current.rotation.x = time * 0.025 - targetY;
    }
    if (linesRef.current) {
      linesRef.current.rotation.y = time * 0.04 + targetX;
      linesRef.current.rotation.x = time * 0.025 - targetY;
    }
  });

  return (
    <group>
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[linePositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial
          color="#3B82F6"
          transparent
          opacity={0.14}
          linewidth={1}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>

      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[riskColors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.12}
          vertexColors
          transparent
          opacity={0.9}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

export default function NetworkGlobe3D() {
  return (
    <div className="absolute inset-0 z-0 w-full h-full pointer-events-none opacity-55">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 58 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.3} />
        <directionalLight position={[2, 2, 2]} intensity={0.5} />
        <NetworkParticles />
      </Canvas>
    </div>
  );
}
