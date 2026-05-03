import { default as seagulls } from 'https://cbcdn.githack.com/charlieroberts/gulls/raw/branch/main/gulls.js'
import { Pane } from 'https://cdn.jsdelivr.net/npm/tweakpane@4.0.5/dist/tweakpane.min.js'

const sg      = await seagulls.init(),
      frag    = await seagulls.import( './frag.wgsl' ),
      compute = await seagulls.import( './compute.wgsl' ),
      render  = seagulls.constants.vertex + frag,
      width   = (seagulls.width),
      height  = (seagulls.height),
      grid    = new Float32Array(width*height*2);



// setup grid
for( let i = 0; i < width * height*2; i+=2 ) {
  grid[i] = 1.
  grid[i+1] = 0.
}

//tweakpane
const params = { speed: 10,
                 sym : new URLSearchParams(window.location.search).get('sym') !== 'false',
                 color: {r:1.,g:1.,b:1.},
                 map: 0
}

//populate grid 
const cx = params.sym ? Math.floor(width) : Math.floor(width/2)
const cy = Math.floor(height/2)
for(let y = cy-10; y < cy+10; y++){
  for(let x = cx-10; x < cx+10; x++){
    const i = (y*width + x)*2
    grid[i] = .5
    grid[i + 1] = .5
  }
}

const statebuffer1 = sg.buffer( grid )
const statebuffer2 = sg.buffer( grid )
const res = sg.uniform([ window.innerWidth, window.innerHeight ])
const da = sg.uniform(1.0)
const db = sg.uniform(0.5)
const dt = sg.uniform(1.0)
const f  = sg.uniform(0.055)
const k  = sg.uniform(0.062)

const speed = sg.uniform(1)
const color = sg.uniform(Object.values( params.color ))
const type = sg.uniform(0)

const pane = new Pane()

const ctrl = pane.addFolder({
  title: "Diffusion Controls",
  expanded: true
})

const ext = pane.addFolder({
  title: "Extra Controls",
  expanded: true
})

ctrl.addBinding(da, 'value', {min: .01, max: 1, label: 'Delta A'})
ctrl.addBinding(db, 'value', {min: .01, max: 1, label: 'Delta B'})
ctrl.addBinding(f, 'value', {min:.01, max: .1, label: 'Feed'})
ctrl.addBinding(k, 'value', {min:.01, max: .1, label: 'Kill Rate'})

ext.addBinding(speed, 'value', {min:1, max: 10, label: 'simulation speed'})
ext.addBinding(params, 'sym', {label: 'center'}).on('change', ()=> {
  const url = new URL(window.location)
  url.searchParams.set('sym', params.sym)
  window.location = url 
})

ext.addBinding( params, 'color', { color: { type:'float' } })
  .on( 'change', () => color.value = Object.values(params.color))

ext.addBinding(params, 'map', {
    options: { none:0, radial:1, zone:2 }
}).on('change', ()=>{
    console.log(params.map)
    type.value = [params.map | 0]
})

const renderPass = await sg.render({
  shader: render,
  data: [
    res,
    sg.pingpong( statebuffer1, statebuffer2 ), 
    color
  ]
})

const computePass = sg.compute({
  shader: compute,
  data: [ res, sg.pingpong( statebuffer1, statebuffer2 ), da, db, dt, f, k, speed, type],
  dispatchCount:  [Math.round(seagulls.width / 8), Math.round(seagulls.height/8), 1],
})

sg.run( computePass, renderPass )

