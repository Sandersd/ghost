'use client'

import { Stars, Environment } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { WiggleBone } from '../../lib/wiggle'

interface GhostWithControlsProps {
  scrollProgress: number
  onHideUIChange?: (hideUI: boolean) => void
}

interface ControlValues {
  // Position
  positionX: number
  positionY: number
  positionZ: number
  
  // Rotation
  rotationX: number
  rotationY: number
  rotationZ: number
  
  // Scale
  scale: number
  
  // Idle Animation
  idleSpeed: number
  idleAmplitude: number
  idleSwayX: number
  idleSwayY: number
  idleSwayZ: number
  
  // Mouse Tracking
  mouseInfluence: number
  mouseRotationMultiplierX: number
  mouseRotationMultiplierY: number
  mouseRotationMultiplierZ: number
  lerpFactor: number
  
  // Wiggle Bones
  wiggleVelocity: number
  
  // Material
  metalness: number
  roughness: number
  emissiveIntensity: number
  emissiveColor: string
  
  // Lighting
  ambientIntensity: number
  directionalIntensity: number
  pointLight1Intensity: number
  pointLight2Intensity: number
  pointLight3Intensity: number
  
  // Recording Mode
  hideUI: boolean
}

const defaultValues: ControlValues = {
  positionX: 0,
  positionY: -24.2,
  positionZ: 0,
  rotationX: 0,
  rotationY: -1.39159265358979,
  rotationZ: -0.251592653589793,
  scale: 3.6,
  idleSpeed: 1.5,
  idleAmplitude: 0.11,
  idleSwayX: 0.1,
  idleSwayY: 0.07,
  idleSwayZ: 0.04,
  mouseInfluence: 1.0,
  mouseRotationMultiplierX: 0.8,
  mouseRotationMultiplierY: 0.8,
  mouseRotationMultiplierZ: 0.3,
  lerpFactor: 0.17,
  wiggleVelocity: 0.4,
  metalness: 0.9,
  roughness: 0.1,
  emissiveIntensity: 0.4,
  emissiveColor: '#7c3aed',
  ambientIntensity: 2.0,
  directionalIntensity: 3.0,
  pointLight1Intensity: 4.0,
  pointLight2Intensity: 4.0,
  pointLight3Intensity: 3.0,
  hideUI: false,
}

function Ghost({ scrollProgress, controls }: { scrollProgress: number, controls: ControlValues }) {
  const groupRef = useRef<THREE.Group>(null!)
  const mouseRef = useRef(new THREE.Vector2())
  const [ghostModel, setGhostModel] = useState<THREE.Group | null>(null)
  const [rootBone, setRootBone] = useState<THREE.Bone | null>(null)
  const [wiggleBones, setWiggleBones] = useState<unknown[]>([])
  const raycaster = useRef(new THREE.Raycaster())
  const plane = useRef(new THREE.Plane(new THREE.Vector3(0, 0, 1), -2))
  const targetPosition = useRef(new THREE.Vector3())
  const { camera } = useThree()
  const materialsRef = useRef<THREE.MeshStandardMaterial[]>([])
  
  // Load ghost model
  useEffect(() => {
    console.log('🎯 Loading ghost model...')
    
    const loader = new GLTFLoader()
    
    loader.load(
      '/models/ghost2.glb',
      (gltf) => {
        console.log('✅ Ghost model loaded!')
        
        // Set up materials with initial values
        const materials: THREE.MeshStandardMaterial[] = []
        gltf.scene.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh
            mesh.castShadow = true
            mesh.receiveShadow = true
            
            if (mesh.material) {
              const material = mesh.material as THREE.MeshStandardMaterial
              // Chrome-like material properties for reflective surface
              material.metalness = 0.95
              material.roughness = 0.05  
              material.envMapIntensity = 3.0
              // Very minimal emissive - let lighting do the work
              material.emissive = new THREE.Color(0x000000)
              material.emissiveIntensity = 0.0
              material.needsUpdate = true
              materials.push(material)
              console.log('🎨 Material setup:', {
                color: material.color.getHexString(),
                emissive: material.emissive.getHexString(),
                emissiveIntensity: material.emissiveIntensity,
                metalness: material.metalness,
                roughness: material.roughness
              })
            }
          }
        })
        materialsRef.current = materials
        
        // Find root bone
        const foundRootBone = gltf.scene.getObjectByName("Root") as THREE.Bone
        if (foundRootBone) {
          setRootBone(foundRootBone)
        } else {
          gltf.scene.traverse((child) => {
            if (child.type === 'Bone' && !rootBone) {
              setRootBone(child as THREE.Bone)
            }
          })
        }
        
        // Set up wiggle bones with dynamic velocity
        const bones = []
        const bone1 = gltf.scene.getObjectByName("Bone1") as THREE.Bone
        const bone2 = gltf.scene.getObjectByName("Bone2") as THREE.Bone
        const bone3 = gltf.scene.getObjectByName("Bone3") as THREE.Bone
        
        if (bone1) bones.push(new WiggleBone(bone1, { velocity: controls.wiggleVelocity }))
        if (bone2) bones.push(new WiggleBone(bone2, { velocity: controls.wiggleVelocity }))
        if (bone3) bones.push(new WiggleBone(bone3, { velocity: controls.wiggleVelocity }))
        
        setWiggleBones(bones)
        
        // Position, rotation and scale - apply ALL control values
        const box = new THREE.Box3().setFromObject(gltf.scene)
        const center = box.getCenter(new THREE.Vector3())
        
        console.log('🎯 Initial setup - Control values:', controls)
        console.log('📦 Model center:', center)
        console.log('📍 Control positionY value:', controls.positionY)
        console.log('📍 Expected position Y:', -center.y + controls.positionY)
        
        // Apply position from controls
        gltf.scene.position.x = -center.x + controls.positionX
        gltf.scene.position.y = -center.y + controls.positionY
        gltf.scene.position.z = -center.z + controls.positionZ
        
        console.log('📍 Applied position:', gltf.scene.position)
        console.log('📍 Final Y position should be:', gltf.scene.position.y)
        
        // Apply rotation from controls
        gltf.scene.rotation.x = controls.rotationX
        gltf.scene.rotation.y = controls.rotationY
        gltf.scene.rotation.z = controls.rotationZ
        
        console.log('🔄 Applied rotation:', gltf.scene.rotation)
        
        // Apply scale from controls
        const size = box.getSize(new THREE.Vector3())
        const maxDim = Math.max(size.x, size.y, size.z)
        if (maxDim > 4) {
          const scale = 4 / maxDim
          gltf.scene.scale.multiplyScalar(scale)
        }
        gltf.scene.scale.multiplyScalar(controls.scale)
        
        console.log('📏 Applied scale:', gltf.scene.scale)
        
        setGhostModel(gltf.scene)
      },
      undefined,
      (error) => {
        console.error('❌ Loading error:', error)
      }
    )
  }, [])
  
  // Update materials when controls change (chrome materials don't need much updating)
  useEffect(() => {
    materialsRef.current.forEach(material => {
      // Keep chrome properties consistent
      material.metalness = 0.95
      material.roughness = 0.05
      material.envMapIntensity = 3.0
      // Only update emissive if using very subtle effects
      material.emissive = new THREE.Color(0x000000)
      material.emissiveIntensity = 0.0
      material.needsUpdate = true
    })
  }, [controls.metalness, controls.roughness, controls.emissiveIntensity, controls.emissiveColor])
  
  // Update position, rotation and scale
  useEffect(() => {
    if (ghostModel) {
      console.log('🔄 Position update triggered with controls.positionY:', controls.positionY)
      const box = new THREE.Box3().setFromObject(ghostModel)
      const center = box.getCenter(new THREE.Vector3())
      const size = box.getSize(new THREE.Vector3())
      
      ghostModel.position.x = -center.x + controls.positionX
      ghostModel.position.y = -center.y + controls.positionY
      ghostModel.position.z = -center.z + controls.positionZ
      
      console.log('🔄 Updated position to:', ghostModel.position)
      
      ghostModel.rotation.x = controls.rotationX
      ghostModel.rotation.y = controls.rotationY
      ghostModel.rotation.z = controls.rotationZ
      
      ghostModel.scale.setScalar(1)
      const maxDim = Math.max(size.x, size.y, size.z)
      if (maxDim > 4) {
        const scale = 4 / maxDim
        ghostModel.scale.multiplyScalar(scale)
      }
      ghostModel.scale.multiplyScalar(controls.scale)
    }
  }, [ghostModel, controls.positionX, controls.positionY, controls.positionZ, 
      controls.rotationX, controls.rotationY, controls.rotationZ, controls.scale])
  
  // Recreate wiggle bones when velocity changes
  useEffect(() => {
    if (ghostModel && wiggleBones.length > 0) {
      const bones = []
      const bone1 = ghostModel.getObjectByName("Bone1") as THREE.Bone
      const bone2 = ghostModel.getObjectByName("Bone2") as THREE.Bone
      const bone3 = ghostModel.getObjectByName("Bone3") as THREE.Bone
      
      if (bone1) bones.push(new WiggleBone(bone1, { velocity: controls.wiggleVelocity }))
      if (bone2) bones.push(new WiggleBone(bone2, { velocity: controls.wiggleVelocity }))
      if (bone3) bones.push(new WiggleBone(bone3, { velocity: controls.wiggleVelocity }))
      
      setWiggleBones(bones)
    }
  }, [controls.wiggleVelocity])
  
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
    
    // Chrome material doesn't need color animation - let lighting and environment do the work
    
    // Update wiggle bones
    wiggleBones.forEach(wb => {
      try {
        (wb as { update: () => void }).update()
      } catch {
        // Silent fail
      }
    })
    
    // Idle floating animation
    groupRef.current.position.y = Math.sin(time * controls.idleSpeed) * controls.idleAmplitude
    
    // Root bone mouse following
    if (rootBone) {
      raycaster.current.setFromCamera(mouseRef.current, camera)
      const intersectionPoint = new THREE.Vector3()
      raycaster.current.ray.intersectPlane(plane.current, intersectionPoint)
      
      targetPosition.current.copy(intersectionPoint)
      targetPosition.current.y += 4
      
      // Idle sway
      const idleSwayX = Math.sin(time * 0.8) * controls.idleSwayX
      const idleSwayY = Math.cos(time * 0.6) * controls.idleSwayY
      const idleSwayZ = Math.sin(time * 1.0) * controls.idleSwayZ
      
      // Mouse influence
      const mouseInfluence = (scrollProgress < 0.2 ? 1.0 : 0.5) * controls.mouseInfluence
      const mouseRotationY = -mouseRef.current.y * controls.mouseRotationMultiplierY * mouseInfluence  // FLIPPED: Up/down mouse → Y rotation
      const mouseRotationX = mouseRef.current.x * controls.mouseRotationMultiplierX * mouseInfluence   // FLIPPED: Left/right mouse → X rotation
      const mouseRotationZ = mouseRef.current.x * controls.mouseRotationMultiplierZ * mouseInfluence
      
      // Combine
      const finalRotationX = idleSwayX + mouseRotationX
      const finalRotationY = idleSwayY + mouseRotationY
      const finalRotationZ = idleSwayZ + mouseRotationZ
      
      // Apply with lerp
      rootBone.rotation.x = THREE.MathUtils.lerp(rootBone.rotation.x, finalRotationX, controls.lerpFactor)
      rootBone.rotation.y = THREE.MathUtils.lerp(rootBone.rotation.y, finalRotationY, controls.lerpFactor)
      rootBone.rotation.z = THREE.MathUtils.lerp(rootBone.rotation.z, finalRotationZ, controls.lerpFactor)
    }
  })

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

function ControlPanel({ controls, setControls }: { controls: ControlValues, setControls: React.Dispatch<React.SetStateAction<ControlValues>> }) {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  // Ensure we're on client side before using portal
  useEffect(() => {
    setMounted(true)
    console.log('🎮 Control Panel mounted')
  }, [])
  
  // Debug log
  useEffect(() => {
    console.log('🎮 Control Panel state, isOpen:', isOpen)
  }, [isOpen])
  
  const handleChange = (key: keyof ControlValues, value: number | string | boolean) => {
    setControls(prev => ({ ...prev, [key]: value }))
  }
  
  const copyValues = () => {
    const text = JSON.stringify(controls, null, 2)
    navigator.clipboard.writeText(text)
    alert('Control values copied to clipboard!')
  }
  
  const resetValues = () => {
    setControls(defaultValues)
  }
  
  // Don't render until mounted (client-side)
  if (!mounted) return null
  
  // Use portal to render outside of any z-index context
  return createPortal(
    <>
      {/* Toggle Button */}
      <button
        onClick={() => {
          console.log('🔘 Toggle button clicked, switching to:', !isOpen)
          setIsOpen(!isOpen)
        }}
        className="fixed bottom-4 right-4 z-[9999] w-12 h-12 bg-purple-600 hover:bg-purple-700 rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-300 border-2 border-white"
        style={{ zIndex: 9999 }}
      >
        <svg 
          className={`w-6 h-6 transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </button>
      
      {/* Control Panel */}
      <div 
        className={`fixed bottom-20 right-4 z-[9998] w-96 max-h-[70vh] bg-black/90 backdrop-blur-lg rounded-2xl shadow-2xl transition-all duration-300 transform ${
          isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'
        }`}
        style={{ zIndex: 9998 }}
      >
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          <h2 className="text-xl font-bold text-white mb-4">Ghost Controls</h2>
          
          {/* Recording Mode Toggle */}
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/40 rounded-xl">
            <h3 className="text-sm font-semibold text-red-400 mb-3">🎥 Recording Mode</h3>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={controls.hideUI}
                onChange={(e) => handleChange('hideUI', e.target.checked)}
                className="w-5 h-5 text-red-500 bg-transparent border-2 border-red-500 rounded focus:ring-red-500 focus:ring-2"
              />
              <span className="text-white font-medium">
                Hide All UI for Recording
              </span>
            </label>
            <p className="text-red-300/70 text-xs mt-2">
              Toggles header and all text content for clean video capture
            </p>
          </div>
          
          {/* Position Controls */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-purple-400 mb-3">Position</h3>
            <div className="space-y-2">
              <div>
                <label className="text-xs text-gray-400">X: {controls.positionX.toFixed(2)}</label>
                <input
                  type="range"
                  min="-10"
                  max="10"
                  step="0.1"
                  value={controls.positionX}
                  onChange={(e) => handleChange('positionX', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400">Y: {controls.positionY.toFixed(2)}</label>
                <input
                  type="range"
                  min="-100"
                  max="25"
                  step="0.1"
                  value={controls.positionY}
                  onChange={(e) => handleChange('positionY', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400">Z: {controls.positionZ.toFixed(2)}</label>
                <input
                  type="range"
                  min="-10"
                  max="10"
                  step="0.1"
                  value={controls.positionZ}
                  onChange={(e) => handleChange('positionZ', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>
          
          {/* Rotation Controls */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-purple-400 mb-3">Rotation</h3>
            <div className="space-y-2">
              <div>
                <label className="text-xs text-gray-400">X: {(controls.rotationX * 180 / Math.PI).toFixed(1)}°</label>
                <input
                  type="range"
                  min={-Math.PI}
                  max={Math.PI}
                  step="0.01"
                  value={controls.rotationX}
                  onChange={(e) => handleChange('rotationX', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400">Y: {(controls.rotationY * 180 / Math.PI).toFixed(1)}°</label>
                <input
                  type="range"
                  min={-Math.PI}
                  max={Math.PI}
                  step="0.01"
                  value={controls.rotationY}
                  onChange={(e) => handleChange('rotationY', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400">Z: {(controls.rotationZ * 180 / Math.PI).toFixed(1)}°</label>
                <input
                  type="range"
                  min={-Math.PI}
                  max={Math.PI}
                  step="0.01"
                  value={controls.rotationZ}
                  onChange={(e) => handleChange('rotationZ', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>
          
          {/* Scale Control */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-purple-400 mb-3">Scale</h3>
            <div className="space-y-2">
              <div>
                <label className="text-xs text-gray-400">Scale: {controls.scale.toFixed(2)}</label>
                <input
                  type="range"
                  min="0.5"
                  max="10"
                  step="0.1"
                  value={controls.scale}
                  onChange={(e) => handleChange('scale', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>
          
          {/* Idle Animation */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-purple-400 mb-3">Idle Animation</h3>
            <div className="space-y-2">
              <div>
                <label className="text-xs text-gray-400">Speed: {controls.idleSpeed.toFixed(2)}</label>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.1"
                  value={controls.idleSpeed}
                  onChange={(e) => handleChange('idleSpeed', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400">Amplitude: {controls.idleAmplitude.toFixed(2)}</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={controls.idleAmplitude}
                  onChange={(e) => handleChange('idleAmplitude', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400">Sway X: {controls.idleSwayX.toFixed(2)}</label>
                <input
                  type="range"
                  min="0"
                  max="0.5"
                  step="0.01"
                  value={controls.idleSwayX}
                  onChange={(e) => handleChange('idleSwayX', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400">Sway Y: {controls.idleSwayY.toFixed(2)}</label>
                <input
                  type="range"
                  min="0"
                  max="0.5"
                  step="0.01"
                  value={controls.idleSwayY}
                  onChange={(e) => handleChange('idleSwayY', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400">Sway Z: {controls.idleSwayZ.toFixed(2)}</label>
                <input
                  type="range"
                  min="0"
                  max="0.5"
                  step="0.01"
                  value={controls.idleSwayZ}
                  onChange={(e) => handleChange('idleSwayZ', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>
          
          {/* Mouse Tracking */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-purple-400 mb-3">Mouse Tracking</h3>
            <div className="space-y-2">
              <div>
                <label className="text-xs text-gray-400">Influence: {controls.mouseInfluence.toFixed(2)}</label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={controls.mouseInfluence}
                  onChange={(e) => handleChange('mouseInfluence', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400">X Multiplier: {controls.mouseRotationMultiplierX.toFixed(2)}</label>
                <input
                  type="range"
                  min="0"
                  max="3"
                  step="0.1"
                  value={controls.mouseRotationMultiplierX}
                  onChange={(e) => handleChange('mouseRotationMultiplierX', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400">Y Multiplier: {controls.mouseRotationMultiplierY.toFixed(2)}</label>
                <input
                  type="range"
                  min="0"
                  max="3"
                  step="0.1"
                  value={controls.mouseRotationMultiplierY}
                  onChange={(e) => handleChange('mouseRotationMultiplierY', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400">Z Multiplier: {controls.mouseRotationMultiplierZ.toFixed(2)}</label>
                <input
                  type="range"
                  min="0"
                  max="3"
                  step="0.1"
                  value={controls.mouseRotationMultiplierZ}
                  onChange={(e) => handleChange('mouseRotationMultiplierZ', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400">Lerp Factor: {controls.lerpFactor.toFixed(2)}</label>
                <input
                  type="range"
                  min="0.01"
                  max="0.5"
                  step="0.01"
                  value={controls.lerpFactor}
                  onChange={(e) => handleChange('lerpFactor', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>
          
          {/* Wiggle Bones */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-purple-400 mb-3">Wiggle Bones</h3>
            <div className="space-y-2">
              <div>
                <label className="text-xs text-gray-400">Velocity: {controls.wiggleVelocity.toFixed(2)}</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={controls.wiggleVelocity}
                  onChange={(e) => handleChange('wiggleVelocity', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>
          
          {/* Material */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-purple-400 mb-3">Material</h3>
            <div className="space-y-2">
              <div>
                <label className="text-xs text-gray-400">Metalness: {controls.metalness.toFixed(2)}</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={controls.metalness}
                  onChange={(e) => handleChange('metalness', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400">Roughness: {controls.roughness.toFixed(2)}</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={controls.roughness}
                  onChange={(e) => handleChange('roughness', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400">Emissive Intensity: {controls.emissiveIntensity.toFixed(2)}</label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.01"
                  value={controls.emissiveIntensity}
                  onChange={(e) => handleChange('emissiveIntensity', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400">Emissive Color</label>
                <input
                  type="color"
                  value={controls.emissiveColor}
                  onChange={(e) => handleChange('emissiveColor', e.target.value)}
                  className="w-full h-8"
                />
              </div>
            </div>
          </div>
          
          {/* Lighting */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-purple-400 mb-3">Lighting</h3>
            <div className="space-y-2">
              <div>
                <label className="text-xs text-gray-400">Ambient: {controls.ambientIntensity.toFixed(2)}</label>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.1"
                  value={controls.ambientIntensity}
                  onChange={(e) => handleChange('ambientIntensity', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400">Directional: {controls.directionalIntensity.toFixed(2)}</label>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.1"
                  value={controls.directionalIntensity}
                  onChange={(e) => handleChange('directionalIntensity', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400">Point Light 1: {controls.pointLight1Intensity.toFixed(2)}</label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.1"
                  value={controls.pointLight1Intensity}
                  onChange={(e) => handleChange('pointLight1Intensity', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400">Point Light 2: {controls.pointLight2Intensity.toFixed(2)}</label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.1"
                  value={controls.pointLight2Intensity}
                  onChange={(e) => handleChange('pointLight2Intensity', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400">Point Light 3: {controls.pointLight3Intensity.toFixed(2)}</label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.1"
                  value={controls.pointLight3Intensity}
                  onChange={(e) => handleChange('pointLight3Intensity', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={copyValues}
              className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              Copy Values
            </button>
            <button
              onClick={resetValues}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}

export default function GhostWithControls({ scrollProgress, onHideUIChange }: GhostWithControlsProps) {
  const [controls, setControls] = useState<ControlValues>(defaultValues)
  
  // Debug initial controls
  useEffect(() => {
    console.log('🎮 Main component initialized with controls:', controls)
    console.log('🎮 Default values:', defaultValues)
    console.log('🎮 Specifically, positionY from controls:', controls.positionY)
    console.log('🎮 Specifically, positionY from defaultValues:', defaultValues.positionY)
  }, [])
  
  // Notify parent when hideUI changes
  useEffect(() => {
    onHideUIChange?.(controls.hideUI)
  }, [controls.hideUI, onHideUIChange])
  
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
        {/* Environment for chrome reflections */}
        <Environment preset="city" />
        
        {/* Minimal lighting - let the chrome material do the work */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1.0} castShadow />
        
        {/* Multiple colored lights for chrome reflections */}
        <pointLight position={[-10, 5, -5]} color="#8B5CF6" intensity={2.0} />
        <pointLight position={[10, 5, -5]} color="#EC4899" intensity={2.0} />
        <pointLight position={[0, 10, 5]} color="#3B82F6" intensity={1.5} />
        <pointLight position={[-8, -5, 8]} color="#06B6D4" intensity={1.8} />
        <pointLight position={[8, -5, 8]} color="#F59E0B" intensity={1.8} />
        <pointLight position={[0, -8, -8]} color="#EF4444" intensity={2.2} />
        <pointLight position={[-5, 8, -2]} color="#10B981" intensity={1.6} />
        <pointLight position={[5, 8, -2]} color="#A855F7" intensity={1.6} />
        
        <color attach="background" args={['#0a0a0f']} />
        <fog attach="fog" args={['#0a0a0f', 5, 20]} />
        
        <Ghost scrollProgress={scrollProgress} controls={controls} />
        <Stars count={800} depth={100} radius={150} factor={6} saturation={0.8} fade speed={0.5} />
      </Canvas>
      
      <ControlPanel controls={controls} setControls={setControls} />
    </div>
  )
}