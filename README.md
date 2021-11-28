# 2D Rigidbody Physics Engine

2D Rigidbody physics engine implemented in HTML canvas with Typescript.

Live demo: https://sopiro.github.io/Physics/  
Video: https://youtu.be/mHnHj9HHSBg

## Preview
![img](.github/rigidbody.gif)

## Features
- Basic input, rendering system(Game engine-like)
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
  - Joints: Revolute, Distance joint


## References
- https://box2d.org/publications/
- https://allenchou.net/game-physics-series/
- https://www.toptal.com/game/video-game-physics-part-iii-constrained-rigid-body-simulation
- https://dyn4j.org/blog/
