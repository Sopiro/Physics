# 2D Rigidbody Physics Engine

2D Rigidbody physics engine implemented in HTML canvas with Typescript.

Live demo: https://sopiro.github.io/Physics/  
Video: https://youtu.be/mHnHj9HHSBg

## Preview
![img](.github/rigidbody.gif)

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
- Constraint-basd simulation
  - Contact constraint
  - Joints: Revolute, Prismatic, Distance, Max distance, Weld, Line, Angle, Grab
  - Soft constraints


## References
- https://box2d.org/publications/
- https://allenchou.net/game-physics-series/
- https://www.toptal.com/game/video-game-physics-part-iii-constrained-rigid-body-simulation
- https://dyn4j.org/blog/
