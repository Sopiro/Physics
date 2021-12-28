# 2D Rigid Body Physics Engine

2D Rigid body physics engine implemented in HTML canvas with Typescript.

Live demo: https://sopiro.github.io/Physics/  

Video1: https://youtu.be/mHnHj9HHSBg  
Video2: https://youtu.be/57seMGrGWhw

## Examples
|![example1](.github/Animation1.gif)|![example2](.github/Animation2.gif)|
|--|--|
|![example3](.github/Animation3.gif)|![example4](.github/Animation4.gif)|

## Features
- Basic input, Rendering system
- Collision detection
  - Convex polygons and circles
  - AABB Broad phase
  - Computing minimum distance between two convex shapes (GJK)
  - Generate contact manifold (EPA)
- Collision resolution 
  - Friction and restitution
  - Iterative solver
  - Sequential impulses  
  - Collision callback  
- Constraint-basd simulation
  - Contact constraint
  - Joints: Revolute, Prismatic, Distance, Max distance, Weld, Motor, Line, Angle, Grab
  - Soft constraints
  - Block solver
- Optimization
  - Constraint islanding
  - Island sleeping


## References
- https://box2d.org/publications/
- https://allenchou.net/game-physics-series/
- https://www.toptal.com/game/video-game-physics-part-iii-constrained-rigid-body-simulation
- https://dyn4j.org/blog/
