# 2D Rigidbody Physics Engine

2D Rigid body physics engine written in TypeScript.

Live demo: https://sopiro.github.io/Physics/  
Video: https://youtu.be/ROAqjE40pxU  
  
Optimized C++ library: https://github.com/Sopiro/Muli

## Samples
|![example1](.github/Animation1.gif)|![example2](.github/Animation2.gif)|
|--|--|
|![example3](.github/Animation3.gif)|![example4](.github/Animation4.gif)|

## Features
- Real-time interactive simulation
- Rigid body
  - Shapes: Convex polygons and circles
  - Density-based body definition
- Collision detection
  - Broad phase, narrow phase collision detection
  - Dynamic AABB volume tree for spatial partitioning
  - Computing minimum distance between two convex shapes (GJK)
  - Contact manifold generation (EPA)
- Collision resolution 
  - Impulse-based collision response  
  - Friction and restitution  
  - Iterative solver (Sequential impulses)  
  - Collision callbacks  
- Constraint-based simulation
  - Contact constraint
  - Joints: Revolute, Prismatic, Distance, Max distance, Weld, Motor, Line, Angle and Grab
  - Soft constraints
  - 2-contact LCP solver (Block solver)
- Optimization
  - Constraint islanding
  - Island(Rigid body) sleeping

## References
- https://box2d.org/publications/
- https://allenchou.net/game-physics-series/
- https://www.toptal.com/game/video-game-physics-part-iii-constrained-rigid-body-simulation
- https://dyn4j.org/blog/
