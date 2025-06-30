
import * as THREE from "three";
import { useEffect, useRef } from "react";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

const SolarSystem = () => {
  const mountRef = useRef();

  useEffect(() => {
    const mount = mountRef.current;

    // ─── Renderer ──────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
    renderer.setSize(window.innerWidth, window.innerHeight);
    mount.appendChild(renderer.domElement);

    // ─── Scene & Camera ────────────────────────────────────
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(-50, 90, 150);

    // ─── Controls ──────────────────────────────────────────
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // ─── Subtle Ambient Fill ───────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 0.05));

    // ─── Load Textures ─────────────────────────────────────
    const loader = new THREE.TextureLoader();
    const starTex    = loader.load("/images/stars.jpg");
    const sunTex     = loader.load("/images/sun.jpg");
    const planetTexs = {
      mercury:    loader.load("/images/mercury.jpg"),
      venus:      loader.load("/images/venus.jpg"),
      earth:      loader.load("/images/earth.jpg"),
      mars:       loader.load("/images/mars.jpg"),
      jupiter:    loader.load("/images/jupiter.jpg"),
      saturn:     loader.load("/images/saturn.jpg"),
      uranus:     loader.load("/images/uranus.jpg"),
      neptune:    loader.load("/images/neptune.jpg"),
      pluto:      loader.load("/images/pluto.jpg"),
      saturnRing: loader.load("/images/saturn_ring.png"),
      uranusRing: loader.load("/images/uranus_ring.png"),
    };

    // ─── Background & Environment Map ──────────────────────
    scene.background = starTex;
    const envMap = new THREE.CubeTextureLoader().load([
      "/images/stars.jpg","/images/stars.jpg","/images/stars.jpg",
      "/images/stars.jpg","/images/stars.jpg","/images/stars.jpg"
    ]);
    scene.environment = envMap;

    // ─── Sun (bigger!) + Halo + Light ────────────────────
    const sunRadius = 20;
    const sunGeo    = new THREE.SphereGeometry(sunRadius, 50, 50);
    const sunMat    = new THREE.MeshStandardMaterial({
      map: sunTex,
      emissive: 0xffdd33,
      emissiveIntensity: 6,   // ramped up
    });
    const sun = new THREE.Mesh(sunGeo, sunMat);
    sun.castShadow = true;
    scene.add(sun);

    const sunLight = new THREE.PointLight(0xffffff, 5, 1500);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(2048, 2048);
    sunLight.position.copy(sun.position);
    scene.add(sunLight);

    const glowGeo = new THREE.SphereGeometry(sunRadius * 1.5, 50, 50);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    sun.add(glow);

    // ─── Utility: Draw Orbit Ring ─────────────────────────
    const makeOrbit = (r) => {
      const pts = [];
      for (let i = 0; i <= 128; i++) {
        const θ = (i / 128) * Math.PI * 2;
        pts.push(r * Math.cos(θ), 0, r * Math.sin(θ));
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
      const mat = new THREE.LineBasicMaterial({ color: 0x444444 });
      scene.add(new THREE.LineLoop(geo, mat));
    };

    // ─── Utility: Planet + Emissive Glow ──────────────────
    const makePlanet = (size, tex, dist, ringOpt) => {
      const mat = new THREE.MeshStandardMaterial({
        map: tex,
        metalness: 0,
        roughness: 1,
        emissive: new THREE.Color(0xffffff),
        emissiveMap: tex,
        emissiveIntensity: 0.3,  // boost as desired
      });
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(size, 64, 64),
        mat
      );
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      const pivot = new THREE.Object3D();
      scene.add(pivot);
      mesh.position.set(dist, 0, 0);
      pivot.add(mesh);

      if (ringOpt) {
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(ringOpt.inner, ringOpt.outer, 64),
          new THREE.MeshStandardMaterial({
            map: ringOpt.tex,
            side: THREE.DoubleSide,
            transparent: true,
            roughness: 1,
            metalness: 0,
          })
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(dist, 0, 0);
        ring.castShadow = true;
        ring.receiveShadow = true;
        pivot.add(ring);
      }

      makeOrbit(dist);
      return { pivot, mesh };
    };

    // ─── Build All Planets ─────────────────────────────────
    const planets = [
      { ...makePlanet(4,   planetTexs.mercury,  28), orbit: 0.004, spin: 0.004 },
      { ...makePlanet(6,   planetTexs.venus,    44), orbit: 0.015, spin: 0.002 },
      { ...makePlanet(7,   planetTexs.earth,    62), orbit: 0.01,  spin: 0.02  },
      { ...makePlanet(5,   planetTexs.mars,     78), orbit: 0.008, spin: 0.018 },
      { ...makePlanet(14,  planetTexs.jupiter, 100), orbit: 0.002, spin: 0.04  },
      {
        ...makePlanet(11, planetTexs.saturn, 138, {
          inner: 11, outer: 22, tex: planetTexs.saturnRing,
        }),
        orbit: 0.0009, spin: 0.038,
      },
      {
        ...makePlanet(8, planetTexs.uranus, 176, {
          inner: 8, outer: 14, tex: planetTexs.uranusRing,
        }),
        orbit: 0.0004, spin: 0.03,
      },
      { ...makePlanet(8, planetTexs.neptune, 200), orbit: 0.0001, spin: 0.032 },
      { ...makePlanet(3, planetTexs.pluto,   216), orbit: 0.0007, spin: 0.008 },
    ];

    // ─── Animation Loop ───────────────────────────────────
    const animate = () => {
      controls.update();
      sun.rotation.y += 0.003;
      glow.material.opacity = 0.5 + Math.sin(Date.now() * 0.005) * 0.3;

      planets.forEach(({ pivot, mesh, orbit, spin }) => {
        pivot.rotation.y += orbit;
        mesh.rotation.y  += spin;
      });

      renderer.render(scene, camera);
    };
    renderer.setAnimationLoop(animate);

    // ─── Handle Resize ─────────────────────────────────────
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    // ─── Cleanup ────────────────────────────────────────────
    return () => {
      window.removeEventListener("resize", onResize);
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className="w-full h-screen" />;
};

export default SolarSystem;
