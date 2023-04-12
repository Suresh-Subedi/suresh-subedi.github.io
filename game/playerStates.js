export class Running extends State {
    constructor(player) {
        super('RUNNING');
        this.player = player;
    }
    enter() {
        this.player.frameY = 3;
    }
    handleInput(input) {
        if(input.includes('ArrowDown')) {
            this.player.setState(states.SITTING);
        } else if(input.includes('ArrowUp')) {
            this.player.setState(states.JUMPING);
        }

    }
}

export class Jumping extends State {
    constructor(player) {
        super('JUMPING');
        this.player = player;
    }
    enter() {
        if(this.player.onGround) this.player.onGround();
        this.player.frameY = 1;
    }
    handleInput(input) {
        if(input.includes('ArrowDown')) {
            this.player.setState(states.SITTING);
        } else if(input.includes('ArrowUp')) {
            this.player.setState(states.JUMPING);
        }

    }
}