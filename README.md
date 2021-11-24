# 2D Rigidbody Physics Engine

2D Rigidbody physics engine implemented in HTML canvas with Typescript.

Live demo: https://sopiro.github.io/Physics/  
Video: https://youtu.be/mHnHj9HHSBg

## Preview
![img](.github/gjk%2Bepa%20demo.gif)

## Features
- Basic input, rendering system(Game engine-like)
- Collision detection
  - AABB Broad phase
  - Compute the closest distance between convex polygons (GJK)
  - Generate contact manifold (EPA)
- Collision resolution 
  - Constraint-based simulation
  - Sequential impulses

## References
- https://box2d.org/publications/
- https://allenchou.net/game-physics-series/
- https://www.toptal.com/game/video-game-physics-part-iii-constrained-rigid-body-simulation
- https://dyn4j.org/blog/
