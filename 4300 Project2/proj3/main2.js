import { default as gulls } from 'https://cbcdn.githack.com/charlieroberts/gulls/raw/branch/main/gulls.js'
import { Pane } from 'https://cdn.jsdelivr.net/npm/tweakpane@4.0.5/dist/tweakpane.min.js'
import { dot, rand, fract} from './helpers.js'
import {default as Video} from './video.js'


const sg     = await gulls.init(),
      frag   = await gulls.import( 'frag.wgsl' ),
      shader = gulls.constants.vertex + frag

const params = { video_color: { r:0.7, g:0.7, b:0.7  },
                monochrome: false,
                noise: true,
                animated: true,
                speed: 10.,
                noise_amt: 10.,
                types: 0, 
                lines: false, 
                linefreq: 200.}


await Video.init()

const pane = new Pane()

// Object.values() creates an array out all the values
// in a javascript dictionary and ignores the keys
const color = sg.uniform( Object.values( params.video_color ) )
const res = sg.uniform( [window.innerWidth, window.innerHeight] )
const mono = sg.uniform([0]) //0 off 1 on 
const n = sg.uniform([1])
const anim = sg.uniform([1])
const freq = sg.uniform(5)
const back  = new Float32Array( gulls.width * gulls.height * 4)
const t_fb = sg.texture( back )
const time = sg.uniform(1); 
const speed = sg.uniform(3); 
const type = sg.uniform(0); 
const scanlines = sg.uniform([0])
const scanFreq = sg.uniform(200)
const mouse = sg.uniform([.5, .5])


window.addEventListener('mousemove', e => {
    mouse.value = [e.clientX / window.innerWidth, e.clientY / window.innerHeight]
})


//bindings 
const f = pane.addFolder({
    title: 'Video',
    expanded: true 
})

const f2 = pane.addFolder({
    title: 'Static',
    expanded: true
})

const f3 = pane.addFolder({
    title: 'Scan Lines',
    expanded: true
})

f.addBinding( params, 'video_color', { color: { type:'float' } })
  .on( 'change', () => updateColor())

f.addBinding (params, 'monochrome')
    //standard color to luminance conversion values
    .on('change', () => {
        mono.value = [params.monochrome ? 1 : 0]
        updateColor()
    }
)


f2.addBinding(params, 'noise').on('change', ()=> {
    n.value = [params.noise ? 1 : 0]
})

f2.addBinding( freq, 'value', { min:2, max:25, label:'static scale' })

f2.addBinding(params,'animated')
    .on('change', () => {
        anim.value = [params.animated ? 1 : 0]
        updateColor()
    }
)

f2.addBinding( speed, 'value', { min:1, max:10, label:'speed' })

f2.addBinding(params, 'types', {
    options: { pixel:0, tv:1, whatever_this_is:2 }
}).on('change', ()=>{
    console.log(params.types)
    type.value = [params.types | 0]
})

f3.addBinding(params, 'lines').on('change', ()=> {
    scanlines.value = [params.lines ? 1 : 0]
})

f3.addBinding(scanFreq, 'value', {min:0, max:400, label: 'scan frequency'})

pane.refresh()


const render = await sg.render({
    shader,
    data: [ color, 
        res,  
        sg.sampler(),
        t_fb,
        mono,
        n,
        freq,
        anim,
        time, 
        speed,
        type,
        scanlines,
        scanFreq,
        sg.video(Video.element)],
    copy: t_fb
})

sg.run( render )

let start = performance.now();

function updateTime() {
    const now = performance.now();
    const t = (now - start) * 0.001; // seconds

    time.value = t;

    requestAnimationFrame(updateTime);
}

updateTime()

function updateColor(){
    const rgb = Object.values(params.video_color)
        if(params.monochrome){
            const lum = dot(rgb, [.2126, .7152, .0722])
                color.value = [lum, lum, lum]
        }else {
            color.value = rgb
        }
}



