export function dot(a,b){
    let res = 0
    for (let i = 0; i<a.length; i++){
        res += a[i]*b[i]
    }

    return res
}

export function fract(x){
    return x - Math.floor(x)
}

export function rand(s){
    return fract(Math.sin(dot(s.xy, [12.9898,78.233]))
            *43758.5453123)
}