'use client'

import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef, useCallback, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

interface SimpleGhostProps {
  scrollProgress: number
}

function Ghost({ scrollProgress }: { scrollProgress: number }) {
  const groupRef = useRef<THREE.Group>(null!)
  const mouseRef = useRef(new THREE.Vector2())
  const [ghostModel, setGhostModel] = useState<THREE.Group | null>(null)
  const { scene } = useThree()
  
  // Load the ghost model using traditional GLTFLoader
  useEffect(() => {
    console.log('🎯 Starting to load ghost model...')
    
    const loader = new GLTFLoader()
    
    loader.load(
      '/models/ghost1.glb',
      (gltf) => {
        console.log('✅ Ghost model loaded successfully:', gltf)
        console.log('🎯 Ghost scene:', gltf.scene)
        
        // Log all objects to understand structure
        console.log('🔍 Ghost scene structure:')
        gltf.scene.traverse((child) => {
          console.log(`- ${child.type}: "${child.name}" (visible: ${child.visible})`)
        })
        
        // Make sure everything is visible
        gltf.scene.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh
            mesh.visible = true
            if (mesh.material) {
              const material = mesh.material as THREE.MeshStandardMaterial
              material.visible = true
              material.opacity = 1.0
              material.transparent = false
              // Add some emissive to make it glow and be visible
              material.emissive = new THREE.Color(0x4C1D95) // Purple glow
              material.emissiveIntensity = 0.3
              material.needsUpdate = true
            }
          }
        })
        
        // Position and scale the ghost
        const box = new THREE.Box3().setFromObject(gltf.scene)
        const center = box.getCenter(new THREE.Vector3())
        const size = box.getSize(new THREE.Vector3())
        
        console.log('📦 Ghost bounding box:', { center, size })
        
        // Center the model
        gltf.scene.position.x = -center.x
        gltf.scene.position.y = -center.y
        gltf.scene.position.z = -center.z
        
        // Scale it to be visible
        const maxDim = Math.max(size.x, size.y, size.z)
        if (maxDim > 0) {
          const scale = 2 / maxDim  // Make it 2 units tall
          gltf.scene.scale.setScalar(scale * 2) // Double the size for visibility
        }
        
        console.log('✅ Ghost positioned and scaled')
        console.log('📍 Final position:', gltf.scene.position)
        console.log('📏 Final scale:', gltf.scene.scale)
        
        setGhostModel(gltf.scene)
      },
      (progress) => {
        console.log('📈 Loading progress:', (progress.loaded / progress.total * 100) + '%')
      },
      (error) => {
        console.error('❌ Error loading ghost model:', error)
      }
    )
  }, [])

  // Simple mouse tracking
  const handleMouseMove = useCallback((event: MouseEvent) => {
    mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1
    mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1
  }, [])
  
  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [handleMouseMove])
  
  // Simple animation with mouse following
  useFrame((state) => {
    if (!groupRef.current || !ghostModel) return
    
    const time = state.clock.getElapsedTime()
    
    // Simple idle floating
    groupRef.current.position.y = Math.sin(time) * 0.3
    
    // Simple rotation based on mouse
    groupRef.current.rotation.y = mouseRef.current.x * 0.5
    groupRef.current.rotation.x = -mouseRef.current.y * 0.3
    
    // Log occasionally
    if (Math.floor(time) % 2 === 0 && time % 1 < 0.016) {
      console.log('🔄 Animation running, mouse:', mouseRef.current.x.toFixed(2), mouseRef.current.y.toFixed(2))
    }
  })

  if (!ghostModel) {
    console.log('⏳ Ghost model not loaded yet... showing fallback cube')
    // Show a fallback cube while loading
    return (
      <group ref={groupRef} visible={true}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#8B5CF6" emissive="#4C1D95" emissiveIntensity={0.5} />
        </mesh>
      </group>
    )
  }

  return (
    <group ref={groupRef} visible={true}>
      <primitive object={ghostModel} visible={true} />
    </group>
  )
}

export default function SimpleGhost({ scrollProgress }: SimpleGhostProps) {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 75 }}
        gl={{ 
          antialias: true, 
          alpha: true,
        }}
      >
        {/* Simple lighting */}
        <ambientLight intensity={3.0} />
        <directionalLight position={[5, 5, 5]} intensity={2.0} />
        <pointLight position={[-5, 5, 5]} intensity={2.0} color="#8B5CF6" />
        
        {/* Dark background */}
        <color attach="background" args={['#0a0a0f']} />
        
        <Ghost scrollProgress={scrollProgress} />
      </Canvas>
    </div>
  )
}