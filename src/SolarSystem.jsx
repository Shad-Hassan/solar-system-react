// src/components/SolarSystem.jsx
import * as THREE from "three";
import { useEffect, useRef } from "react";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { Canvas } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import { useMotionTemplate, useMotionValue, animate, motion } from "framer-motion";

export default function SolarSystem() {
  const mountRef = useRef();
  const REDS = [
    "rgba(80, 20, 20, 0.05)",
    "rgba(100, 30, 30, 0.07)",
    "rgba(70, 15, 15, 0.04)",
    "rgba(90, 25, 25, 0.06)",
  ];
  const nebulaColor = useMotionValue(REDS[0]);

  useEffect(() => {
    animate(nebulaColor, REDS, {
      duration: 8,
      repeat: Infinity,
      repeatType: "mirror",
      ease: "easeInOut",
    });
  }, []);

  const backgroundImage = useMotionTemplate`
    radial-gradient(200% 150% at 50% 50%, ${nebulaColor} 5%, #020617 70%)
  `;

  useEffect(() => {
    const mount = mountRef.current;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.setSize(innerWidth, innerHeight);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 2000);
    camera.position.set(-50, 90, 150);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    scene.add(new THREE.AmbientLight(0xffffff, 0.05));

    const loader = new THREE.TextureLoader();
    const sunTex = loader.load("/images/sun.jpg");
    const planetTex = {
      mercury: loader.load("/images/mercury.jpg"),
      venus: loader.load("/images/venus.jpg"),
      earth: loader.load("/images/earth.jpg"),
      mars: loader.load("/images/mars.jpg"),
      jupiter: loader.load("/images/jupiter.jpg"),
      saturn: loader.load("/images/saturn.jpg"),
      uranus: loader.load("/images/uranus.jpg"),
      neptune: loader.load("/images/neptune.jpg"),
      pluto: loader.load("/images/pluto.jpg"),
    };

    const sun = new THREE.Mesh(
      new THREE.SphereGeometry(20, 50, 50),
      new THREE.MeshStandardMaterial({
        map: sunTex,
        emissive: 0xffdd33,
        emissiveIntensity: 6,
      })
    );
    sun.castShadow = true;
    scene.add(sun);

    const sunLight = new THREE.PointLight(0xffffff, 5, 1500);
    sunLight.castShadow = true;
    sunLight.position.copy(sun.position);
    scene.add(sunLight);

    const sunGlow = new THREE.Mesh(
      new THREE.SphereGeometry(24, 50, 50),
      new THREE.MeshBasicMaterial({
        color: 0xffaa00,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    sun.add(sunGlow);

    const asteroidCount = 1000;
    const astPos = new Float32Array(asteroidCount * 3);
    for (let i = 0; i < asteroidCount; i++) {
      const θ = Math.random() * Math.PI * 2;
      const r = THREE.MathUtils.lerp(85, 95, Math.random());
      astPos.set([
        Math.cos(θ) * r,
        THREE.MathUtils.randFloatSpread(4),
        Math.sin(θ) * r,
      ], i * 3);
    }
    const asteroidBelt = new THREE.Points(
      new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(astPos, 3)),
      new THREE.PointsMaterial({ size: 0.7, color: 0x888888 })
    );
    scene.add(asteroidBelt);

    const bodies = [];
    function makeOrbit(dist) {
      const pts = [];
      for (let i = 0; i <= 128; i++) {
        const θ = (i / 128) * Math.PI * 2;
        pts.push(dist * Math.cos(θ), 0, dist * Math.sin(θ));
      }
      const orbit = new THREE.LineLoop(
        new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(pts, 3)),
        new THREE.LineBasicMaterial({ color: 0x444444 })
      );
      scene.add(orbit);
    }
    function makePlanet(tex, size, dist, orbitSpeed, spinSpeed) {
      const mat = new THREE.MeshStandardMaterial({
        map: tex,
        emissive: 0xffffff,
        emissiveMap: tex,
        emissiveIntensity: 0.3,
        roughness: 1,
      });
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(size, 64, 64), mat);
      mesh.castShadow = mesh.receiveShadow = true;
      const pivot = new THREE.Object3D();
      scene.add(pivot);
      mesh.position.set(dist, 0, 0);
      pivot.add(mesh);
      makeOrbit(dist);
      bodies.push({ mesh, pivot, orbitSpeed, spinSpeed });
    }

    makePlanet(planetTex.mercury, 4, 28, 0.004, 0.004);
    makePlanet(planetTex.venus,   6, 44, 0.015, 0.002);
    makePlanet(planetTex.earth,   7, 62, 0.01,  0.02);
    makePlanet(planetTex.mars,    5, 78, 0.008, 0.018);
    makePlanet(planetTex.jupiter, 14,100, 0.002, 0.04);
    makePlanet(planetTex.saturn,  11,138, 0.0009,0.038);
    makePlanet(planetTex.uranus,  8,176, 0.0004,0.03);
    makePlanet(planetTex.neptune, 8,200, 0.0001,0.032);
    makePlanet(planetTex.pluto,   3,216, 0.0007,0.008);

    renderer.setAnimationLoop(() => {
      controls.update();
      sun.rotation.y += 0.003;
      sunGlow.material.opacity = 0.5 + Math.sin(Date.now() * 0.005) * 0.3;
      asteroidBelt.rotation.y += 0.0002;
      bodies.forEach(({ mesh, pivot, orbitSpeed, spinSpeed }) => {
        pivot.rotation.y += orbitSpeed;
        mesh.rotation.y += spinSpeed;
      });
      renderer.render(scene, camera);
    });

    window.addEventListener("resize", () => {
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(innerWidth, innerHeight);
    });

    return () => mount.removeChild(renderer.domElement);
  }, []);

  return (
    <motion.div
      style={{ backgroundImage }}
      className="relative w-full h-screen overflow-hidden"
    >
      <div ref={mountRef} className="absolute inset-0 z-10" />
      <div className="absolute inset-0 z-0">
        <Canvas>
          <Stars radius={80} count={3000} factor={4} fade speed={2} />
        </Canvas>
      </div>
    </motion.div>
  );
}
