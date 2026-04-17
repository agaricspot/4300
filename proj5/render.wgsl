struct VertexInput { 
    @location(0) pos: vec2f,
    @builtin(instance_index) instance: u32,
    @builtin(vertex_index) v : u32
};

struct Particle{
    pos: vec2f,
    vel: vec2f
};

struct VertexOutput {
    @builtin(position) pos: vec4f,
    @location(0) color: vec3f,
    @location(1) elevation: f32,
};

@group(0) @binding(0) var<uniform> frame : f32;
@group(0) @binding(1) var<uniform> res: vec2f;
@group(0) @binding(2) var<storage> state: array<Particle>;
@group(0) @binding(3) var<uniform> density : f32;
@group(0) @binding(4) var<uniform> fadelevel : f32;

@vertex
fn vs(input: VertexInput) -> VertexOutput {
    let p_index = input.v /4;
    let corner = input.v % 4;

    if(f32(input.instance) >= density){
        var out : VertexOutput;
        out.pos = vec4f(9999., 9999., 0., 1);

        return out;
    }

    let size = .2;
    let aspect = res.x/res.y;
    let p = state[input.instance];
    
     var offsets = array<vec2f, 4>(
        vec2f( .5, .5),  
        vec2f(-0.5, -.5),   
        vec2f( 0.5, -.5),
        vec2f(-.5, .5)   
    );

    let angle = frame * .02 + f32(input.instance);
    let c = cos(angle);
    let s = sin(angle);

    let off = offsets[corner] * size;
    let r = vec2f(off.x * c - off.y * s, off.x * s + off.y * c);

    var out : VertexOutput;
    out.pos = vec4f(p.pos.x - r.x / aspect, p.pos.y + r.y, 0., 1.);
    out.color = vec3f(1,.5, 0);
    out.elevation = p.pos.y; 

    return out;
}

@fragment
fn fs(in: VertexOutput) -> @location(0) vec4f{
    let fade = 1. - clamp((in.elevation + fadelevel)/2, 0., 1.);
    return vec4f(in.color * fade, 1.);
}