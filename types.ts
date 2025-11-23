export interface Point {
  x: number;
  y: number;
}

export interface RobotState {
  x: number;
  y: number;
  theta: number; // Orientation in radians
  linearVel: number;
  angularVel: number;
  parameters: number[]; // The adaptive parameters (theta_hat)
}

export interface SimulationState {
  t: number;
  robot: RobotState;
  reference: Point;
  history: {
    time: number;
    error: number;
    theta1: number;
    theta2: number;
  }[];
}

export interface ControlConfig {
  isAdaptive: boolean;
  hasLoad: boolean;
  trajectory: 'CIRCLE' | 'FIGURE_EIGHT';
  isPlaying: boolean;
}