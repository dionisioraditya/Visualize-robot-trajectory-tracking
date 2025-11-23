import React from 'react';

export const PaperContent: React.FC = () => {
  return (
    <div className="h-full overflow-y-auto paper-scroll pr-4 pb-20">
      <div className="mb-8 border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-bold text-slate-900 serif mb-2">
          An adaptive dynamic controller for autonomous mobile robot trajectory tracking
        </h1>
        <div className="text-sm text-slate-500 mb-4">
          Felipe N. Martins, Wanderley C. Celeste, Ricardo Carelli, Mário Sarcinelli-Filho, Teodiano F. Bastos-Filho
          <br />
          <span className="italic">Control Engineering Practice 16 (2008)</span>
        </div>
      </div>

      <section className="mb-8">
        <h2 className="text-lg font-bold text-slate-800 mb-3 uppercase tracking-wider text-xs">Abstract</h2>
        <p className="text-slate-700 leading-relaxed mb-4 serif text-sm">
          This paper proposes an adaptive controller to guide an unicycle-like mobile robot during trajectory tracking. Initially, the desired values of the linear and angular velocities are generated, considering only the kinematic model of the robot. Next, such values are processed to compensate for the robot dynamics, thus generating the commands of linear and angular velocities delivered to the robot actuators.
        </p>
        <p className="text-slate-700 leading-relaxed serif text-sm">
          The parameters characterizing the robot dynamics are updated on-line, thus providing smaller errors and better performance in applications in which these parameters can vary, such as load transportation. The stability of the whole system is analyzed using Lyapunov theory, and the control errors are proved to be ultimately bounded.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-bold text-slate-800 mb-3 uppercase tracking-wider text-xs">1. Introduction</h2>
        <p className="text-slate-700 leading-relaxed mb-4 text-sm">
          Among different mobile robot structures, unicycle-like platforms are frequently adopted to accomplish different tasks, due to their good mobility and simple configuration. Nonlinear control for this type of robot has been studied for several years.
        </p>
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 my-4 rounded-r">
          <p className="text-blue-900 text-xs italic">
            <strong>Interactive Note:</strong> Use the "Simulation" panel on the right to visualize the unicycle dynamics discussed here. The mathematical model corresponds to the Pioneer 3-DX robot shown in Fig. 3 of the original paper.
          </p>
        </div>
        <p className="text-slate-700 leading-relaxed mb-4 text-sm">
          An important issue in the nonlinear control of AGVs is that most controllers designed so far are based only on the kinematics of the mobile robot. However, when high-speed movements and/or heavy load transportation are required, it becomes essential to consider the robot dynamics.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-bold text-slate-800 mb-3 uppercase tracking-wider text-xs">2. Dynamic Model</h2>
        <p className="text-slate-700 leading-relaxed mb-4 text-sm">
          The dynamic model of the unicycle-like mobile robot proposed by De La Cruz and Carelli (2006) is reviewed. The complete mathematical model is written as:
        </p>
        <div className="bg-slate-100 p-4 rounded mb-4 overflow-x-auto">
           <code className="text-xs font-mono text-slate-800 block">
             M(q)v̇ + C(q, v)v + g(q) = τ
           </code>
        </div>
        <p className="text-slate-700 leading-relaxed mb-4 text-sm">
          Where <span className="font-mono bg-slate-100 px-1 rounded">v</span> represents the linear and angular velocities. A vector of identified parameters <span className="font-mono bg-slate-100 px-1 rounded">θ</span> represents physical properties like mass, inertia, and wheel friction.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-bold text-slate-800 mb-3 uppercase tracking-wider text-xs">4. The Adaptive Controller</h2>
        <p className="text-slate-700 leading-relaxed mb-4 text-sm">
          The dynamic controller receives reference velocities from the kinematic controller. To reduce performance degradation, on-line parameter adaptation becomes quite important.
        </p>
        <p className="text-slate-700 leading-relaxed mb-4 text-sm">
          The update law uses <strong>σ-modification</strong> to prevent parameter drift:
        </p>
        <div className="bg-slate-100 p-4 rounded mb-4 overflow-x-auto">
           <code className="text-xs font-mono text-slate-800 block">
             θ̇ = Γ⁻¹Gᵀṽ - σΓ⁻¹θ
           </code>
        </div>
        <p className="text-slate-700 leading-relaxed mb-4 text-sm">
          This equation ensures that even if the robot is carrying an unknown load (changing its mass/inertia), the controller estimates the new parameters in real-time to drive the tracking error to zero.
        </p>
      </section>
      
      <section className="mb-20">
         <h2 className="text-lg font-bold text-slate-800 mb-3 uppercase tracking-wider text-xs">6. Conclusion</h2>
         <p className="text-slate-700 leading-relaxed text-sm">
            Experimental results showed the good performance of the proposed controller. A long-term simulation demonstrated that the updated parameters converge even if the system works for a long period. The proposed controller is capable of tracking a desired trajectory with a small distance error when the dynamic parameters are adapted.
         </p>
      </section>
    </div>
  );
};