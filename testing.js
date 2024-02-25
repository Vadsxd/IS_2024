const flags = {
    ft150: {x: -50, y: -39},
    ft140: {x: -40, y: -39},
    ft130: {x: -30, y: -39},
    ft120: {x: -20, y: -39},
    ft110: {x: -10, y: -39},
    ft0: {x: 0, y: -39},
    ftr10: {x: 10, y: -39},
    ftr20: {x: 20, y: -39},
    ftr30: {x: 30, y: -39},
    ftr40: {x: 40, y: -39},
    ftr50: {x: 50, y: -39},
    fb150: {x: -50, y: 39},
    fb140: {x: -40, y: 39},
    fb130: {x: -30, y: 39},
    fb120: {x: -20, y: 39},
    fb110: {x: -10, y: 39},
    fb0: {x: 0, y: 39},
    fbr10: {x: 10, y: 39},
    fbr20: {x: 20, y: 39},
    fbr30: {x: 30, y: 39},
    fbr40: {x: 40, y: 39},
    fbr50: {x: 50, y: 39},
    flt30: {x: -57.5, y: -30},
    flt20: {x: -57.5, y: -20},
    flt10: {x: -57.5, y: -10},
    fl0: {x: -57.5, y: 0},
    flb10: {x: -57.5, y: 10},
    flb20: {x: -57.5, y: 20},
    flb30: {x: -57.5, y: 30},
    frt30: {x: 57.5, y: -30},
    frt20: {x: 57.5, y: -20},
    frt10: {x: 57.5, y: -10},
    fr0: {x: 57.5, y: 0},
    frb10: {x: 57.5, y: 10},
    frb20: {x: 57.5, y: 20},
    frb30: {x: 57.5, y: 30},
    fglt: {x: -52.5, y: -7.01},
    fglb: {x: -52.5, y: 7.01},
    gl: {x: -52.5, y: 0},
    gr: {x: 52.5, y: 0},
    fc: {x: 0, y: 0},
    fplt: {x: -36, y: -20.15},
    fplc: {x: -36, y: 0},
    fplb: {x: -36, y: 20.15},
    fgrt: {x: 52.5, y: -7.01},
    fgrb: {x: 52.5, y: 7.01},
    fprt: {x: 36, y: -20.15},
    fprc: {x: 36, y: 0},
    fprb: {x: 36, y: 20.15},
    flt: {x: -52.5, y: -34},
    fct: {x: 0, y: -34},
    frt: {x: 52.5, y: -34},
    flb: {x: -52.5, y: 34},
    fcb: {x: 0, y: 34},
    frb: {x: 52.5, y: 34},
};

function squares_diff(x1, x2){
  return x1 * x1 - x2 * x2
}

function solve(d1, d2, x1, y1, x2, y2, x_bound, y_bound){
  var x, y;
  if (x1 == x2){
    y = (squares_diff(y2, y1) + squares_diff(d1, d2)) / (2 * (y2 - y1));
    diff = Math.pow(squares_diff(d1, y-y1), 0.5);
    x = x1 + diff;
    if (Math.abs(x) > x_bound){
      x -= 2 * diff;
    }
    return [x, y];
  }
  
  if (y1 == y2){
    x = (squares_diff(x2, x1) + squares_diff(d1, d2)) / (2 * (x2 - x1));
    diff = Math.pow(squares_diff(d1, x-x1), 0.5);
    y = y1 + diff;
    if (Math.abs(y) > y_bound){
      y -= 2 * diff;
    }
    return [x, y];
  }

  var alpha = (y1 - y2) / (x2 - x1);
  var beta = (squares_diff(y2, y1) + squares_diff(x2, x1) + squares_diff(d1, d2)) / (2 * (x2 - x1));

  var a = alpha * alpha + 1;
  var b = -2 * (alpha * (x1 - beta) + y1);
  var c = Math.pow(x1 - beta, 2) + squares_diff(y1, d1);
  
  var discriminant = Math.pow(b*b - 4 * a * c, 0.5);
  y = (-b + discriminant) / (2 * a);

  if (Math.abs(y) > y_bound){
    y = y - discriminant / a;
  }

  x = y * alpha + beta;
  if (Math.abs(x) > x_bound){
    y = y - discriminant / a;
    x = y * alpha + beta;
  }
  
  return [x, y];
}


function shuffle(array) {
  let currentIndex = array.length,  randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex > 0) {

    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}

x = 0
y = 0
a = Object.keys(flags)
shuffle(a)
flag1 = flags[a[0]]
flag2 = flags[a[1]]
// { x: -40, y: -39 } { x: 0, y: 34 }

console.log(flag1, flag2)
d1 = Math.pow((x - flag1['x'])*(x - flag1['x']) + (y - flag1['y'])*(y - flag1['y']), 0.5)
d2 = Math.pow((x - flag2['x'])*(x - flag2['x']) + (y - flag2['y'])*(y - flag2['y']), 0.5)

console.log(solve(d1, d2, flag1['x'], flag1['y'], flag2['x'], flag2['y'], 57.5, 39))
