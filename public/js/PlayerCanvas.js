class PlayerCanvas extends Canvas{
    constructor(id, bg){
        super(id, bg);
    }

    done(){
        const lost = this.board.flat().filter(x => x < 0).length == Player.totalPieceLength;
        global.finished = lost;
        return lost ? -1 : 0;
    }

    piecePlaceOK(data, piece){
        const x = data.x;
        const y = data.y;
        if(!(x >= 0 && x <= this.size &&
            y >= 0 && y <= this.size)){
                return false;
        }

        if(x+piece.length*piece.rotation > this.size ||
        y+piece.length*(1-piece.rotation) > this.size){
            return false;
        }

        const pieceCoordinates = piece.coords.map(([i,j]) => [i+x, j+y]);

        //Out of bounds check
        for(const p of pieceCoordinates){
            if(p[0] > this.size || p[1] > this.size)
                return false;
        }

        //Other pieces overlap check
        for(const p of pieceCoordinates){
            if(this.board[p[1]] === undefined){
                return false;
            }else if(this.board[p[1]][p[0]] == undefined){
                return false;
            }else if(this.board[p[1]][p[0]] > 0)
                return false;
        }

        return true;
    }

    start(){
        const self = this;
        socket.on('incomingAttack', function (attack) {
            if(attack[3] == global.player.id){
                global.started = true;
                global.player.turn = true;
                if (attack[2] == 1) {
                    self.board[attack[0]][attack[1]] *= -1;
                    const audio=document.getElementById('audio');
                    audio.src="../public/audio/Missile_hit.mpg";
                    audio.volume=1;
                    audio.play();
                    global.player.turn = false;
                    switchState('text', "Opponent's turn");

                } else {
                    self.board[attack[0]][attack[1]] = 'miss';
                    const audio=document.getElementById('audio');
                    audio.src="../public/audio/Missile_Miss.mpg";
                    audio.volume=0.2;
                    audio.play();
                    switchState('text', 'Your turn');
                    document.getElementById("opponentCanvas").classList.add("blink");
                }
    
                if (self.touchWater) {
                    self.loadTexture();
                    self.touchWater(attack[1] * global.cellSize + global.cellSize / 2, attack[0] * global.cellSize + global.cellSize / 2)                    
                    if (!self.showing){
                        renderPlayerCanvas();
                    }
                }
    
                const result = self.done();
                if (global.finished) {
                        switchState('end', result)
                    global.ready = false;
                }
            }
        })
    }
    newpiece={};
    mouseReleased(piece){
        if (global.ready)
            return;

        if (Math.abs(piece.delta.x) < 0.5 && Math.abs(piece.delta.y) < 0.5) {
            piece.rotate();
        }
          
        const place = piece.getPiecePlace();
        place.x = Math.round(place.x / this.canvas.width * this.size);
        place.y = Math.round(place.y / this.canvas.height * this.size);
        
        if (piece.ready) {
            piece.boardCoords.map(c => this.board[c[1]][c[0]] = 0);
            piece.ready = false;
        }
        let ready = false
        if (this.piecePlaceOK(place, piece)) {
            
            piece.fit(place);
            const center = piece.getCenter();

            this.waterWave.touchWater(Math.floor(center.x), Math.floor(center.y));
            if (!this.showing)
                renderPlayerCanvas();

            const pieceCoordinates = piece.coords.map(([i, j]) => [i + place.x, j + place.y]);

            for (const p of pieceCoordinates) {
                this.board[p[1]][p[0]] = piece.id;
            }
            piece.boardCoords = pieceCoordinates;
            piece.ready = true;
            ready=true;
            for (const p of Object.values(global.player.pieces)) {
                if (!p.ready)
                    ready = false;
            }

            if (ready) {
                switchState('button', 'Ready')
            }
        }
        else
            switchState('text','Please ensure ships are inside separate squares')
    }
}