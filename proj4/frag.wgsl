@group(0) @binding(0) var<uniform> res:   vec2f;
@group(0) @binding(1) var<storage> state: array<f32>;
@group(0) @binding(3) var<uniform> color : vec3f; 

@fragment 
fn fs( @builtin(position) pos : vec4f ) -> @location(0) vec4f {
  let idx : u32 = u32( pos.y * res.x + pos.x );
  let a = state[idx*2];
  let b = state[idx*2 + 1];
  let complement = vec3f(1.0 - color.r, 1.0 - color.g, 1.0 - color.b);
  let col = mix(color, complement, b*4.); //increase b so change is visible
  return vec4f(col, 1.0);
}
