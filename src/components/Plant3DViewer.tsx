import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { PlantCategory, GrowthStage } from '../types/plant';
import { RotateCcw, Wind, Eye, Info } from 'lucide-react';

interface Plant3DViewerProps {
  plantName: string;
  commonName: string;
  category: PlantCategory;
  growthStage?: GrowthStage;
  healthStatus?: string;
  className?: string;
}

export const Plant3DViewer: React.FC<Plant3DViewerProps> = ({
  plantName,
  commonName,
  category,
  growthStage = 'vegetative',
  healthStatus = 'healthy',
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isWindActive, setIsWindActive] = useState<boolean>(true);
  const isDraggingRef = useRef<boolean>(false);
  const prevMousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const plantGroupRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 400;
    const height = mount.clientHeight || 350;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf6f3ef);

    // Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(0, 1.8, 4.2);
    camera.lookAt(0, 0.7, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xfff5eb, 0.9);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffaed, 1.4);
    sunLight.position.set(4, 7, 3);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    scene.add(sunLight);

    const softFillLight = new THREE.DirectionalLight(0xd4e2d4, 0.4);
    softFillLight.position.set(-3, 3, -2);
    scene.add(softFillLight);

    // Ground plane with subtle shadow
    const floorGeo = new THREE.PlaneGeometry(8, 8);
    const floorMat = new THREE.ShadowMaterial({ opacity: 0.12 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.01;
    floor.receiveShadow = true;
    scene.add(floor);

    // Plant Root Group
    const rootGroup = new THREE.Group();
    plantGroupRef.current = rootGroup;
    scene.add(rootGroup);

    // Pot Geometry (Terracotta Artisan Pot)
    const potColor = category === 'indoor_houseplant' ? 0xeae5db : 0xbf5b3b;
    const potMat = new THREE.MeshStandardMaterial({
      color: potColor,
      roughness: 0.85,
      metalness: 0.05,
    });

    const potHeight = 0.9;
    const potGeo = new THREE.CylinderGeometry(0.65, 0.45, potHeight, 32);
    const pot = new THREE.Mesh(potGeo, potMat);
    pot.position.y = potHeight / 2;
    pot.castShadow = true;
    pot.receiveShadow = true;
    rootGroup.add(pot);

    // Pot Rim
    const rimGeo = new THREE.TorusGeometry(0.67, 0.05, 16, 32);
    const rim = new THREE.Mesh(rimGeo, potMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = potHeight;
    rootGroup.add(rim);

    // Soil
    const soilGeo = new THREE.CylinderGeometry(0.63, 0.63, 0.06, 32);
    const soilMat = new THREE.MeshStandardMaterial({
      color: 0x3d271d,
      roughness: 0.95,
    });
    const soil = new THREE.Mesh(soilGeo, soilMat);
    soil.position.y = potHeight - 0.04;
    rootGroup.add(soil);

    // Species-Specific Botanical Geometry
    const foliageGroup = new THREE.Group();
    foliageGroup.position.y = potHeight - 0.04;
    rootGroup.add(foliageGroup);

    // Foliage Materials
    const isLeafChlorotic = healthStatus === 'suspected_issue' || healthStatus === 'under_treatment';
    const healthyLeafColor = 0x2e6f40;
    const stressedLeafColor = 0x768834;
    const leafMat = new THREE.MeshStandardMaterial({
      color: isLeafChlorotic ? stressedLeafColor : healthyLeafColor,
      roughness: 0.5,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });

    const stemMat = new THREE.MeshStandardMaterial({
      color: 0x3d663b,
      roughness: 0.7,
    });

    const isTomato = commonName.toLowerCase().includes('tomato');
    const isMonstera = commonName.toLowerCase().includes('monstera');
    const isTulsi = commonName.toLowerCase().includes('tulsi') || commonName.toLowerCase().includes('basil');

    if (isMonstera) {
      // Monstera Swiss Cheese: central coco pole + large wide arching split leaves
      const poleGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.8, 16);
      const poleMat = new THREE.MeshStandardMaterial({ color: 0x5a3e2b, roughness: 0.9 });
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(0, 0.9, 0);
      foliageGroup.add(pole);

      const leafCount = growthStage === 'mature' ? 7 : 4;
      for (let i = 0; i < leafCount; i++) {
        const angle = (i / leafCount) * Math.PI * 2 + (i % 2) * 0.3;
        const radius = 0.5 + (i % 3) * 0.15;
        const stemHeight = 0.7 + i * 0.15;

        // Curved petiole
        const curve = new THREE.QuadraticBezierCurve3(
          new THREE.Vector3(0, 0.2, 0),
          new THREE.Vector3(Math.cos(angle) * 0.2, stemHeight * 0.7, Math.sin(angle) * 0.2),
          new THREE.Vector3(Math.cos(angle) * radius, stemHeight, Math.sin(angle) * radius)
        );
        const stemGeo = new THREE.TubeGeometry(curve, 12, 0.025, 8, false);
        const stemMesh = new THREE.Mesh(stemGeo, stemMat);
        foliageGroup.add(stemMesh);

        // Broad fenestrated leaf blade
        const leafBladeGeo = new THREE.CircleGeometry(0.38 + (i % 2) * 0.08, 16);
        leafBladeGeo.scale(1.2, 1.6, 1);
        const leafMesh = new THREE.Mesh(leafBladeGeo, leafMat);
        leafMesh.position.set(Math.cos(angle) * radius, stemHeight, Math.sin(angle) * radius);
        leafMesh.rotation.x = Math.PI / 3 + (i % 2) * 0.2;
        leafMesh.rotation.y = angle + Math.PI / 4;
        leafMesh.castShadow = true;
        foliageGroup.add(leafMesh);
      }
    } else if (isTomato) {
      // Tomato Plant: Bamboo staking + serrated leaflets + small cherry tomatoes
      const stakeGeo = new THREE.CylinderGeometry(0.025, 0.025, 1.9, 12);
      const stakeMat = new THREE.MeshStandardMaterial({ color: 0xc4a36e, roughness: 0.8 });
      const stake = new THREE.Mesh(stakeGeo, stakeMat);
      stake.position.set(0.12, 0.95, -0.05);
      foliageGroup.add(stake);

      // Main branching stem
      const mainStemGeo = new THREE.CylinderGeometry(0.035, 0.05, 1.6, 12);
      const mainStem = new THREE.Mesh(mainStemGeo, stemMat);
      mainStem.position.y = 0.8;
      foliageGroup.add(mainStem);

      // Lateral branches with leaflets
      for (let b = 0; b < 10; b++) {
        const branchAngle = b * 2.1;
        const branchY = 0.3 + b * 0.12;
        const branchLen = 0.35 + (b % 3) * 0.08;

        const branchGeo = new THREE.CylinderGeometry(0.015, 0.02, branchLen, 8);
        const branchMesh = new THREE.Mesh(branchGeo, stemMat);
        branchMesh.position.set(
          (Math.cos(branchAngle) * branchLen) / 2,
          branchY,
          (Math.sin(branchAngle) * branchLen) / 2
        );
        branchMesh.rotation.z = Math.PI / 4;
        branchMesh.rotation.y = branchAngle;
        foliageGroup.add(branchMesh);

        // Leaflets
        for (let l = 0; l < 3; l++) {
          const lGeo = new THREE.ConeGeometry(0.09, 0.22, 6);
          const lMesh = new THREE.Mesh(lGeo, leafMat);
          lMesh.position.set(
            Math.cos(branchAngle) * (branchLen * 0.8 + l * 0.06),
            branchY + (l * 0.03),
            Math.sin(branchAngle) * (branchLen * 0.8 + l * 0.06)
          );
          lMesh.rotation.x = Math.PI / 2;
          lMesh.rotation.y = branchAngle;
          foliageGroup.add(lMesh);
        }
      }

      // Cherry Tomato Fruits (green & ripening red clusters)
      const fruitMatRed = new THREE.MeshStandardMaterial({ color: 0xd93829, roughness: 0.35, metalness: 0.1 });
      const fruitMatGreen = new THREE.MeshStandardMaterial({ color: 0x88b04b, roughness: 0.4 });
      for (let t = 0; t < 5; t++) {
        const tGeo = new THREE.SphereGeometry(0.07, 16, 16);
        const tMesh = new THREE.Mesh(tGeo, t > 2 ? fruitMatRed : fruitMatGreen);
        tMesh.position.set(0.18 + Math.cos(t * 1.3) * 0.14, 0.75 + t * 0.08, 0.15 + Math.sin(t * 1.3) * 0.12);
        tMesh.castShadow = true;
        foliageGroup.add(tMesh);
      }
    } else if (isTulsi) {
      // Krishna Tulsi / Holy Basil: Dense bushy branching, delicate opposing leaves, top floral spikes
      const mainStemGeo = new THREE.CylinderGeometry(0.04, 0.06, 1.2, 12);
      const stemTulsiMat = new THREE.MeshStandardMaterial({ color: 0x4a3c31, roughness: 0.8 });
      const mainStem = new THREE.Mesh(mainStemGeo, stemTulsiMat);
      mainStem.position.y = 0.6;
      foliageGroup.add(mainStem);

      const tulsiLeafMat = new THREE.MeshStandardMaterial({
        color: 0x245437,
        roughness: 0.6,
        side: THREE.DoubleSide,
      });

      // Dense radial bushy leaves
      for (let i = 0; i < 28; i++) {
        const angle = i * 0.85;
        const heightLevel = 0.25 + (i / 28) * 0.85;
        const spread = 0.2 + (1 - i / 32) * 0.32;

        const leafGeo = new THREE.SphereGeometry(0.09, 8, 8);
        leafGeo.scale(1.2, 0.2, 0.7);
        const leafMesh = new THREE.Mesh(leafGeo, tulsiLeafMat);
        leafMesh.position.set(Math.cos(angle) * spread, heightLevel, Math.sin(angle) * spread);
        leafMesh.rotation.y = angle;
        leafMesh.rotation.z = Math.PI / 6;
        foliageGroup.add(leafMesh);
      }

      // Floral Inflorescence Spikes (Manjaris) on top
      const spikeGeo = new THREE.CylinderGeometry(0.015, 0.02, 0.28, 8);
      const spikeMat = new THREE.MeshStandardMaterial({ color: 0x542b4b });
      const spike = new THREE.Mesh(spikeGeo, spikeMat);
      spike.position.set(0, 1.3, 0);
      foliageGroup.add(spike);
    } else {
      // Default Houseplant / General Foliage Bush
      const stemGeo = new THREE.CylinderGeometry(0.03, 0.05, 1.0, 12);
      const stem = new THREE.Mesh(stemGeo, stemMat);
      stem.position.y = 0.5;
      foliageGroup.add(stem);

      for (let i = 0; i < 16; i++) {
        const angle = (i / 16) * Math.PI * 2;
        const h = 0.3 + (i / 16) * 0.6;
        const leafGeo = new THREE.ConeGeometry(0.12, 0.4, 8);
        const leaf = new THREE.Mesh(leafGeo, leafMat);
        leaf.position.set(Math.cos(angle) * 0.35, h, Math.sin(angle) * 0.35);
        leaf.rotation.x = Math.PI / 3;
        leaf.rotation.y = angle;
        foliageGroup.add(leaf);
      }
    }

    // Interactive Orbit via Pointer Drag
    const onPointerDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      prevMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !plantGroupRef.current) return;
      const deltaX = e.clientX - prevMousePos.current.x;
      const deltaY = e.clientY - prevMousePos.current.y;

      plantGroupRef.current.rotation.y += deltaX * 0.012;
      plantGroupRef.current.rotation.x = Math.max(-0.25, Math.min(0.35, plantGroupRef.current.rotation.x + deltaY * 0.008));

      prevMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = () => {
      isDraggingRef.current = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.position.z = Math.max(2.5, Math.min(6.5, camera.position.z + e.deltaY * 0.003));
    };

    mount.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
    mount.addEventListener('wheel', onWheel, { passive: false });

    // Animation loop with gentle wind sway
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      if (isWindActive && foliageGroup) {
        // Organic sinusoidal wind sway
        foliageGroup.rotation.z = Math.sin(elapsedTime * 1.5) * 0.025 + Math.sin(elapsedTime * 0.8) * 0.015;
        foliageGroup.rotation.x = Math.cos(elapsedTime * 1.2) * 0.018;
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!mount) return;
      const newWidth = mount.clientWidth;
      const newHeight = mount.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      mount.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      mount.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [commonName, category, growthStage, healthStatus, isWindActive]);

  const resetOrientation = () => {
    if (plantGroupRef.current) {
      plantGroupRef.current.rotation.set(0, 0, 0);
    }
  };

  return (
    <div className={`relative flex flex-col bg-[#F6F3EF] rounded-2xl border border-neutral-200 overflow-hidden ${className}`}>
      {/* 3D Canvas Viewport */}
      <div
        ref={mountRef}
        className="w-full h-80 sm:h-96 cursor-grab active:cursor-grabbing select-none"
        title="Click and drag to rotate the plant; scroll to zoom"
      />

      {/* Floating View Controls */}
      <div className="absolute top-3 right-3 flex items-center gap-2">
        <button
          onClick={() => setIsWindActive(!isWindActive)}
          className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg transition-colors shadow-xs ${
            isWindActive ? 'bg-[#3B182E] text-white' : 'bg-white/80 text-neutral-700 hover:bg-white'
          }`}
          title="Toggle gentle wind breeze animation"
        >
          <Wind className="w-3.5 h-3.5" />
          <span>{isWindActive ? 'Breeze On' : 'Breeze Off'}</span>
        </button>

        <button
          onClick={resetOrientation}
          className="p-1.5 bg-white/80 hover:bg-white text-neutral-700 rounded-lg shadow-xs transition-colors"
          title="Reset 3D camera angle"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Botanical Identification & Transparent Label */}
      <div className="p-3 bg-white/90 border-t border-neutral-200/60 flex items-center justify-between text-xs text-neutral-600">
        <div className="flex items-center gap-2 truncate">
          <Eye className="w-4 h-4 text-[#3B182E] shrink-0" />
          <span className="font-semibold text-neutral-900 truncate">{plantName}</span>
          <span className="text-neutral-400">·</span>
          <span className="italic text-neutral-500 truncate">{commonName}</span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 text-[11px] text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-md">
          <Info className="w-3.5 h-3.5 text-neutral-400" />
          <span>Botanical 3D Approximation</span>
        </div>
      </div>
    </div>
  );
};
