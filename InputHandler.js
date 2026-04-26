export class InputHandler {
    constructor(game) {
        this.game = game;
        this.keys = new Set();
        
        window.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            if (this.keys.has(key)) return; 
            this.keys.add(key);
            if (this.game.isDead) return;
            
            if (key === 'a' || key === 'arrowleft') { 
                this.game.moveDir = -1; 
                this.game.facingRight = false; 
            }
            if (key === 'd' || key === 'arrowright') { 
                this.game.moveDir = 1; 
                this.game.facingRight = true; 
            }
            if (key === 'w' || key === ' ') { 
                if(this.game.jumpCount < 2) { 
                    this.game.velocityY = this.game.jumpForce; 
                    this.game.jumpCount++; 
                } 
            }
            if (key === 'e') { 
                if (this.game.canDash) { 
                    this.game.isDashing = true; 
                    this.game.canDash = false; 
                    setTimeout(() => this.game.isDashing = false, 200); 
                    setTimeout(() => this.game.canDash = true, 760); 
                } 
            }
            if (key === 's') { 
                if (this.game.canAttack) { 
                    this.game.isAttacking = true; 
                    this.game.attackTime = 0.3; 
                    this.game.canAttack = false; 
                    const attackBtn = document.getElementById('attackBtn');
                    if(attackBtn) attackBtn.style.opacity = "0.3";
                    setTimeout(() => { 
                        this.game.canAttack = true; 
                        if(attackBtn) attackBtn.style.opacity = "1"; 
                    }, 600); 
                } 
            }
        });
        
        window.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            this.keys.delete(key);
            if (['a', 'd', 'arrowleft', 'arrowright'].includes(key)) {
                const movingLeft = this.keys.has('a') || this.keys.has('arrowleft');
                const movingRight = this.keys.has('d') || this.keys.has('arrowright');
                if (movingLeft) { 
                    this.game.moveDir = -1; 
                    this.game.facingRight = false; 
                }
                else if (movingRight) { 
                    this.game.moveDir = 1; 
                    this.game.facingRight = true; 
                }
                else { 
                    this.game.moveDir = 0; 
                }
            }
        });
    }

    update() {}
}