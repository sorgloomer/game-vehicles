(function() {

  function Vehicle() {
    this.px = 0;
    this.py = 0;
    this.vx = 0;
    this.vy = 0;
    this.phi = 0;

    this.acc = 0;
    this.turn = 0;
    this.sliding = 0;
  }

  function towards_zero(x, dx) {
    return x > dx ? x - dx : (x < -dx ? x + dx : 0);
  }

  var SLIDING_FRICTION = 500;
  var ROLLING_FRICTION = 100;
  var MAX_FORE_SPEED = 500;
  var MAX_BACK_SPEED = -300;
  var MAX_SLIDING = 50;
  var EPS = 1e-6;

  Vehicle.prototype.copy = function copy(other) {
    this.px = other.px;
    this.py = other.py;
    this.vx = other.vx;
    this.vy = other.vy;
    this.phi = other.phi;
    this.acc = other.acc;
    this.turn = other.turn;
    this.sliding = other.sliding;
  };

  Vehicle.prototype.step = function step(dt) {
    var sin = Math.sin;
    var cos = Math.cos;
    var abs = Math.abs;
    var min = Math.min;

    var hdt = dt * 0.5;
    this.phi += dt * this.turn;

    var dx = cos(this.phi);
    var dy = sin(this.phi);

    var old_vx = this.vx;
    var old_vy = this.vy;
    var fore_speed = dx * old_vx + dy * old_vy;
    var diag_speed = dx * old_vy - dy * old_vx;

    var tacc = this.acc;

    var new_fore_speed = towards_zero(fore_speed, ROLLING_FRICTION * dt);
    var new_diag_speed = towards_zero(diag_speed, SLIDING_FRICTION * dt);

    var acc = 0;
    this.sliding = min(abs(new_diag_speed), MAX_SLIDING);

    if (tacc > EPS) {
      if (new_fore_speed < 0) {
        this.sliding = MAX_SLIDING;
        acc = SLIDING_FRICTION;
      } else if (new_fore_speed < MAX_FORE_SPEED) {
        acc = tacc;
      }
    } else if (tacc < -EPS) {
      if (new_fore_speed > 0) {
        this.sliding = MAX_SLIDING;
        acc = -SLIDING_FRICTION;
      } else if (new_fore_speed > MAX_BACK_SPEED) {
        acc = tacc;
      }
    }

    var new_vx = new_fore_speed * dx - new_diag_speed * dy + dx * acc * dt;
    var new_vy = new_fore_speed * dy + new_diag_speed * dx + dy * acc * dt;
    this.vx = new_vx;
    this.vy = new_vy;
    this.px += (old_vx + new_vx) * hdt;
    this.py += (old_vy + new_vy) * hdt;
  };


  function fill(arr, val) {
    for (var i = 0; i < arr.length; i++) arr[i] = val;
  }
  function alloc(cnt, val) {
    var res = new Array(cnt);
    fill(res, 0);
    return res;
  }

  function main() {
    var canvas = document.getElementById("surface");
    var ctx = canvas.getContext("2d");

    var floor_canvas = document.createElement("canvas");
    floor_canvas.width = canvas.width;
    floor_canvas.height = canvas.height;
    var floor_ctx = floor_canvas.getContext("2d");
    floor_ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
    floor_ctx.lineWidth = 5;
    floor_ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    floor_ctx.setTransform(0.5, 0, 0, 0.5, 200, 150);

    var vehicle = new Vehicle();
    var old_vehicle = new Vehicle();
    var keys = alloc(512, 0);
    vehicle.px = 400;
    vehicle.py = 300;

    setInterval(frame, 20);

    function setKey(event, what) {
      var key = event.keyCode ? event.keyCode : event.which;
      keys[key] = what;
    }

    window.onkeydown = function (e) {
      setKey(e, 1);
    };
    window.onkeyup = function (e) {
      setKey(e, 0);
    };

    var lighten_cntr = 0;
    var STEP_DT = 0.02;
    var SLIDE_FADE_DT = 0.1;

    function frame() {
      var sin = Math.sin;
      var cos = Math.cos;

      old_vehicle.copy(vehicle);
      vehicle.step(STEP_DT);

      var psin = sin(vehicle.phi);
      var pcos = cos(vehicle.phi);

      floor_ctx.setTransform(1, 0, 0, 1, 0, 0);
      lighten_cntr += STEP_DT;
      if (lighten_cntr > SLIDE_FADE_DT) {
        floor_ctx.fillRect(0, 0, canvas.width, canvas.height);
        lighten_cntr -= SLIDE_FADE_DT;
      }
      if (vehicle.sliding > EPS) {
        var opsin = sin(old_vehicle.phi);
        var opcos = cos(old_vehicle.phi);
        floor_ctx.setTransform(0.5, 0, 0, 0.5, 200, 150);
        floor_ctx.lineWidth = vehicle.sliding * 0.1;
        floor_ctx.beginPath();
        transMoveTo(floor_ctx, old_vehicle.px, old_vehicle.py, opcos, opsin, -30, -20);
        transLineTo(floor_ctx, vehicle.px, vehicle.py, pcos, psin, -30, -20);
        transMoveTo(floor_ctx, old_vehicle.px, old_vehicle.py, opcos, opsin, 30, -20);
        transLineTo(floor_ctx, vehicle.px, vehicle.py, pcos, psin, 30, -20);
        transMoveTo(floor_ctx, old_vehicle.px, old_vehicle.py, opcos, opsin, -30, 20);
        transLineTo(floor_ctx, vehicle.px, vehicle.py, pcos, psin, -30, 20);
        transMoveTo(floor_ctx, old_vehicle.px, old_vehicle.py, opcos, opsin, 30, 20);
        transLineTo(floor_ctx, vehicle.px, vehicle.py, pcos, psin, 30, 20);
        floor_ctx.stroke();
      }


      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(floor_canvas, 0, 0);



      ctx.setTransform(0.5, 0, 0, 0.5, 200, 150);
      ctx.transform(pcos, psin, -psin, pcos, vehicle.px, vehicle.py);
      ctx.beginPath();
      ctx.strokeStyle = "black";
      ctx.rect(-30, -20, 60, 40);
      ctx.stroke();

      vehicle.turn = (keys[39] - keys[37]) * 4;
      vehicle.acc = (keys[38] - keys[40]) * 400;
    }
  }

  function transMoveTo(ctx, tx, ty, dx, dy, px, py) {
    ctx.moveTo(tx + px * dx + py * dy, ty + px * dy - py * dx);
  }
  function transLineTo(ctx, tx, ty, dx, dy, px, py) {
    ctx.lineTo(tx + px * dx + py * dy, ty + px * dy - py * dx);
  }


  main();

})();
