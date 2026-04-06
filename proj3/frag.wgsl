@group(0) @binding(0) var<uniform> color : vec3f;
@group(0) @binding(1) var<uniform> res   : vec2f;
@group(0) @binding(2) var vSampler : sampler;
@group(0) @binding(3) var bBuffer : texture_2d<f32>;
@group(0) @binding(4) var<uniform> mono : f32;
@group(0) @binding(5) var<uniform> noise : f32;
@group(0) @binding(6) var<uniform> freq : f32; 
@group(0) @binding(7) var<uniform> anim : f32; 
@group(0) @binding(8) var<uniform> time : f32;
@group(0) @binding(9) var<uniform> speed : f32; 
@group(0) @binding(10) var<uniform> typeN : f32;
@group(0) @binding(11) var<uniform> scan : f32;
@group(0) @binding(12) var<uniform> linefreq : f32; 


@group(1) @binding(0) var vBuffer : texture_external;
 
@fragment 
fn fs( @builtin(position) pos : vec4f ) -> @location(0) vec4f {
    var p = pos.xy / res;

    let video = textureSampleBaseClampToEdge( vBuffer, vSampler, p ); //returns vec4f

    let fb = textureSample( bBuffer, vSampler, p );

    var v = video * .5 + fb * .975;
    var n = vec3f(1.); 
    var t = 0.;
    var c = vec3f(1.);
    let noiseScale = 40.0 * freq;
    var s = 1.;


    if(mono==1){
        let lum = dot(v.rgb, vec3<f32>(.2126,.7152,.0722));
        v = vec4<f32>(lum, lum, lum, v.a);
    }

    if(anim==1){
        t = time * speed; 
    }

    if(noise==1){
        switch(i32(typeN)){
        case 0: {n = vec3f(crunch(vec3f(p * noiseScale, t))); break;}
        case 1: {n = vec3f(step(0.5, layer(vec3f(p * noiseScale, t)))); break;}
        case 2: {n = vec3f(floor(layer(vec3f(p * noiseScale, t)) * 6.0) / 2.5);break;}
        default: {n = vec3f(1.0, 0., 0.); break;}
        }
    }

    if(scan == 1){
       // let warp = (.5 - mouse.y) * .15; 
        //let warpf = mouse.x * 20.; 
        //let warpy = p.y + warp * sin(p.x * warpf + t);


        let line = sin(p.y * linefreq * 3.141592);
        s = .75 + .25*line; 
    }

    let out = vec4f(v.rgb * color * (.5 + .5*n), v.a); // multiply by background color
    return  vec4f(out.rgb * s, out.a);
}


fn crunch(st : vec3f) -> f32 {
    let i = floor(st);
    let f = fract(st);

    let u = f * f * (3.0 - 2.0 * f);

    let n000 = random(i + vec3f(0.0, 0.0, 0.0));
    let n100 = random(i + vec3f(1.0, 0.0, 0.0));
    let n010 = random(i + vec3f(0.0, 1.0, 0.0));
    let n110 = random(i + vec3f(1.0, 1.0, 0.0));

    let n001 = random(i + vec3f(0.0, 0.0, 1.0));
    let n101 = random(i + vec3f(1.0, 0.0, 1.0));
    let n011 = random(i + vec3f(0.0, 1.0, 1.0));
    let n111 = random(i + vec3f(1.0, 1.0, 1.0));

    let nx00 = mix(n000, n100, u.x);
    let nx10 = mix(n010, n110, u.x);
    let nx01 = mix(n001, n101, u.x);
    let nx11 = mix(n011, n111, u.x);

    let nxy0 = mix(nx00, nx10, u.y);
    let nxy1 = mix(nx01, nx11, u.y);

    return mix(nxy0, nxy1, u.z);
}

//from book of shaders
fn random (p: vec3f) -> f32 {
    return fract(sin(dot(p, vec3f(12.9898, 78.233, 37.719))) * 43758.5453);
}

fn layer(p: vec3f) -> f32 {
    var value = 0.0;
    var amp = 0.5;
    var freq = 1.0;

    for (var i = 0; i < 4; i++) {
        value += amp * crunch(p * freq);
        freq *= 2.0;
        amp *= 0.5;
    }

    return value;
}