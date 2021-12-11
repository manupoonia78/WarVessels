class OpponentCanvas extends Canvas{
    constructor(id, bg){
        super(id, bg);
    }

    done(){
        const won = this.board.flat().filter(x => x < 0).length == Player.totalPieceLength;
        global.finished = won;
        return won ? 1 : 0;
    }

    attackOK(x, y){
        if(!(x >= 0 && x <= this.size &&
            y >= 0 && y <= this.size)){
                return false;
        }

        if(this.board[x] === undefined){
            return false;
        }

        if(this.board[x][y] != 0){
            return false;
        }

        return true;
    }

    mouseDown(e){
        if (global.ready && global.opponentReady) {
            const rect = this.canvas.getBoundingClientRect()
            const attack = [Math.floor((e.clientY - rect.top) / this.canvas.width * this.size), Math.floor((e.clientX - rect.left) / this.canvas.height * this.size)];
            
            if (!this.attackOK(attack[0], attack[1]))
                return

            if (global.player.turn) {
                global.started = true


                // switchState('text', "<div class='dot-pulse'><span>.</span><span>.</span><span>.</span></div>")

                const data = {
                    playerID: global.player.id,
                    attack: attack,
                    gameID: global.gameID
                }

                const self = this;
                socket.emit('attack', data, function (json) {
                    if(json.error){
                        if(data.error == 'gameDoesNotExist'){
                            switchState('dropdown', ['Game session has been terminated.', 'Please return to home page and create a new game.'])
                        }
                    }else{
                        if(json.hit){
                            switchState('text', "Your turn");
                            self.board[attack[0]][attack[1]] = -1;
                            const audio=document.getElementById('audio');
                            audio.src="../public/audio/Missile_hit.mpg";
                            audio.volume=1;
                            audio.play();
                            global.player.turn = true;
                            let arr=[2,3,3,4,5];
                            let flag=false;
                            for(const c of json.opponent){
                                for(const x of c) {
                                    if(x<0) {
                                        arr[-x -1]--;                                      
                                        if(arr[-x -1] === 0){
                                            flag=true;
                                        }
                                    }
                                }
                            }
                            if(flag){
                                for(var i=0;i<5;i++) {
                                    if(arr[i]==0){
                                        for(let j=0;j<json.opponent.length;j++){
                                            let f2=false;
                                            for(let k=0;k<json.opponent[j].length;k++){
                                                if(json.opponent[j][k]===-i-1 || json.opponent[j][k]===i+1){
                                                    let r=(j<9 && json.opponent[j+1][k]===json.opponent[j][k])?0:90;
                                                    const csize=document.getElementById('opponentCanvas').width/10 ;                                                    
                                                    const cx=document.getElementById('opponentCanvas').width/10 * k;
                                                    const cy=document.getElementById('opponentCanvas').width/10 * j;
                                                    if(r===90){
                                                        select("#"+global.player.pieces[i].name+"1").style.transformOrigin=`${csize/2}px ${csize/2}px`;

                                                        select("#"+global.player.pieces[i].name+"1").style.transform =  "translate("+(cx+(global.player.pieces[i].length-1)*csize)+"px, "+cy+"px) rotate("+r+"deg)";
                                                    }
                                                    else{
                                                        select("#"+global.player.pieces[i].name+"1").style.transform =  "translate("+cx+"px, "+cy+"px) rotate("+0+"deg)";   
                                                    }
                                                    document.getElementById(global.player.pieces[i].name+"1").classList.remove('loadingImg');        
                                                    f2=true;
                                                    break;
                                                }
                                            }
                                            if(f2) {
                                                break;
                                            }
                                        }
                                        
                                    }
                                }
                            }

                        }else{
                            document.getElementById('opponentCanvas').classList.remove('blink');
                            global.player.turn=false;
                            self.board[attack[0]][attack[1]] = 'miss';
                            const audio=document.getElementById('audio');
                            audio.src="../public/audio/Missile_Miss.mpg";
                            audio.volume=0.2;
                            audio.play();
                            switchState('text', "Opponent's turn");
                        }
                        const result = self.done();
                        if (self.touchWater){
                            self.loadTexture();
                            self.waterWave.touchWater(Math.floor(e.clientX - rect.left), Math.floor(e.clientY - rect.top));
                            
                            if (!self.showing){
                                renderOpponentCanvas();
                            }
                        }
                        
                        if (global.finished){
                            global.player.turn=false;
                            document.getElementById('opponentCanvas').classList.remove('blink');
                            setTimeout(() => {
                            switchState('end', result);
                            }, 1000);
                            global.ready = false;
                            //window.location.reload();
                        }                                               
                    }
                });
            } 
        }
    }
}