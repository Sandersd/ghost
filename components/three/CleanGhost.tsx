'use client'

import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef, useCallback, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { WiggleBone } from '../../lib/wiggle'

interface CleanGhostProps {
  scrollProgress: number
}

function Ghost({ scrollProgress }: { scrollProgress: number }) {
  const groupRef = useRef<THREE.Group>(null!)
  const mouseRef = useRef(new THREE.Vector2())
  const [ghostModel, setGhostModel] = useState<THREE.Group | null>(null)
  const [rootBone, setRootBone] = useState<THREE.Bone | null>(null)
  const [wiggleBones, setWiggleBones] = useState<unknown[]>([])
  const raycaster = useRef(new THREE.Raycaster())
  const plane = useRef(new THREE.Plane(new THREE.Vector3(0, 0, 1), -2))
  const targetPosition = useRef(new THREE.Vector3())
  const { camera } = useThree()
  
  // Load ghost model
  useEffect(() => {
    console.log('🎯 Loading ghost model...')
    
    const loader = new GLTFLoader()
    
    loader.load(
      '/models/ghost1.glb',
      (gltf) => {
        console.log('✅ Ghost model loaded!')
        
        // Log structure to understand the model
        console.log('🔍 Model structure:')
        gltf.scene.traverse((child) => {
          console.log(`- ${child.type}: "${child.name}"`)
        })
        
        // Set up materials (chrome-like with premium glow)
        gltf.scene.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh
            mesh.castShadow = true
            mesh.receiveShadow = true
            
            if (mesh.material) {
              const material = mesh.material as THREE.MeshStandardMaterial
              material.metalness = 0.9
              material.roughness = 0.1
              material.emissive = new THREE.Color(0x7c3aed)
              material.emissiveIntensity = 0.4
              material.needsUpdate = true
            }
          }
        })
        
        // Find root bone for mouse tracking
        const foundRootBone = gltf.scene.getObjectByName("Root") as THREE.Bone
        if (foundRootBone) {
          console.log('🎯 Found Root bone')
          setRootBone(foundRootBone)
        } else {
          console.log('❌ Root bone not found, looking for any bone...')
          gltf.scene.traverse((child) => {
            if (child.type === 'Bone' && !foundRootBone) {
              console.log('🎯 Using bone:', child.name)
              setRootBone(child as THREE.Bone)
            }
          })
        }
        
        // Set up wiggle bones
        const bones = []
        const bone1 = gltf.scene.getObjectByName("Bone1") as THREE.Bone
        const bone2 = gltf.scene.getObjectByName("Bone2") as THREE.Bone
        const bone3 = gltf.scene.getObjectByName("Bone3") as THREE.Bone
        
        if (bone1) {
          bones.push(new WiggleBone(bone1, { velocity: 0.4 }))
          console.log('✅ Added Wiggle Bone 1')
        }
        if (bone2) {
          bones.push(new WiggleBone(bone2, { velocity: 0.4 }))
          console.log('✅ Added Wiggle Bone 2')
        }
        if (bone3) {
          bones.push(new WiggleBone(bone3, { velocity: 0.4 }))
          console.log('✅ Added Wiggle Bone 3')
        }
        
        setWiggleBones(bones)
        console.log(`🌊 Created ${bones.length} wiggle bones`)
        
        // Position and scale the model
        const box = new THREE.Box3().setFromObject(gltf.scene)
        const center = box.getCenter(new THREE.Vector3())
        const size = box.getSize(new THREE.Vector3())
        
        // Center the model
        gltf.scene.position.x = -center.x
        gltf.scene.position.y = -center.y + 3 // Lift up like in draggable
        gltf.scene.position.z = -center.z
        
        // Scale the model to be big enough
        const maxDim = Math.max(size.x, size.y, size.z)
        if (maxDim > 4) {
          const scale = 4 / maxDim
          gltf.scene.scale.multiplyScalar(scale)
        }
        gltf.scene.scale.multiplyScalar(5) // Make it big like in draggable
        
        setGhostModel(gltf.scene)
        console.log('✅ Ghost ready!')
      },
      (progress) => {
        console.log('📈 Loading:', Math.round(progress.loaded / progress.total * 100) + '%')
      },
      (error) => {
        console.error('❌ Loading error:', error)
      }
    )
  }, [])

  // Mouse tracking
  const handleMouseMove = useCallback((event: MouseEvent) => {
    mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1
    mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1
  }, [])
  
  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [handleMouseMove])
  
  // Animation loop
  useFrame((state) => {
    if (!groupRef.current) return
    
    const time = state.clock.getElapsedTime()
    
    // Update wiggle bones
    wiggleBones.forEach(wb => {
      try {
        (wb as { update: () => void }).update()
      } catch {
        // Silent fail
      }
    })
    
    // Idle floating animation
    groupRef.current.position.y = Math.sin(time * 1.5) * 0.2
    
    // Root bone mouse following (like draggable project)
    if (rootBone) {
      // Raycasting for precise tracking
      raycaster.current.setFromCamera(mouseRef.current, camera)
      const intersectionPoint = new THREE.Vector3()
      raycaster.current.ray.intersectPlane(plane.current, intersectionPoint)
      
      // Update target position
      targetPosition.current.copy(intersectionPoint)
      targetPosition.current.y += 4
      
      // Idle sway to keep wiggle bones active
      const idleSwayX = Math.sin(time * 0.8) * 0.15
      const idleSwayY = Math.cos(time * 0.6) * 0.12
      const idleSwayZ = Math.sin(time * 1.0) * 0.08
      
      // Mouse influence
      const mouseInfluence = scrollProgress < 0.2 ? 1.0 : 0.5
      const mouseRotationY = mouseRef.current.x * 1.2 * mouseInfluence
      const mouseRotationX = -mouseRef.current.y * 0.8 * mouseInfluence
      const mouseRotationZ = mouseRef.current.x * 0.3 * mouseInfluence
      
      // Combine idle and mouse
      const finalRotationX = idleSwayX + mouseRotationX
      const finalRotationY = idleSwayY + mouseRotationY
      const finalRotationZ = idleSwayZ + mouseRotationZ
      
      // Smooth lerp to root bone (triggers wiggle physics)
      const lerpFactor = 0.08
      rootBone.rotation.x = THREE.MathUtils.lerp(rootBone.rotation.x, finalRotationX, lerpFactor)
      rootBone.rotation.y = THREE.MathUtils.lerp(rootBone.rotation.y, finalRotationY, lerpFactor)
      rootBone.rotation.z = THREE.MathUtils.lerp(rootBone.rotation.z, finalRotationZ, lerpFactor)
    }
  })

  // Show fallback while loading
  if (!ghostModel) {
    return (
      <group ref={groupRef}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial 
            color="#8B5CF6" 
            emissive="#4C1D95" 
            emissiveIntensity={0.5}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
      </group>
    )
  }

  return (
    <group ref={groupRef}>
      <primitive object={ghostModel} />
    </group>
  )
}

export default function CleanGhost({ scrollProgress }: CleanGhostProps) {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 7], fov: 50 }}
        gl={{ 
          antialias: true, 
          alpha: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.5,
        }}
        shadows
      >
        {/* Enhanced lighting */}
        <ambientLight intensity={2.0} />
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={3.0} 
          castShadow 
        />
        
        {/* Dynamic colored lights */}
        <pointLight position={[-5, 2, -3]} color="#8B5CF6" intensity={4.0} />
        <pointLight position={[5, 2, -3]} color="#EC4899" intensity={4.0} />
        <pointLight position={[0, 4, 2]} color="#3B82F6" intensity={3.0} />
        
        {/* Dark background */}
        <color attach="background" args={['#0a0a0f']} />
        
        {/* Fog for depth */}
        <fog attach="fog" args={['#0a0a0f', 5, 20]} />
        
        <Ghost scrollProgress={scrollProgress} />
      </Canvas>
    </div>
  )
}