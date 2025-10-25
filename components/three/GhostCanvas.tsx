'use client'

import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { useEffect, useRef, useCallback, useMemo } from 'react'
import * as THREE from 'three'
import { WiggleBone } from '../../lib/wiggle'

interface GhostCanvasProps {
  scrollProgress: number
}

function Ghost({ scrollProgress }: { scrollProgress: number }) {
  const groupRef = useRef<THREE.Group>(null!)
  const wiggleBonesRef = useRef<unknown[]>([])
  const rootBoneRef = useRef<THREE.Bone | null>(null)
  const mouseRef = useRef(new THREE.Vector2())
  const basePositionRef = useRef(new THREE.Vector3(0, 0, 0))
  const materialRef = useRef<THREE.MeshStandardMaterial[]>([])
  const raycasterRef = useRef(new THREE.Raycaster())
  const planeRef = useRef(new THREE.Plane(new THREE.Vector3(0, 0, 1), -2))
  const targetPositionRef = useRef(new THREE.Vector3())
  
  const gltf = useGLTF('/models/ghost1.glb')
  const { camera } = useThree()
  
  // Clone the scene to avoid mutation
  const ghostScene = useMemo(() => gltf.scene.clone(), [gltf.scene])
  
  // Create premium environment texture for reflections
  const envTexture = useRef<THREE.Texture | null>(null)
  
  useEffect(() => {
    // Create a premium gradient environment texture
    const canvas = document.createElement('canvas')
    canvas.width = 2
    canvas.height = 512
    
    const context = canvas.getContext('2d')!
    const gradient = context.createLinearGradient(0, 0, 0, 512)
    gradient.addColorStop(0, '#1e1b4b')     // Deep indigo top
    gradient.addColorStop(0.3, '#7c3aed')  // Purple 
    gradient.addColorStop(0.7, '#ec4899')  // Pink
    gradient.addColorStop(1, '#0891b2')    // Cyan bottom
    
    context.fillStyle = gradient
    context.fillRect(0, 0, 2, 512)
    
    const texture = new THREE.CanvasTexture(canvas)
    texture.mapping = THREE.EquirectangularReflectionMapping
    texture.colorSpace = THREE.SRGBColorSpace
    
    envTexture.current = texture
  }, [])
  
  // Setup ghost materials, positioning, and wiggle bones
  useEffect(() => {
    if (ghostScene && groupRef.current) {
      console.log('🎯 Setting up Premium Ghost with enhanced materials and animations')
      console.log('🔍 Ghost scene structure:')
      console.log(ghostScene)
      
      // Log all objects in the scene to understand structure
      console.log('🔍 All objects in ghost scene:')
      ghostScene.traverse((child) => {
        console.log(`- ${child.type}: "${child.name}" (children: ${child.children.length})`)
      })
      
      // Premium material enhancement
      const materials: THREE.MeshStandardMaterial[] = []
      
      ghostScene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh
          mesh.castShadow = true
          mesh.receiveShadow = true
          
          if (mesh.material) {
            const material = mesh.material as THREE.MeshStandardMaterial
            
            // Ensure complete visibility
            material.opacity = 1.0
            material.transparent = false
            material.visible = true
            
            // Premium chrome-like properties with enhanced reflectivity
            material.metalness = 0.95
            material.roughness = 0.15
            material.envMapIntensity = 2.5
            
            // Apply environment texture for premium reflections
            if (envTexture.current) {
              material.envMap = envTexture.current
            }
            
            // Dynamic iridescent emissive glow
            material.emissive = new THREE.Color(0x7c3aed)
            material.emissiveIntensity = 0.5
            
            material.needsUpdate = true
            materials.push(material)
          }
        }
      })
      materialRef.current = materials
      console.log(`🎨 Enhanced ${materials.length} materials`)
      
      // Find and setup the Root bone (exactly like Draggable project)
      console.log('🔍 Looking for Root bone...')
      const rootBone = ghostScene.getObjectByName("Root") as THREE.Bone
      if (rootBone) {
        rootBoneRef.current = rootBone
        console.log('🎯 Found Root bone:', rootBone.name, rootBone.type)
      } else {
        console.log('❌ Root bone not found, looking for any bone...')
        // Fallback: find first bone
        let firstBone: THREE.Bone | null = null
        ghostScene.traverse((child) => {
          if (child.type === 'Bone' && !firstBone) {
            firstBone = child as THREE.Bone
            rootBoneRef.current = firstBone
            console.log('🎯 Found fallback bone:', firstBone.name || 'unnamed', firstBone.type)
          }
        })
        
        if (!firstBone) {
          console.log('❌ No bones found at all!')
        }
      }
      
      // Setup wiggle bones exactly like Draggable project
      console.log('🔍 Looking for Bone1, Bone2, Bone3...')
      const bone1 = ghostScene.getObjectByName("Bone1") as THREE.Bone
      const bone2 = ghostScene.getObjectByName("Bone2") as THREE.Bone
      const bone3 = ghostScene.getObjectByName("Bone3") as THREE.Bone
      
      console.log('Bone1 found:', !!bone1, bone1?.name)
      console.log('Bone2 found:', !!bone2, bone2?.name)
      console.log('Bone3 found:', !!bone3, bone3?.name)
      
      wiggleBonesRef.current = []
      
      if (bone1) {
        try {
          wiggleBonesRef.current.push(new WiggleBone(bone1, { velocity: 0.4 }))
          console.log('✅ Wiggle Bone 1 added successfully')
        } catch (error) {
          console.error('❌ Error adding Wiggle Bone 1:', error)
        }
      }
      if (bone2) {
        try {
          wiggleBonesRef.current.push(new WiggleBone(bone2, { velocity: 0.4 }))
          console.log('✅ Wiggle Bone 2 added successfully')
        } catch (error) {
          console.error('❌ Error adding Wiggle Bone 2:', error)
        }
      }
      if (bone3) {
        try {
          wiggleBonesRef.current.push(new WiggleBone(bone3, { velocity: 0.4 }))
          console.log('✅ Wiggle Bone 3 added successfully')
        } catch (error) {
          console.error('❌ Error adding Wiggle Bone 3:', error)
        }
      }
      
      console.log(`🌊 Total wiggle bones created: ${wiggleBonesRef.current.length}`)
      
      // Premium positioning and scaling
      const box = new THREE.Box3().setFromObject(ghostScene)
      const center = box.getCenter(new THREE.Vector3())
      const size = box.getSize(new THREE.Vector3())
      
      console.log('📦 Ghost bounding box:', { center, size })
      
      // Center and elevate the model
      ghostScene.position.x = -center.x
      ghostScene.position.y = -center.y + 2
      ghostScene.position.z = -center.z
      
      // Scale for premium presence - larger and more imposing
      const maxDim = Math.max(size.x, size.y, size.z)
      if (maxDim > 4) {
        const scale = 4 / maxDim
        ghostScene.scale.multiplyScalar(scale)
      }
      ghostScene.scale.multiplyScalar(4.0) // Bigger presence
      
      // Set initial position for hero impact
      ghostScene.position.set(0, 0, 0)
      console.log('✅ Premium Ghost positioned and scaled')
      console.log('📍 Final ghost position:', ghostScene.position)
      console.log('📏 Final ghost scale:', ghostScene.scale)
    }
  }, [ghostScene])

  // Enhanced mouse tracking (combines Draggable logic with premium smoothness)
  const handleMouseMove = useCallback((event: MouseEvent) => {
    // Convert to normalized device coordinates
    mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1
    mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1
    
    // Debug mouse position occasionally
    if (Math.random() < 0.01) {
      console.log('🖱️ Mouse position:', mouseRef.current.x.toFixed(3), mouseRef.current.y.toFixed(3))
    }
  }, [])
  
  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [handleMouseMove])
  
  // Premium animation loop with enhanced interactions
  useFrame((state) => {
    if (!groupRef.current) return
    
    const time = state.clock.getElapsedTime()
    
    // Debug every few seconds
    if (Math.floor(time) % 3 === 0 && time % 1 < 0.016) {
      console.log('🔄 Animation loop running at time:', time.toFixed(2))
      console.log('👻 Group position:', groupRef.current.position)
      console.log('🦴 Root bone exists:', !!rootBoneRef.current)
      console.log('🌊 Wiggle bones count:', wiggleBonesRef.current.length)
    }
    
    // Update wiggle bones (essential for Draggable-style physics)
    wiggleBonesRef.current.forEach((wb, index) => {
      try {
        (wb as { update: () => void }).update()
        
        // Debug wiggle bone updates occasionally
        if (Math.floor(time) % 5 === 0 && time % 1 < 0.016) {
          console.log(`🌊 Wiggle bone ${index} updated successfully`)
        }
      } catch (error) {
        console.error(`❌ Error updating wiggle bone ${index}:`, error)
      }
    })
    
    // PREMIUM SCROLL-BASED CINEMATIC SEQUENCES
    if (scrollProgress < 0.2) {
      // Hero section - dramatic entrance and strong mouse following
      basePositionRef.current.set(0, 0, 0)
      groupRef.current.scale.setScalar(4.0)
      
      // Premium pulsing glow with iridescent color shifts
      materialRef.current.forEach(mat => {
        const pulseIntensity = 0.4 + Math.sin(time * 2.5) * 0.2
        mat.emissiveIntensity = pulseIntensity
        
        // Color shifting through purple spectrum
        const hue = (time * 0.1) % 1
        mat.emissive.setHSL(0.7 + hue * 0.3, 0.8, 0.6)
      })
      
    } else if (scrollProgress < 0.4) {
      // Features section - elegant drift with premium lighting
      const sectionProgress = (scrollProgress - 0.2) / 0.2
      basePositionRef.current.x = THREE.MathUtils.lerp(0, 5, sectionProgress)
      basePositionRef.current.y = Math.sin(sectionProgress * Math.PI) * 1.5
      basePositionRef.current.z = THREE.MathUtils.lerp(0, 2, sectionProgress)
      groupRef.current.scale.setScalar(THREE.MathUtils.lerp(4.0, 3.2, sectionProgress))
      
      // Purple to pink gradient shift
      materialRef.current.forEach(mat => {
        mat.emissive.lerpColors(
          new THREE.Color(0x7c3aed), 
          new THREE.Color(0xec4899), 
          sectionProgress
        )
        mat.emissiveIntensity = 0.6
      })
      
    } else if (scrollProgress < 0.6) {
      // Innovation section - dramatic flyby effect
      const sectionProgress = (scrollProgress - 0.4) / 0.2
      basePositionRef.current.x = -4
      basePositionRef.current.y = Math.sin(sectionProgress * Math.PI * 2) * 2
      basePositionRef.current.z = -10 + Math.sin(sectionProgress * Math.PI) * 12
      groupRef.current.scale.setScalar(THREE.MathUtils.lerp(3.2, 2.0, sectionProgress))
      
    } else if (scrollProgress < 0.8) {
      // Premium section - orbital showcase with color spectrum
      const sectionProgress = (scrollProgress - 0.6) / 0.2
      const angle = sectionProgress * Math.PI * 3 + time * 0.7
      basePositionRef.current.x = Math.cos(angle) * 4
      basePositionRef.current.z = Math.sin(angle) * 3 - 1
      basePositionRef.current.y = Math.sin(sectionProgress * Math.PI * 2) * 2.5
      groupRef.current.scale.setScalar(3.5)
      
      // Rainbow spectrum effect for premium feeling
      materialRef.current.forEach(mat => {
        const spectrumHue = (sectionProgress * 2 + time * 0.2) % 1
        mat.emissive.setHSL(spectrumHue, 0.9, 0.7)
        mat.emissiveIntensity = 0.7 + Math.sin(time * 3) * 0.2
      })
      
    } else {
      // CTA section - grand finale entrance
      const sectionProgress = (scrollProgress - 0.8) / 0.2
      basePositionRef.current.x = Math.sin(time * 0.8) * 3 * (1 - sectionProgress)
      basePositionRef.current.y = THREE.MathUtils.lerp(-8, 0, sectionProgress)
      basePositionRef.current.z = THREE.MathUtils.lerp(-12, 0, sectionProgress)
      groupRef.current.scale.setScalar(THREE.MathUtils.lerp(1.5, 5.0, sectionProgress))
      
      // Intense finale glow
      materialRef.current.forEach(mat => {
        mat.emissiveIntensity = 0.5 + sectionProgress * 0.8
        mat.emissive = new THREE.Color(0xffffff) // Pure white finale
      })
    }
    
    // ENHANCED IDLE AND MOUSE ANIMATIONS
    // Premium floating animation (more elegant than basic bob)
    const idleBob = Math.sin(time * 1.2) * 0.2
    const idleRotation = Math.sin(time * 0.4) * 0.03
    const idleTilt = Math.cos(time * 0.6) * 0.01
    
    // Dynamic mouse influence based on scroll (stronger in hero)
    const mouseInfluence = scrollProgress < 0.2 ? 1.0 : Math.max(0.4, 1 - scrollProgress * 1.5)
    
    // Apply cinematic position changes
    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, basePositionRef.current.x, 0.08)
    groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, basePositionRef.current.z, 0.08)
    
    // Apply enhanced idle animations
    groupRef.current.position.y = basePositionRef.current.y + idleBob
    groupRef.current.rotation.y += idleRotation
    groupRef.current.rotation.z += idleTilt
    
    // PREMIUM MOUSE FOLLOWING WITH DRAGGABLE-STYLE PHYSICS
    if (rootBoneRef.current) {
      // Enhanced raycasting for precise mouse tracking (like Draggable)
      raycasterRef.current.setFromCamera(mouseRef.current, camera)
      
      const intersectionPoint = new THREE.Vector3()
      raycasterRef.current.ray.intersectPlane(planeRef.current, intersectionPoint)
      
      // Update target position for premium responsiveness
      targetPositionRef.current.copy(intersectionPoint)
      targetPositionRef.current.y += 4
      
      // Continuous idle sway animation (keeps wiggle bones active)
      const idleSwayX = Math.sin(time * 0.9) * 0.2
      const idleSwayY = Math.cos(time * 0.7) * 0.15
      const idleSwayZ = Math.sin(time * 1.1) * 0.1
      
      // Mouse following calculations
      let finalRotationX = idleSwayX
      let finalRotationY = idleSwayY
      let finalRotationZ = idleSwayZ
      
      if (mouseInfluence > 0) {
        const mouseRotationY = mouseRef.current.x * 1.5 * mouseInfluence  // Horizontal mouse -> Y rotation
        const mouseRotationX = -mouseRef.current.y * 1.0 * mouseInfluence  // Vertical mouse -> X rotation (inverted)
        const mouseRotationZ = mouseRef.current.x * 0.4 * mouseInfluence   // Subtle Z tilt for realism
        
        finalRotationX += mouseRotationX
        finalRotationY += mouseRotationY
        finalRotationZ += mouseRotationZ
      }
      
      // Apply premium smooth lerping to root bone (triggers wiggle physics)
      const lerpFactor = 0.12  // More responsive than phantom premium
      rootBoneRef.current.rotation.x = THREE.MathUtils.lerp(rootBoneRef.current.rotation.x, finalRotationX, lerpFactor)
      rootBoneRef.current.rotation.y = THREE.MathUtils.lerp(rootBoneRef.current.rotation.y, finalRotationY, lerpFactor)
      rootBoneRef.current.rotation.z = THREE.MathUtils.lerp(rootBoneRef.current.rotation.z, finalRotationZ, lerpFactor)
    }
  })

  return (
    <group ref={groupRef} visible={true}>
      <primitive object={ghostScene} visible={true} />
    </group>
  )
}

// Premium dynamic lighting system
function PremiumLights({ scrollProgress }: { scrollProgress: number }) {
  const primaryLight = useRef<THREE.PointLight>(null!)
  const secondaryLight = useRef<THREE.PointLight>(null!)
  const accentLight = useRef<THREE.PointLight>(null!)
  const rimLight = useRef<THREE.PointLight>(null!)
  const fillLight = useRef<THREE.PointLight>(null!)
  
  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    
    if (scrollProgress < 0.2) {
      // Hero section - premium multi-light setup
      if (primaryLight.current) {
        primaryLight.current.intensity = 6.0 + Math.sin(time * 2.8) * 1.5
        primaryLight.current.position.x = Math.sin(time * 0.6) * 4
        primaryLight.current.position.z = Math.cos(time * 0.6) * 4
      }
      if (secondaryLight.current) {
        secondaryLight.current.intensity = 5.0 + Math.sin(time * 3.2 + Math.PI) * 1.2
        secondaryLight.current.position.x = Math.sin(time * 0.8 + Math.PI) * 3
        secondaryLight.current.position.z = Math.cos(time * 0.8 + Math.PI) * 3
      }
      if (accentLight.current) {
        accentLight.current.intensity = 4.5 + Math.sin(time * 2.1) * 1.0
        accentLight.current.position.y = 3 + Math.sin(time * 1.2) * 1.5
      }
      if (rimLight.current) {
        rimLight.current.intensity = 3.5 + Math.sin(time * 3.5) * 1.0
      }
      if (fillLight.current) {
        fillLight.current.intensity = 3.0 + Math.sin(time * 2.6) * 0.8
      }
      
    } else if (scrollProgress < 0.4) {
      // Features section - purple dominance with premium gradients
      if (primaryLight.current) primaryLight.current.intensity = 7.0
      if (secondaryLight.current) secondaryLight.current.intensity = 5.5
      if (accentLight.current) accentLight.current.intensity = 2.0
      if (rimLight.current) rimLight.current.intensity = 1.5
      if (fillLight.current) fillLight.current.intensity = 1.2
      
    } else if (scrollProgress < 0.6) {
      // Innovation section - dynamic movement with premium effects
      const sectionProgress = (scrollProgress - 0.4) / 0.2
      const angle = sectionProgress * Math.PI * 2 + time * 0.8
      
      if (primaryLight.current) {
        primaryLight.current.intensity = 4.0 + Math.sin(angle) * 2.0
        primaryLight.current.position.x = Math.cos(angle) * 5
        primaryLight.current.position.z = Math.sin(angle) * 5
      }
      if (secondaryLight.current) {
        secondaryLight.current.intensity = 4.0 + Math.sin(angle + Math.PI * 0.5) * 2.0
        secondaryLight.current.position.x = Math.cos(angle + Math.PI * 0.5) * 5
        secondaryLight.current.position.z = Math.sin(angle + Math.PI * 0.5) * 5
      }
      
    } else if (scrollProgress < 0.8) {
      // Premium section - spectrum showcase
      const sectionProgress = (scrollProgress - 0.6) / 0.2
      const spectralAngle = sectionProgress * Math.PI * 4 + time * 1.0
      
      if (primaryLight.current) {
        primaryLight.current.intensity = 4.5 + Math.sin(spectralAngle) * 2.0
      }
      if (secondaryLight.current) {
        secondaryLight.current.intensity = 4.5 + Math.sin(spectralAngle + Math.PI * 0.4) * 2.0
      }
      if (accentLight.current) {
        accentLight.current.intensity = 4.5 + Math.sin(spectralAngle + Math.PI * 0.8) * 2.0
      }
      if (rimLight.current) {
        rimLight.current.intensity = 4.5 + Math.sin(spectralAngle + Math.PI * 1.2) * 2.0
      }
      if (fillLight.current) {
        fillLight.current.intensity = 4.5 + Math.sin(spectralAngle + Math.PI * 1.6) * 2.0
      }
      
    } else {
      // CTA section - grand finale with maximum impact
      const sectionProgress = (scrollProgress - 0.8) / 0.2
      const intensity = 4.0 + sectionProgress * 6.0
      
      if (primaryLight.current) primaryLight.current.intensity = intensity
      if (secondaryLight.current) secondaryLight.current.intensity = intensity * 0.8
      if (accentLight.current) accentLight.current.intensity = intensity * 0.6
      if (rimLight.current) rimLight.current.intensity = intensity * 0.4
      if (fillLight.current) fillLight.current.intensity = intensity * 0.3
    }
  })
  
  return (
    <>
      <pointLight ref={primaryLight} position={[-6, 3, -4]} color="#7c3aed" />
      <pointLight ref={secondaryLight} position={[6, 3, -4]} color="#ec4899" />
      <pointLight ref={accentLight} position={[0, 5, 3]} color="#3b82f6" />
      <pointLight ref={rimLight} position={[-4, -2, 5]} color="#06b6d4" />
      <pointLight ref={fillLight} position={[4, -2, 5]} color="#f59e0b" />
    </>
  )
}

export default function GhostCanvas({ scrollProgress }: GhostCanvasProps) {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 45 }}
        gl={{ 
          antialias: true, 
          alpha: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.8,
        }}
        shadows
      >
        {/* Enhanced base lighting */}
        <ambientLight intensity={2.5} />
        <directionalLight 
          position={[12, 12, 8]} 
          intensity={4.0} 
          castShadow 
          shadow-mapSize-width={4096}
          shadow-mapSize-height={4096}
        />
        
        {/* Premium dark background */}
        <color attach="background" args={['#0a0a0f']} />
        
        {/* Premium dynamic lighting system */}
        <PremiumLights scrollProgress={scrollProgress} />
        
        {/* Enhanced fog for depth */}
        <fog attach="fog" args={['#0a0a0f', 8, 25]} />
        
        <Ghost scrollProgress={scrollProgress} />
      </Canvas>
    </div>
  )
}