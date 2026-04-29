import { default as gulls } from 'https://cbcdn.githack.com/charlieroberts/gulls/raw/branch/main/gulls.js'
const WORKGROUP_SIZE = 64,
      NUM_AGENTS = 256,
      DISPATCH_COUNT = [NUM_AGENTS/WORKGROUP_SIZE,1,1],
      GRID_SIZE = 2,
      STARTING_AREA = .3

const W = Math.round( window.innerWidth  / GRID_SIZE ),
      H = Math.round( window.innerHeight / GRID_SIZE )

const render_shader = gulls.constants.vertex + `
@group(0) @binding(0) var<storage> pheromones: array<f32>;
@group(0) @binding(1) var<storage> render: array<f32>;

@fragment 
fn fs( @builtin(position) pos : vec4f ) -> @location(0) vec4f {
  let grid_pos = floor( pos.xy / ${GRID_SIZE}.);
  
  let pidx = grid_pos.y  * ${W}. + grid_pos.x;
  let p = pheromones[ u32(pidx) ];
  let v = render[ u32(pidx) ];

  let vtype = u32(v);
  var color = vec3f(0.);

  switch(vtype){
    case 1u: {color = vec3(1., 0., 0.);}
    case 2u: {color = vec3(0., 1., 0.);}
    case 3u: {color = vec3(0., 1., 1.);}
    case 4u: {color = vec3(1., 0., 1.);}
    default: {}
  }

  let ptype = u32(p);
  var trail_color = vec3f(0.);
  switch(ptype){
    case 1u: { trail_color = vec3(1., 0., 0.); }
    case 2u: { trail_color = vec3(0., 1., 0.); }
    case 3u: { trail_color = vec3(0., 1., 1.); }
    case 4u: { trail_color = vec3(1., 0., 1.); }
    default: {}
  }

  var out = vec3f(0.);
  if(v!=0.){
    out = color;
  } else if(p!=0.){
    out = trail_color * .2;
  }
  return vec4f( out, 1. );
}`

const compute_shader =`
struct Vant {
  pos: vec2f,
  dir: f32,
  flag: f32
}

@group(0) @binding(0) var<storage, read_write> vants: array<Vant>;
@group(0) @binding(1) var<storage, read_write> pheremones: array<f32>;
@group(0) @binding(2) var<storage, read_write> render: array<f32>;

fn pheromoneIndex( vant_pos: vec2f ) -> u32 {
  let width = ${W}.;
  return u32( abs( vant_pos.y % ${H}. ) * width + vant_pos.x );
}

@compute
@workgroup_size(${WORKGROUP_SIZE},1,1)

fn cs(@builtin(global_invocation_id) cell:vec3u)  {
  let pi2   = ${Math.PI*2}; 
  var vant:Vant  = vants[ cell.x ];

  let pIndex    = pheromoneIndex( vant.pos );
  let pheromone = pheremones[ pIndex ];

  //added vant behaviors
  switch(u32(vant.flag)){
    case 0u:{ //classic vant 
        if(pheromone != 0.){
            vant.dir += .25;
            pheremones[pIndex] = 0.;
        } else {
            vant.dir -= .25;
            pheremones[pIndex] = vant.flag + 1.;
        }
    }
    case 1u:{ //mirror
           if(pheromone != 0.){
            vant.dir -= .25;
            pheremones[pIndex] = 0.;
        } else {
            vant.dir += .25;
            pheremones[pIndex] = vant.flag + 1.; 
        }
    }
    case 2u: { //straight ant 
        if(pheromone != 0.){
            vant.dir += .25;
            pheremones[pIndex] = 0.;
        } else {
            pheremones[pIndex] = vant.flag + 1.;
        } //no turn on empthy 
    }
    case 3u: {//uturn
        if( pheromone != 0. ) {
            vant.dir += .5;
            pheremones[pIndex] = 0.;
        } else {
            vant.dir -= .25;
            pheremones[pIndex] = vant.flag + 1.;
        }  
    }
    default: {}
  }

  // calculate direction based on vant heading
  let dir = vec2f( sin( vant.dir * pi2 ), cos( vant.dir * pi2 ) );
  
  vant.pos = round( vant.pos + dir ); 

  vants[ cell.x ] = vant;
  
  render[ pIndex ] = vant.flag + 1;
}`
 
const NUM_PROPERTIES = 4 // must be evenly divisble by 4!
const pheromones   = new Float32Array( W*H ) // hold pheromone data
const vants_render = new Float32Array( W*H ) // hold info to help draw vants
const vants        = new Float32Array( NUM_AGENTS * NUM_PROPERTIES ) // hold vant info

const offset = .5 - STARTING_AREA / 2
for( let i = 0; i < NUM_AGENTS * NUM_PROPERTIES; i+= NUM_PROPERTIES ) {
  vants[ i ]   = Math.floor( (offset+Math.random()*STARTING_AREA) * W ) // x
  vants[ i+1 ] = Math.floor( (offset+Math.random()*STARTING_AREA) * H ) // y
  vants[ i+2 ] = 0 // direction 
  vants[ i+3 ] = Math.floor( Math.random() * 4 )
}

const sg = await gulls.init()
const pheromones_b = sg.buffer( pheromones )
const vants_b  = sg.buffer( vants )
const render_b = sg.buffer( vants_render )

const render = await sg.render({
  shader: render_shader,
  data:[
    pheromones_b,
    render_b
  ],
})

const compute = sg.compute({
  shader: compute_shader,
  data:[
    vants_b,
    pheromones_b,
    render_b
  ],
  onframe() { render_b.clear() },
  dispatchCount:DISPATCH_COUNT
})

sg.run( compute, render )