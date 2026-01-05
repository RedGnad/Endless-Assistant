"use client";

import { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stage, useGLTF } from "@react-three/drei";
import * as THREE from "three";

function NessyInner() {
  const gltf = useGLTF("/nessy.glb") as any;
  const group = useRef<THREE.Group | null>(null);
  const pointerRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    function handlePointerMove(event: PointerEvent) {
      const x = (event.clientX / window.innerWidth) * 2 - 1;
      const y = (event.clientY / window.innerHeight) * 2 - 1;
      pointerRef.current.x = x;
      pointerRef.current.y = y;
    }

    window.addEventListener("pointermove", handlePointerMove);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
    };
  }, []);

  useFrame(() => {
    if (!group.current) return;

    const { x, y } = pointerRef.current;
    const targetY = x * 0.8;
    const targetX = y * 0.4;

    group.current.rotation.y = THREE.MathUtils.lerp(
      group.current.rotation.y,
      targetY,
      0.12
    );
    group.current.rotation.x = THREE.MathUtils.lerp(
      group.current.rotation.x,
      targetX,
      0.12
    );
  });

  return (
    <group ref={group}>
      <primitive
        object={gltf.scene}
        // Ajuste léger de l'échelle et de la position pour un cadrage plus agréable
        scale={1.1}
        position={[0, -0.6, 0]}
      />
    </group>
  );
}

function NessyModel() {
  return (
    <Stage environment="city" intensity={0.8} adjustCamera>
      <NessyInner />
    </Stage>
  );
}

export default function NessyAvatar() {
  return (
    <div className="h-full w-full overflow-hidden rounded-3xl bg-black/95">
      <Canvas
        camera={{ position: [0, 0.6, 2.5], fov: 40 }}
        className="h-full w-full"
      >
        <Suspense fallback={null}>
          <NessyModel />
        </Suspense>
      </Canvas>
    </div>
  );
}

useGLTF.preload("/nessy.glb");
