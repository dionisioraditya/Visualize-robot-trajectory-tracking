export const SIM_CONSTANTS = {
  FPS: 60,
  TRAIL_LENGTH: 200,
  ROBOT_RADIUS: 15,
  WHEEL_WIDTH: 4,
  WHEEL_HEIGHT: 12,
  CANVAS_WIDTH: 600,
  CANVAS_HEIGHT: 400,
  SCALE: 100, // pixels per meter
};

export enum TrajectoryType {
  CIRCLE = 'CIRCLE',
  FIGURE_EIGHT = 'FIGURE_EIGHT',
}

export const COLORS = {
  primary: '#2563eb', // blue-600
  secondary: '#dc2626', // red-600
  robot: '#1e293b', // slate-800
  grid: '#e2e8f0', // slate-200
  trailRef: '#93c5fd', // blue-300
  trailReal: '#fca5a5', // red-300
};