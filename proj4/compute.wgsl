
@group(0) @binding(0) var<uniform> res: vec2f;
@group(0) @binding(1) var<storage> statein: array<f32>;
@group(0) @binding(2) var<storage, read_write> stateout: array<f32>;
@group(0) @binding(3) var<uniform> da : f32;
@group(0) @binding(4) var<uniform> db : f32;
@group(0) @binding(5) var<uniform> dt : f32;
@group(0) @binding(6) var<uniform> f : f32;
@group(0) @binding(7) var<uniform> k : f32;
@group(0) @binding(8) var<uniform> speed : f32;
@group(0) @binding(9) var<uniform> maps : f32; 

fn index( x:i32, y:i32 ) -> u32 {
  let r = vec2i(res);
  let row = (y % r.y + r.y) % r.y; 
  let col = (x % r.x + r.x) % r.x;
  return u32( row * r.x + col);
}

fn map(uv : vec2f) -> vec2f{
  let t = i32(maps);

  if(t==1){
    let dist = length(uv - vec2f(.5));
    let feed = .02 + dist * .08;
    let kill = .05 + dist * .02;
    return vec2f(feed, kill);
  } else if (t == 2) {
    let qx = uv.x > 0.5;
    let qy = uv.y > 0.5;
    if (qx && qy)  { return vec2f(0.035, 0.065); }
    if (!qx && qy) { return vec2f(0.060, 0.062); }
    if (qx && !qy) { return vec2f(0.055, 0.055); }
    return             vec2f(0.025, 0.060);
  } else {
    return vec2f(f, k);
  }
}

@compute
@workgroup_size(8,8)
fn cs( @builtin(global_invocation_id) _cell:vec3u ) {
  let cell = vec3i(_cell);
  let i = index(cell.x, cell.y);

  var a = statein[i*2];
  var b = statein[i*2 + 1];

  let steps = u32(speed); 
  let uv = vec2f(f32(cell.x), f32(cell.y)) / res;
  let fk = map(uv);
  let fLocal = fk.x;
  let kLocal = fk.y;


  //laplacian transform, standard weight 
  for( var s = 0u; s < steps; s++){
    let lapA = 
      statein[index(cell.x-1, cell.y-1)*2] * .05 + 
      statein[index(cell.x, cell.y-1)*2] * .2 +
      statein[index(cell.x+1, cell.y-1)*2] * .05 + 
      statein[index(cell.x-1, cell.y)*2] * .2 + 
      a*-1. + 
      statein[index(cell.x+1, cell.y)*2] * .2 + 
      statein[index(cell.x-1, cell.y+1)*2] *.05 + 
      statein[index(cell.x, cell.y+1)*2] * .2 + 
      statein[index(cell.x+1, cell.y+1)*2] * .05;

    let lapB = 
      statein[index(cell.x-1, cell.y-1)*2+1] * .05 + 
      statein[index(cell.x, cell.y-1)*2+1] * .2 +
      statein[index(cell.x+1, cell.y-1)*2+1] * .05 + 
      statein[index(cell.x-1, cell.y)*2+1] * .2 + 
      b*-1. + 
      statein[index(cell.x+1, cell.y)*2+1] * .2 + 
      statein[index(cell.x-1, cell.y+1)*2+1] *.05 + 
      statein[index(cell.x, cell.y+1)*2+1] * .2 + 
      statein[index(cell.x+1, cell.y+1)*2+1] * .05;

    let react = a * b*b;
    a = clamp(a + (da * lapA - react + fLocal * (1. - a)) * dt, 0., 1.);
    b = clamp(b + (db * lapB + react - (kLocal + fLocal) * b) * dt, 0., 1.);
  }

  stateout[i*2] = a;
  stateout[i*2 + 1] = b;
}
