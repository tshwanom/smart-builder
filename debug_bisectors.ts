import { computeStraightSkeleton } from './src/modules/canvas/domain/geometry/analytics/StraightSkeleton'
import { Vec2 } from './src/modules/canvas/domain/geometry/analytics/types'

// L-shape polygon: (0,0)(5,0)(5,3)(8,3)(8,6)(0,6)
const lPoly: Vec2[] = [
  {x:0,y:0},{x:5,y:0},{x:5,y:3},{x:8,y:3},{x:8,y:6},{x:0,y:6}
]

// Compute normals/bisectors for debugging
const n = lPoly.length
const normals: Vec2[] = []
for (let i=0;i<n;i++){
  const j=(i+1)%n
  const dx=lPoly[j].x-lPoly[i].x, dy=lPoly[j].y-lPoly[i].y
  const len=Math.hypot(dx,dy)||1
  normals.push({x:-dy/len,y:dx/len})
}
let cx=0,cy=0
lPoly.forEach(p=>{cx+=p.x;cy+=p.y})
cx/=n;cy/=n
const testDot=(cx-lPoly[0].x)*normals[0].x+(cy-lPoly[0].y)*normals[0].y
if (testDot<0) normals.forEach((nn,i)=>{normals[i]={x:-nn.x,y:-nn.y}})

console.log('Normals:', normals.map(nn => `(${nn.x.toFixed(2)},${nn.y.toFixed(2)})`).join(' '))

const bisectors: Vec2[] = []
for (let i=0;i<n;i++){
  const nL=normals[(i-1+n)%n], nR=normals[i]
  const bx=nL.x+nR.x, by=nL.y+nR.y
  const bLen=Math.hypot(bx,by)
  bisectors.push(bLen<1e-10?{x:nL.x,y:nL.y}:{x:bx/bLen,y:by/bLen})
}
console.log('Bisectors:', bisectors.map(b => `(${b.x.toFixed(3)},${b.y.toFixed(3)})`).join(' '))

// Check V1=(5,0) intersection with all other vertices
function rri(o1:Vec2,d1:Vec2,o2:Vec2,d2:Vec2){
  const det=d1.x*d2.y-d1.y*d2.x
  if(Math.abs(det)<1e-10)return null
  const dx=o2.x-o1.x,dy=o2.y-o1.y
  const t1=(dx*d2.y-dy*d2.x)/det
  const t2=(dx*d1.y-dy*d1.x)/det
  return{t1,t2,point:{x:o1.x+t1*d1.x,y:o1.y+t1*d1.y}}
}
console.log('\n--- V1=(5,0) bisector intersections ---')
for(let j=0;j<n;j++){
  if(j===1)continue
  const hit=rri(lPoly[1],bisectors[1],lPoly[j],bisectors[j])
  if(hit){
    console.log(`V1 vs V${j}: t1=${hit.t1.toFixed(3)} t2=${hit.t2.toFixed(3)} point=(${hit.point.x.toFixed(3)},${hit.point.y.toFixed(3)})`)
  } else {
    console.log(`V1 vs V${j}: null (parallel)`)
  }
}

// Also check reflex vertex V2=(5,3)
console.log('\n--- V2=(5,3) bisector intersections ---')
for(let j=0;j<n;j++){
  if(j===2)continue
  const hit=rri(lPoly[2],bisectors[2],lPoly[j],bisectors[j])
  if(hit){
    console.log(`V2 vs V${j}: t1=${hit.t1.toFixed(3)} t2=${hit.t2.toFixed(3)} point=(${hit.point.x.toFixed(3)},${hit.point.y.toFixed(3)})`)
  } else {
    console.log(`V2 vs V${j}: null (parallel)`)
  }
}
