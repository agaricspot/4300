import { default as gulls } from 'https://cbcdn.githack.com/charlieroberts/gulls/raw/branch/main/gulls.js'
import { Pane } from 'https://cdn.jsdelivr.net/npm/tweakpane@4.0.5/dist/tweakpane.min.js'

const sg = await gulls.init(),
      render_shader  = await gulls.import( './render.wgsl' ),
      compute_shader = await gulls.import( './compute.wgsl' )

const NUM_PARTICLES = 512,
      NUM_PROPERTIES = 4,
      state = new Float32Array(NUM_PARTICLES * NUM_PROPERTIES)

for(let i = 0; i < NUM_PARTICLES * NUM_PROPERTIES; i++){
  const base = i * NUM_PROPERTIES;
  const spread = (Math.random()-.5)*6.
  const rise  = Math.random() * 3. + 2.

  state[base] = 0
  state[base + 1] = -1 + Math.random() * .2
  state[base + 2] = spread
  state[base + 3] = rise
}

const frame = sg.uniform(0),
      res   = sg.uniform( [sg.width, sg.height] ),
      speed = sg.uniform(.5),
      b_state = sg.buffer(state),
      densityMask = sg.uniform(NUM_PARTICLES),
      fade = sg.uniform(0)

const render = await sg.render({
  shader:render_shader,
  data:[
    frame,
    res,
    b_state,
    densityMask,
    fade
  ],
  onframe() { frame.value++ },
  count: NUM_PARTICLES * 4,
  blend: true

})

const pane = new Pane()

pane.addBinding(speed, 'value', {min:.1, max: 1, label: 'particle speed'})
pane.addBinding(densityMask, 'value', {min:0, max:NUM_PARTICLES, step:1, label: 'particle density'})
pane.addBinding(fade, 'value',{ min: -1, max:3, label: 'fade level'} )

const dc = Math.ceil(NUM_PARTICLES/64)

const compute = sg.compute({
  shader:compute_shader,
  data:[
    res,
    b_state,
    speed
  ],
  dispatchCount:[dc,dc,1]
})

sg.run( compute, render )
