import Game = Phaser.Game;
import {RequestEmitter} from "./Emitter/RequestEmitter";

export class InputManager {

    /**
     * Player input may effect game and/or start a Request on Server
     * @param {Phaser.Game} _game
     * @param {RequestEmitter} _requestEmitter
     */
    constructor(private _game: Game, private _requestEmitter: RequestEmitter = null) {
        _game.input.mouse.capture = true;
    }

    /**
     * Tell RequestEmitter to leave given room
     */
    public leaveRoom(): void {
        this._requestEmitter.leaveRoom();
    }

    /**
     * Tell RequestEmitter to start given Room with given sizes
     * ToDo: Connect Sizes to InputFields
     */
    public startGame() {
        this._requestEmitter.startGame(5, 5);
    }

}
