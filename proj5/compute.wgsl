struct Particle{
    pos: vec2f,
    vel: vec2f
};

@group(0) @binding(0) var<uniform> res:   vec2f;
@group(0) @binding(1) var<storage, read_write> state: array<Particle>;
@group(0) @binding(2) var<uniform> speed : f32; 

fn cellindex(cell:vec3u) -> u32{
    let size = 8u;
    return cell.x + (cell.y * size) + (cell.z * size * size); 
}

fn rand(s : vec2f) -> f32{
    return fract(sin(dot(s.xy, vec2f(12.9898,78.233)))
            *43758.5453123);
}

@compute
@workgroup_size(8,9)

fn cs( @builtin(global_invocation_id) cell:vec3u)  {
  let i = cellindex(cell);
  let p = state[i];
  var next = p.pos + (2./res) * (p.vel/2 * speed);

  let offscreen = next.y > 1. || next.x > 1. || next.x < -1. || next.y < -1.;

  if(offscreen){
    let spread = (rand(p.pos) -.5) * 6.;
    let rise = rand(p.pos + vec2f(1.,0.)) * 3. + 2.; 
    
    next = vec2f(0., -1.);
    state[i].vel = vec2f(spread, rise); 
  }
  
  //if(next.x >= 1.){next.x -=2;}
  
  state[i].pos = next;
}
