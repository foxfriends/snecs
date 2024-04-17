# Snecs

Entity-Component-System based off [Specs](https://github.com/amethyst/specs), but
for NodeJS (**S**necs **N**ode **ECS**, if you will). Due to Javascript's inherent
single-threadedness, we naturally drop the "parallel" aspect, but keep the interface
and concepts similar.

Someday (given outside interest, or inside free time) I will document this project.
Until then, refer to the [Specs Tutorial](https://specs.amethyst.rs/docs/tutorials/)
for instructions better than I could ever create. You'll find using Snecs remarkably
similar.

## Minification

If you are running Snecs in a browser, ensure that minification is not mangling names,
particularly if you are making use of snapshots; Snecs uses classes' names internally
for taking and restoring snapshots, so they do need to be consistent.

For apps built with esbuild, see the [`keepNames`](https://esbuild.github.io/api/#keep-names)
option, for example. Other minifiers hopefully will have similar options which you can use.
