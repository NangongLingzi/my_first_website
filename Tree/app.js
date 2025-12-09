// Christmas Tree Particle Effect
class ChristmasTreeParticle {
    constructor() {
        this.container = document.getElementById('container');
        this.isGathered = true;
        this.lastClickTime = 0;
        this.clickCooldown = 300;
        
        // Rotation and zoom variables
        this.isRotating = false;
        this.previousMousePosition = { x: 0, y: 0 };
        this.rotationSpeed = 0.005;
        this.cameraZ = 25;
        this.zoomSpeed = 0.5;
        
        // Snow particle variables
        this.snowParticleCount = 1000;
        this.snowSpeed = 0.02;
        this.snowSize = 1.5;
        
        // Device performance detection
        this.devicePerformance = this.detectDevicePerformance();
        this.particleCount = this.getParticleCountByPerformance();
        
        this.init();
        this.createParticleSystem();
        this.createSnowParticleSystem();
        this.setupEventListeners();
        this.animate();
    }
    
    detectDevicePerformance() {
        // Simple device performance detection with mobile consideration
        
        // Check if it's a mobile device
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // Check screen size for mobile devices
        const isSmallScreen = window.innerWidth < 768;
        
        // If it's a mobile device or small screen, default to medium/low performance
        if (isMobile || isSmallScreen) {
            return window.innerWidth < 480 ? 'low' : 'medium';
        }
        
        // Desktop device detection
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (!gl) return 'low';
        
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (!debugInfo) return 'medium';
        
        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        
        // Check for high-end GPUs
        const highEndGPUs = ['RTX', 'GTX', 'RX ', 'Radeon RX', 'GeForce', 'Quadro', 'Titan'];
        const isHighEnd = highEndGPUs.some(gpu => renderer.includes(gpu));
        
        return isHighEnd ? 'high' : 'medium';
    }
    
    getParticleCountByPerformance() {
        switch(this.devicePerformance) {
            case 'high': return 8000;
            case 'medium': return 6500;
            case 'low': return 5000;
            default: return 6500;
        }
    }
    
    init() {
        // Scene setup
        this.scene = new THREE.Scene();
        
        // Camera setup
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.z = this.cameraZ;
        
        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            transparent: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setClearColor(0x000000, 0);
        this.container.appendChild(this.renderer.domElement);
        
        // Resize handler
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    createParticleSystem() {
        // Geometry setup
        this.geometry = new THREE.BufferGeometry();
        
        // Particle positions
        this.positions = new Float32Array(this.particleCount * 3);
        this.targetPositions = new Float32Array(this.particleCount * 3);
        this.randomPositions = new Float32Array(this.particleCount * 3);
        
        // Particle sizes
        this.sizes = new Float32Array(this.particleCount);
        
        // Particle colors
        this.colors = new Float32Array(this.particleCount * 3);
        
        // Generate Christmas tree shape particles
        this.generateChristmasTreeShape();
        
        // Generate random positions for dispersion
        this.generateRandomPositions();
        
        // Material setup
        this.material = new THREE.PointsMaterial({
            size: 0.1,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        // Set geometry attributes
        this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
        this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
        this.geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));
        
        // Create points
        this.particles = new THREE.Points(this.geometry, this.material);
        this.scene.add(this.particles);
    }
    
    generateChristmasTreeShape() {
        const starParticles = 12;
        let particleIndex = 0;
        
        // Position adjustment: move tree down to be 20% from bottom
        const yOffset = -5; // Adjust this value to position the tree correctly
        
        // Generate tree top star
        this.generateStar(0, 8 + yOffset, 0, starParticles, particleIndex);
        particleIndex += starParticles;
        
        // Generate tree trunk (cylinder shape)
        const trunkHeight = 3;
        const trunkRadius = 0.5;
        const trunkParticles = Math.floor(this.particleCount * 0.15);
        
        for (let i = 0; i < trunkParticles; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * trunkRadius;
            const height = (Math.random() * trunkHeight) - trunkHeight / 2;
            
            const x = Math.cos(angle) * radius;
            const y = height + yOffset;
            const z = Math.sin(angle) * radius;
            
            this.setParticlePosition(particleIndex, x, y, z);
            this.sizes[particleIndex] = 2 + Math.random(); // 2-3px for trunk
            // Brown color for trunk
            this.setParticleColor(particleIndex, 0.55, 0.27, 0.07); // Brown
            
            particleIndex++;
        }
        
        // Generate tree crown (cone shape with multiple layers)
        const crownHeight = 12;
        const crownBaseRadius = 6;
        const remainingParticles = this.particleCount - particleIndex;
        
        for (let i = 0; i < remainingParticles; i++) {
            const height = (Math.random() * crownHeight) - 1;
            const radius = crownBaseRadius * (1 - height / crownHeight);
            const angle = Math.random() * Math.PI * 2;
            
            const x = Math.cos(angle) * radius * Math.random();
            const y = height + yOffset;
            const z = Math.sin(angle) * radius * Math.random();
            
            this.setParticlePosition(particleIndex, x, y, z);
            
            // Size gradient: smaller at the top, larger at the bottom
            const size = 1 + (1 - height / crownHeight) * 1;
            this.sizes[particleIndex] = size; // 1-2px for crown
            
            // Christmas tree color scheme
            // 90% green particles, 10% colored lights (red, yellow)
            const random = Math.random();
            if (random < 0.1) {
                // Colored lights (10% of particles)
                if (random < 0.05) {
                    this.setParticleColor(particleIndex, 1, 0, 0); // Red lights
                } else {
                    this.setParticleColor(particleIndex, 1, 1, 0); // Yellow lights
                }
            } else {
                // Green for main tree color, with slight variations
                const greenVariation = 0.15;
                const greenBase = 0.2;
                const greenIntensity = greenBase + Math.random() * greenVariation;
                this.setParticleColor(particleIndex, 0, greenIntensity, 0); // Green
            }
            
            particleIndex++;
        }
    }
    
    generateStar(x, y, z, count, startIndex) {
        const starRadius = 2.5; // Much larger star size
        
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const radius = starRadius * (i % 2 === 0 ? 1 : 0.5);
            
            const starX = x + Math.cos(angle) * radius;
            const starY = y + Math.sin(angle) * radius;
            const starZ = z;
            
            this.setParticlePosition(startIndex + i, starX, starY, starZ);
            this.sizes[startIndex + i] = 3 + Math.random() * 2; // Larger star particles (3-5px)
            this.setParticleColor(startIndex + i, 1, 1, 0.3); // Brighter yellow for star
        }
    }
    
    generateRandomPositions() {
        for (let i = 0; i < this.particleCount; i++) {
            const radius = 20;
            const angle1 = Math.random() * Math.PI * 2;
            const angle2 = Math.random() * Math.PI;
            
            const x = Math.sin(angle2) * Math.cos(angle1) * radius * Math.random();
            const y = Math.cos(angle2) * radius * Math.random();
            const z = Math.sin(angle2) * Math.sin(angle1) * radius * Math.random();
            
            this.randomPositions[i * 3] = x;
            this.randomPositions[i * 3 + 1] = y;
            this.randomPositions[i * 3 + 2] = z;
        }
    }
    
    setParticlePosition(index, x, y, z) {
        this.positions[index * 3] = x;
        this.positions[index * 3 + 1] = y;
        this.positions[index * 3 + 2] = z;
        
        this.targetPositions[index * 3] = x;
        this.targetPositions[index * 3 + 1] = y;
        this.targetPositions[index * 3 + 2] = z;
    }
    
    setParticleColor(index, r, g, b) {
        this.colors[index * 3] = r;
        this.colors[index * 3 + 1] = g;
        this.colors[index * 3 + 2] = b;
    }
    
    toggleParticleState() {
        const now = Date.now();
        if (now - this.lastClickTime < this.clickCooldown) return;
        this.lastClickTime = now;
        
        this.isGathered = !this.isGathered;
        this.animateParticles();
        this.createClickFeedback();
    }
    
    animateParticles() {
        const duration = 600; // 500-800ms as per requirement
        
        for (let i = 0; i < this.particleCount; i++) {
            const startX = this.positions[i * 3];
            const startY = this.positions[i * 3 + 1];
            const startZ = this.positions[i * 3 + 2];
            
            const endX = this.isGathered ? this.targetPositions[i * 3] : this.randomPositions[i * 3];
            const endY = this.isGathered ? this.targetPositions[i * 3 + 1] : this.randomPositions[i * 3 + 1];
            const endZ = this.isGathered ? this.targetPositions[i * 3 + 2] : this.randomPositions[i * 3 + 2];
            
            // Animate each particle with Tween.js
            const particle = {
                x: startX,
                y: startY,
                z: startZ
            };
            
            new TWEEN.Tween(particle)
                .to({ x: endX, y: endY, z: endZ }, duration)
                .easing(TWEEN.Easing.Quadratic.InOut)
                .onUpdate(() => {
                    this.positions[i * 3] = particle.x;
                    this.positions[i * 3 + 1] = particle.y;
                    this.positions[i * 3 + 2] = particle.z;
                })
                .start();
        }
    }
    
    setupEventListeners() {
        // Click/touch event listeners
        this.container.addEventListener('click', () => this.toggleParticleState());
        this.container.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.toggleParticleState();
        });
        
        // Mouse rotation event listeners
        this.container.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.container.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.container.addEventListener('mouseup', () => this.onMouseUp());
        this.container.addEventListener('mouseleave', () => this.onMouseUp());
        
        // Mouse wheel zoom event listener
        this.container.addEventListener('wheel', (e) => this.onWheel(e));
    }
    
    onMouseDown(e) {
        this.isRotating = true;
        this.previousMousePosition = { x: e.clientX, y: e.clientY };
    }
    
    onMouseMove(e) {
        if (!this.isRotating) return;
        
        const deltaX = e.clientX - this.previousMousePosition.x;
        const deltaY = e.clientY - this.previousMousePosition.y;
        
        // Rotate the tree based on mouse movement
        this.particles.rotation.y += deltaX * this.rotationSpeed;
        this.particles.rotation.x += deltaY * this.rotationSpeed;
        
        this.previousMousePosition = { x: e.clientX, y: e.clientY };
    }
    
    onMouseUp() {
        this.isRotating = false;
    }
    
    onWheel(e) {
        e.preventDefault();
        
        // Zoom in/out based on wheel delta
        if (e.deltaY < 0) {
            // Zoom in
            this.cameraZ = Math.max(10, this.cameraZ - this.zoomSpeed);
        } else {
            // Zoom out
            this.cameraZ = Math.min(50, this.cameraZ + this.zoomSpeed);
        }
        
        // Update camera position with smooth animation
        new TWEEN.Tween(this.camera.position)
            .to({ z: this.cameraZ }, 200)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .start();
    }
    
    createClickFeedback() {
        // Create ripple effect at click position
        const feedback = document.createElement('div');
        feedback.className = 'click-feedback';
        feedback.style.width = '100px';
        feedback.style.height = '100px';
        feedback.style.left = '50%';
        feedback.style.top = '50%';
        feedback.style.transform = 'translate(-50%, -50%) scale(0)';
        
        this.container.appendChild(feedback);
        
        // Remove after animation
        setTimeout(() => {
            feedback.remove();
        }, 600);
    }
    
    createSnowParticleSystem() {
        // Create snow particle geometry
        this.snowGeometry = new THREE.BufferGeometry();
        this.snowPositions = new Float32Array(this.snowParticleCount * 3);
        this.snowSizes = new Float32Array(this.snowParticleCount);
        this.snowColors = new Float32Array(this.snowParticleCount * 3);
        
        // Generate initial snow positions (mostly at the top)
        for (let i = 0; i < this.snowParticleCount; i++) {
            // Random X position across the scene
            this.snowPositions[i * 3] = (Math.random() - 0.5) * 40;
            // Start from top of the scene
            this.snowPositions[i * 3 + 1] = Math.random() * 20 + 10;
            // Random Z position
            this.snowPositions[i * 3 + 2] = (Math.random() - 0.5) * 40;
            
            // Snow particle size (slightly larger than tree particles)
            this.snowSizes[i] = this.snowSize + Math.random() * 1;
            
            // White color for snow with slight transparency
            this.snowColors[i * 3] = 1;
            this.snowColors[i * 3 + 1] = 1;
            this.snowColors[i * 3 + 2] = 1;
        }
        
        // Set snow geometry attributes
        this.snowGeometry.setAttribute('position', new THREE.BufferAttribute(this.snowPositions, 3));
        this.snowGeometry.setAttribute('color', new THREE.BufferAttribute(this.snowColors, 3));
        this.snowGeometry.setAttribute('size', new THREE.BufferAttribute(this.snowSizes, 1));
        
        // Create snow material
        this.snowMaterial = new THREE.PointsMaterial({
            size: 0.1,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        // Create snow particles
        this.snowParticles = new THREE.Points(this.snowGeometry, this.snowMaterial);
        this.scene.add(this.snowParticles);
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Update tweens
        TWEEN.update();
        
        // Update particle geometry
        this.geometry.attributes.position.needsUpdate = true;
        
        // Star pulsing effect - updated for larger star
        const time = Date.now() * 0.002;
        for (let i = 0; i < 12; i++) {
            const pulse = 0.8 + Math.sin(time + i) * 0.2;
            this.sizes[i] = (3 + Math.random() * 2) * pulse;
        }
        this.geometry.attributes.size.needsUpdate = true;
        
        // Rotate particles slightly
        this.particles.rotation.y += 0.001;
        
        // Animate snow particles - falling effect
        for (let i = 0; i < this.snowParticleCount; i++) {
            // Move snow particle downwards
            this.snowPositions[i * 3 + 1] -= this.snowSpeed;
            
            // Add slight horizontal movement for wind effect
            this.snowPositions[i * 3] += Math.sin(time + i * 0.1) * 0.01;
            
            // Reset snow particle to top when it falls below the scene
            if (this.snowPositions[i * 3 + 1] < -15) {
                this.snowPositions[i * 3] = (Math.random() - 0.5) * 40;
                this.snowPositions[i * 3 + 1] = Math.random() * 10 + 15;
                this.snowPositions[i * 3 + 2] = (Math.random() - 0.5) * 40;
            }
        }
        
        // Update snow geometry
        this.snowGeometry.attributes.position.needsUpdate = true;
        
        // Render
        this.renderer.render(this.scene, this.camera);
    }
    
    getParticleCountByPerformance() {
        switch(this.devicePerformance) {
            case 'high': return 8000;
            case 'medium': return 6500;
            case 'low': return 5000;
            default: return 6500;
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create Christmas tree but hide it initially
    const christmasTree = new ChristmasTreeParticle();
    document.getElementById('container').style.opacity = '0';
    
    // Optional: Add MERRY CHRISTMAS text
    const text = document.createElement('div');
    text.id = 'merry-christmas';
    text.textContent = 'MERRY CHRISTMAS';
    document.getElementById('container').appendChild(text);
    
    // Envelope click functionality
    const envelope = document.getElementById('card-envelope');
    envelope.addEventListener('click', () => {
        // Play local Jingle Bells music on user interaction
        const audio = document.getElementById('jingle-bells');
        audio.play().catch(error => {
            console.log('Audio play failed:', error);
        });
        
        // Add opened class to trigger animation
        envelope.classList.add('opened');
        
        // Show Christmas tree after envelope animation completes
        setTimeout(() => {
            document.getElementById('container').style.opacity = '1';
            document.getElementById('container').style.transition = 'opacity 0.8s ease-out';
            // Optional: Remove envelope from DOM after animation
            setTimeout(() => {
                envelope.style.display = 'none';
            }, 800);
        }, 400);
    });
});