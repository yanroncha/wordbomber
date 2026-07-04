// Ground turret entity: a dome with an engraved letter (or a blank bunker).
window.WB = window.WB || {};

WB.Turret = function (x, y, letter) {
  this.x = x;
  this.y = y;
  this.letter = letter; // null = blank bunker (no penalty, small score)
  this.r = 20;
  this.alive = true;
  this.deadTimer = 0;   // wreck fade-out
  this.angle = Math.random() * Math.PI * 2;
  this.fireTimer = 2.5 + Math.random() * 3; // seconds until first shot
};

WB.Turret.prototype.update = function (dt, scrollSpeed) {
  this.y += scrollSpeed * dt;
  this.angle += dt * 0.8;
  if (!this.alive) this.deadTimer += dt;
};

WB.Turret.prototype.isGone = function (H) {
  return this.y > H + 40 || (!this.alive && this.deadTimer > 0.6);
};

WB.Turret.prototype.hitBy = function (bx, by, blastR) {
  if (!this.alive) return false;
  var dx = this.x - bx, dy = this.y - by;
  return dx * dx + dy * dy <= (this.r + blastR) * (this.r + blastR);
};

WB.Turret.prototype.draw = function (ctx) {
  var x = this.x, y = this.y;

  if (!this.alive) {
    var a = Math.max(0, 1 - this.deadTimer / 0.6);
    ctx.globalAlpha = a;
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(x, y, this.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    return;
  }

  // base plate
  ctx.fillStyle = '#4a4a52';
  ctx.fillRect(x - this.r - 4, y - this.r - 4, (this.r + 4) * 2, (this.r + 4) * 2);
  ctx.strokeStyle = '#6a6a72';
  ctx.strokeRect(x - this.r - 4, y - this.r - 4, (this.r + 4) * 2, (this.r + 4) * 2);

  // rotating barrel (decorative — turrets never fire)
  ctx.strokeStyle = '#8a8a92';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(this.angle) * (this.r + 8), y + Math.sin(this.angle) * (this.r + 8));
  ctx.stroke();
  ctx.lineWidth = 1;

  // dome
  ctx.fillStyle = this.letter ? '#7d3030' : '#555c66';
  ctx.beginPath();
  ctx.arc(x, y, this.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.arc(x, y, this.r - 3, -2.4, -0.6);
  ctx.stroke();

  if (this.letter) {
    ctx.fillStyle = '#ffe9a8';
    ctx.font = 'bold 22px Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.letter, x, y + 1);
  }
};
