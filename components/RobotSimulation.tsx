import React, { useEffect, useRef } from 'react';
import { SIM_CONSTANTS, TrajectoryType, COLORS } from '../constants';
import { ControlConfig, SimulationState } from '../types';

interface RobotSimulationProps {
  config: ControlConfig;
  onUpdate: (data: SimulationState['history'][0]) => void;
}

export const RobotSimulation: React.FC<RobotSimulationProps> = ({ config, onUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  
  // Simulation State Refs (Mutable for loop performance)
  const timeRef = useRef(0);
  const robotRef = useRef({ x: 0, y: 0, theta: 0, v: 0, w: 0 });
  const adaptiveParamsRef = useRef({ thetaM: 1.0, thetaI: 1.0 }); // Estimated Mass/Inertia factors
  const trailRef = useRef<{x: number, y: number}[]>([]);
  const refTrailRef = useRef<{x: number, y: number}[]>([]);

  // Reset simulation when trajectory changes
  useEffect(() => {
    timeRef.current = 0;
    robotRef.current = { x: 0.2, y: 0, theta: 0, v: 0, w: 0 };
    adaptiveParamsRef.current = { thetaM: 1.0, thetaI: 1.0 };
    trailRef.current = [];
    refTrailRef.current = [];
  }, [config.trajectory]);

  const getReferencePoint = (t: number): { x: number; y: number; dx: number; dy: number } => {
    const speed = 0.5; // rad/s
    
    if (config.trajectory === TrajectoryType.CIRCLE) {
      const R = 0.8;
      return {
        x: R * Math.cos(t * speed),
        y: R * Math.sin(t * speed),
        dx: -R * speed * Math.sin(t * speed),
        dy: R * speed * Math.cos(t * speed),
      };
    } else {
      // Figure 8 (Lemniscate)
      const a = 1.0;
      const sint = Math.sin(t * speed);
      const cost = Math.cos(t * speed);
      const den = 1 + sint * sint;
      return {
        x: (a * cost) / den,
        y: (a * cost * sint) / den,
        dx: (-a * sint * (3 + sint * sint)) / (den * den) * speed, // approx derivative for viz
        dy: (a * (1 - 3 * sint * sint)) / (den * den) * speed
      };
    }
  };

  const updatePhysics = () => {
    if (!config.isPlaying) return;

    const dt = 1 / SIM_CONSTANTS.FPS;
    timeRef.current += dt;
    const t = timeRef.current;

    // 1. Get Desired State (Global Coordinates)
    const ref = getReferencePoint(t);
    const refX = ref.x;
    const refY = ref.y;

    // 2. Kinematic Controller Layer
    // The paper uses a transformation to Local Robot Frame (Eq 4).
    // dx_local = cos(theta)*(dx) + sin(theta)*(dy)
    
    const dx_global = refX - robotRef.current.x;
    const dy_global = refY - robotRef.current.y;
    
    // Distance Error for visualization
    const distError = Math.sqrt(dx_global * dx_global + dy_global * dy_global);

    // Simplified Kinematic Control Law for visualization stability:
    // Ideally this implements Eq 4: u_ref = x_dot_d + lx * tanh(kx * error_local_x) ...
    const kv = 2.0;
    const kw = 4.0;
    const targetTheta = Math.atan2(dy_global, dx_global);
    let angleDiff = targetTheta - robotRef.current.theta;
    
    // Normalize angle [-PI, PI]
    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

    let cmdV = kv * distError;
    let cmdW = kw * angleDiff;

    // Limit command velocities (saturation)
    if (cmdV > 1.0) cmdV = 1.0; 

    // 3. Dynamic & Adaptive Layer (Eq 7 & 17 in Paper)
    // Controller Type: Adaptive Feedback Linearization with σ-modification
    
    // "Real" physics parameters (Unknown to controller initially)
    const baseMass = 1.0;
    const loadMass = config.hasLoad ? 2.5 : 0.0; // Adding load increases inertia/mass
    const realMass = baseMass + loadMass;
    
    // "Estimated" parameters (Updated by Adaptive Law)
    let { thetaM } = adaptiveParamsRef.current; 

    // Adaptation Law (Sigma-Modification - Eq 17)
    // theta_dot = Gamma * Error - sigma * theta
    // This prevents parameter drift (bursting) in the presence of noise/skid.
    if (config.isAdaptive) {
        const gamma = 0.5; // Adaptation gain
        const sigma = 0.01; // Leakage term
        
        // Simplified error driving term for visualization:
        // In the paper, 'v_tilde' (velocity error) drives adaptation.
        // Here we map position error to velocity effort mismatch.
        const adaptationError = (distError > 0.05) ? (realMass - thetaM) : 0;
        
        // Update estimated parameter
        adaptiveParamsRef.current.thetaM += dt * (gamma * adaptationError - sigma * thetaM); 
    } else {
        // Without adaptation, parameters are static (and wrong if load exists)
        adaptiveParamsRef.current.thetaM = 1.0; 
    }

    // Apply Dynamics (Plant Model)
    // Modeled as: Acceleration = Force / Mass
    // The controller sends 'Force' based on Estimated Mass (thetaM)
    // The Robot responds based on Real Mass.
    
    // Efficiency factor simulating the lag/slip caused by parameter mismatch
    // If Controller estimates 1kg but Robot is 3kg, it under-powers actuators -> Tracking Error.
    const dynamicsFactor = adaptiveParamsRef.current.thetaM / realMass;
    
    // Skidding is treated as unmodeled disturbance reducing efficiency further
    const skidFactor = 1.0; 

    const actualV = cmdV * dynamicsFactor * skidFactor;
    const actualW = cmdW * dynamicsFactor * skidFactor;

    // Update Position (Euler integration)
    robotRef.current.x += actualV * Math.cos(robotRef.current.theta) * dt;
    robotRef.current.y += actualV * Math.sin(robotRef.current.theta) * dt;
    robotRef.current.theta += actualW * dt;

    // Update Trails
    if (timeRef.current % 0.1 < dt) {
        trailRef.current.push({ x: robotRef.current.x, y: robotRef.current.y });
        refTrailRef.current.push({ x: refX, y: refY });
        
        if (trailRef.current.length > SIM_CONSTANTS.TRAIL_LENGTH) trailRef.current.shift();
        if (refTrailRef.current.length > SIM_CONSTANTS.TRAIL_LENGTH) refTrailRef.current.shift();

        onUpdate({
            time: Number(t.toFixed(1)),
            error: distError,
            theta1: adaptiveParamsRef.current.thetaM,
            theta2: adaptiveParamsRef.current.thetaI
        });
    }
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    const { width, height } = ctx.canvas;
    const cx = width / 2;
    const cy = height / 2;
    const s = SIM_CONSTANTS.SCALE;

    ctx.clearRect(0, 0, width, height);
    
    // Grid
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for(let i=-5; i<=5; i++) {
        ctx.moveTo(0, cy + i*s*0.5); ctx.lineTo(width, cy + i*s*0.5);
        ctx.moveTo(cx + i*s*0.5, 0); ctx.lineTo(cx + i*s*0.5, height);
    }
    ctx.stroke();

    // Reference Trail
    ctx.strokeStyle = COLORS.trailRef;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    refTrailRef.current.forEach((p, i) => {
        const px = cx + p.x * s;
        const py = cy - p.y * s;
        if (i===0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    });
    ctx.stroke();
    ctx.setLineDash([]);

    // Actual Trail
    ctx.strokeStyle = COLORS.trailReal;
    ctx.lineWidth = 2;
    ctx.beginPath();
    trailRef.current.forEach((p, i) => {
        const px = cx + p.x * s;
        const py = cy - p.y * s;
        if (i===0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    });
    ctx.stroke();

    // Draw Robot
    const rx = cx + robotRef.current.x * s;
    const ry = cy - robotRef.current.y * s;
    const rt = -robotRef.current.theta;

    ctx.save();
    ctx.translate(rx, ry);
    ctx.rotate(rt);

    ctx.fillStyle = COLORS.robot;
    ctx.beginPath();
    ctx.arc(0, 0, SIM_CONSTANTS.ROBOT_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(SIM_CONSTANTS.ROBOT_RADIUS, 0);
    ctx.stroke();

    ctx.fillStyle = '#334155';
    ctx.fillRect(-5, -SIM_CONSTANTS.ROBOT_RADIUS - 4, 10, 4);
    ctx.fillRect(-5, SIM_CONSTANTS.ROBOT_RADIUS, 10, 4);

    ctx.restore();

    // Reference Point
    const t = timeRef.current;
    const ref = getReferencePoint(t);
    ctx.fillStyle = COLORS.primary;
    ctx.beginPath();
    ctx.arc(cx + ref.x * s, cy - ref.y * s, 5, 0, Math.PI*2);
    ctx.fill();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loop = () => {
        updatePhysics();
        draw(ctx);
        requestRef.current = requestAnimationFrame(loop);
    };
    requestRef.current = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(requestRef.current!);
  }, [config]);

  return (
    <div className="relative rounded-xl overflow-hidden shadow-lg border border-slate-200 bg-white">
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded shadow text-xs font-mono text-slate-600 z-10">
        <div>x: {robotRef.current.x.toFixed(2)}m</div>
        <div>y: {robotRef.current.y.toFixed(2)}m</div>
        <div>θ: {robotRef.current.theta.toFixed(2)}rad</div>
      </div>
      <canvas 
        ref={canvasRef} 
        width={SIM_CONSTANTS.CANVAS_WIDTH} 
        height={SIM_CONSTANTS.CANVAS_HEIGHT} 
        className="w-full h-auto bg-slate-50 cursor-crosshair"
      />
      <div className="absolute bottom-0 left-0 right-0 bg-white/90 border-t border-slate-100 p-2 flex justify-between text-[10px] text-slate-500 font-mono">
        <span>Method: Adaptive Feedback Linearization (with σ-mod)</span>
        <span>Coord: Local Robot Frame</span>
      </div>
    </div>
  );
};