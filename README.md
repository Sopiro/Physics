# 2D Rigid Body Physics Engine

2D Rigid body physics engine implemented in HTML canvas with Typescript.

Live demo: https://sopiro.github.io/Physics/  
Video1: https://youtu.be/mHnHj9HHSBg  
Video2: https://youtu.be/57seMGrGWhw

## Preview
![img1](.github/2.gif)
![img2](.github/3.gif)
![img3](.github/4.gif)

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
  - Joints: Revolute, Prismatic, Distance, Max distance, Weld, Motor, Line, Angle, Grab
  - Soft constraints


## References
- https://box2d.org/publications/
- https://allenchou.net/game-physics-series/
- https://www.toptal.com/game/video-game-physics-part-iii-constrained-rigid-body-simulation
- https://dyn4j.org/blog/
