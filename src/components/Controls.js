import React, { useEffect, useRef } from 'react';
import { OrbitControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

export default function Controls({ resetToken, rows, cols }) {
  const controlsRef = useRef();
  const { camera } = useThree();

  useEffect(() => {
    const maxDimension = Math.max(rows, cols);
    const distance = Math.max(95, maxDimension * 13.5);
    camera.position.set(distance * 0.82, distance * 0.86, distance);
    camera.lookAt(0, 0, 0);
    camera.near = 0.1;
    camera.far = 5000;
    camera.updateProjectionMatrix();

    if (controlsRef.current) {
      controlsRef.current.target.copy(new THREE.Vector3(0, 0, 0));
      controlsRef.current.update();
    }
  }, [camera, resetToken, rows, cols]);

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      minDistance={45}
      maxDistance={650}
      maxPolarAngle={Math.PI / 2.05}
      target={[0, 0, 0]}
    />
  );
}
