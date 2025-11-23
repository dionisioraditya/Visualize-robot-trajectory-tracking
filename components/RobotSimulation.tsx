import React, { useEffect, useRef, useState } from 'react';
import { SIM_CONSTANTS, TrajectoryType, COLORS } from '../constants';
import { ControlConfig, SimulationState } from '../types';

interface RobotSimulationProps {
  config: ControlConfig;
  onUpdate: (data: SimulationState['history'][0]) => void;
}

export const RobotSimulation: React.FC<RobotSimulationProps> = ({ config, onUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  
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
    const scale = 1.5; // meters
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

    // 1. Get Desired State
    const ref = getReferencePoint(t);
    const refX = ref.x;
    const refY = ref.y;

    // 2. Kinematic Controller (Simple Proportional for demo)
    // Error in robot frame
    const dx = refX - robotRef.current.x;
    const dy = refY - robotRef.current.y;
    
    // Distance Error
    const distError = Math.sqrt(dx * dx + dy * dy);

    // Desired velocities to reach point
    const kv = 2.0;
    const kw = 4.0;
    const targetTheta = Math.atan2(dy, dx);
    let angleDiff = targetTheta - robotRef.current.theta;
    
    // Normalize angle
    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

    // Command velocities (Kinematic Control Law)
    let cmdV = kv * Math.sqrt(dx*dx + dy*dy);
    let cmdW = kw * angleDiff;

    // Limit speed
    if (cmdV > 1.0) cmdV = 1.0; 

    // 3. Dynamic & Adaptive Layer (The Core Paper Concept)
    // In the paper, the dynamics allow the robot to slip or lag if parameters are wrong.
    // We simulate this by having "Real" parameters vs "Estimated" parameters.

    // "Real" physics parameters (Unknown to controller initially)
    const baseMass = 1.0;
    const loadMass = config.hasLoad ? 2.5 : 0.0; // Adding load increases inertia/mass
    const realMass = baseMass + loadMass;
    
    // "Estimated" parameters (Updated by Adaptive Law)
    let { thetaM, thetaI } = adaptiveParamsRef.current;

    // Adaptation Law (Simplified Eq 13: theta_dot = Gamma * Error)
    // If adaptive is ON, we adjust estimated theta to match real mass impact
    if (config.isAdaptive) {
        // If there is error, increase "effort" (represented by theta parameters here)
        // This is a phenomenological approximation of the paper's math for visual stability
        const adaptationRate = 0.05;
        if (distError > 0.05) {
             // If we have load, we need higher gains. 
             // Adaptation drives thetaM up if error persists.
             adaptiveParamsRef.current.thetaM += adaptationRate * dt * (realMass - thetaM + 0.1); 
        }
    } else {
        // If not adaptive, parameters stay fixed at nominal values
        adaptiveParamsRef.current.thetaM = 1.0; 
    }

    // Apply Dynamics: 
    // Actual Acceleration = (Command Force) / Real Mass
    // Command Force depends on our Estimated Params (Controller thinks mass is thetaM)
    // So Force ~ cmdV * thetaM
    // Actual V_dot ~ (cmdV * thetaM) / realMass
    
    // We'll simulate velocity lag directly:
    const efficiency = adaptiveParamsRef.current.thetaM / realMass;
    
    const actualV = cmdV * efficiency;
    const actualW = cmdW * efficiency; // simplified assumption that load affects rotation too

    // Update Position (Euler integration)
    robotRef.current.x += actualV * Math.cos(robotRef.current.theta) * dt;
    robotRef.current.y += actualV * Math.sin(robotRef.current.theta) * dt;
    robotRef.current.theta += actualW * dt;

    // Update Trails
    if (timeRef.current % 0.1 < dt) { // Downsample trails
        trailRef.current.push({ x: robotRef.current.x, y: robotRef.current.y });
        refTrailRef.current.push({ x: refX, y: refY });
        
        if (trailRef.current.length > SIM_CONSTANTS.TRAIL_LENGTH) trailRef.current.shift();
        if (refTrailRef.current.length > SIM_CONSTANTS.TRAIL_LENGTH) refTrailRef.current.shift();

        // Callback for charts
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
        const py = cy - p.y * s; // Invert Y for canvas
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

    // Draw Robot (Unicycle)
    const rx = cx + robotRef.current.x * s;
    const ry = cy - robotRef.current.y * s;
    const rt = -robotRef.current.theta; // Invert angle for canvas

    ctx.save();
    ctx.translate(rx, ry);
    ctx.rotate(rt);

    // Body
    ctx.fillStyle = COLORS.robot;
    ctx.beginPath();
    ctx.arc(0, 0, SIM_CONSTANTS.ROBOT_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    // Direction Indicator
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(SIM_CONSTANTS.ROBOT_RADIUS, 0);
    ctx.stroke();

    // Wheels
    ctx.fillStyle = '#334155';
    // Left Wheel
    ctx.fillRect(-5, -SIM_CONSTANTS.ROBOT_RADIUS - 4, 10, 4);
    // Right Wheel
    ctx.fillRect(-5, SIM_CONSTANTS.ROBOT_RADIUS, 10, 4);

    ctx.restore();

    // Current Reference Point Target
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
    </div>
  );
};