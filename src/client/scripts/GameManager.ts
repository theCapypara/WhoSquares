import Game = Phaser.Game;
import {ResponseManager} from "./ResponseManager/ResponseManager";
import {Grid} from "./Grid";
import {LocalPlayer} from "./LocalPlayer";
import {UiManager} from "./UiManager";

export class GameManager {

    private _game: Game;
    private _socket: SocketIOClient.Socket;
    private _uiManager: UiManager;
    private _eventListener: ResponseManager;
    private _localPlayer: LocalPlayer;

    /**
     * Create Game, Layout Game, Load Images
     * Initialize UiManager
     * Initialize ResponseReceiver
     * Start UpdateLoop (Client only Updates UI & Logic stuff only by Server Events)
     */
    constructor() {
        const self = this;
        const game = new Phaser.Game(800, 600, Phaser.AUTO, "", {
            preload() {
              self.centerGame(game);
              self._uiManager = new UiManager(game);
            },
            create() {
                self._uiManager.createUi();
                self._game = game;
                self.customHandshake();
                // self._socket = io();
                self._eventListener = new ResponseManager(self, self._socket, self._uiManager);
            },
            update() {
                self._uiManager.update();
            }
        });
    }

    private customHandshake(): void {
        const key =  localStorage["who-squares-private-key"];
        if (key === undefined) this._socket = io();
        else {
            console.log("send key:" + key);
            this._socket = io({
                transportOptions: {
                    polling: {
                        extraHeaders: {
                            key
                        }
                    }
                }
            });
        }
    }

    /**
     * Center the game inside the window
     * @param {Phaser.Game} game
     */
    private centerGame(game: Game): void {
        game.scale.pageAlignHorizontally = true;
        game.scale.pageAlignVertically = true;
        game.scale.refresh();
    }

    /**
     * Create a single local Player which represents the Client in rooms/games
     * Create RequestEmitter, as requests always involve a connected local player
     * @param {IPlayer} player
     * @param {string} key
     */
    public addLocalPlayer(player: IPlayer, key: string): void {
        this._localPlayer = new LocalPlayer(player, key);
        this._uiManager.inputManager.createRequestEmitter(this._socket, this._localPlayer);
        this._uiManager.textElement("LocalPlayer: " +  this._localPlayer.name);
    }

    /**
     * Tell room that localPlayer joined
     * If it contains a grid (running game) so create the grid
     * ToDo display client his role (player/observer)
     * @param {IJoinedResponse} resp
     */
    public joinedRoom(resp: IJoinedResponse) {
    // if(this._localPlayer.room) { seems to be redundant as server checks
    //    this._uiManager.textElement("You are already in a room. Leave first!");
    // }
        this._localPlayer.joinedRoom(resp);
        // If game already started, recreate grid
        if (resp.gridInfo) {
            const grid: Grid = this._uiManager.createGridByInfo(resp.gridInfo, this._localPlayer.color);
            this._localPlayer.room.startedGame(grid);
        }
        this._uiManager.textElement("You joined, color: " + resp.color);
        this._uiManager.roomName(resp.roomName);
        this.updateRoomList();
    }

    /**
     * Tell room that localPlayer left & update Ui
     */
    public leftRoom(): void {
        this._localPlayer.leftRoom();
        this._uiManager.textElement("left room");
        this._uiManager.roomName("left room");
        this.updateRoomList();
    }

    /**
     * Tell room that Otherplayer joined & update Ui
     * @param {IPlayer} otherPlayer
     */
    public otherJoinedRoom(otherPlayer: IPlayer): void {
        this._localPlayer.room.otherJoinedRoom(otherPlayer);
        this._uiManager.textElement(otherPlayer.name + "joined");
        this.updateRoomList();
    }

    /**
     * Check if player really is in  a room
     * Tell room that otherPlayer left & update Ui
     * @param player
     */
    public otherLeftRoom(player: IPlayer): void {
        if (!this._localPlayer.room) return; // player currently disconnected
        this._localPlayer.room.otherLeftRoom(player);
        this._uiManager.textElement(player.name + "left");
        this.updateRoomList();
    }

    /**
     * Tell room to create game with given sizes & update Ui
     * @param {number} sizeX
     * @param {number} sizeY
     */
    public startedGame(sizeX: number, sizeY: number): void {
        this._localPlayer.room.startedGame(this._uiManager.createGrid(sizeX, sizeY, this._localPlayer.color));
        this._uiManager.textElement("Game has been started!");
    }

    /**
     * Tell room to place Tile & updateUi
     * @param {number} x
     * @param {number} y
     * @param {IPlayer} player
     */
    public placedTile(y: number, x: number, player: IPlayer): void {
        if (!this._localPlayer) return; // player currently disconnected
        if (!this._localPlayer.room) return; // player currently not in room
        this._localPlayer.room.placedTile(y, x, player);
        this._uiManager.textElement(player + " colored: " + x + "|" + y);
    }

    /**
     * Update Ui to display winner
     * @param {IPlayer} player
     */
    public winGame(player: IPlayer): void {
        this._uiManager.winGame(player.name);
    }

    /**
     * Update Ui for current players turn
     * @param {IPlayer} player
     */
    public turnInfo(player: IPlayer): void {
        this._uiManager.turnInfo(player.color);
    }

    /**
     * Create a string OtherPlayers in room
     * Tell UiManager to display it
     */
    private updateRoomList(): void {
        let roomList: string = "";
        if (this._localPlayer.room) { // check if room exists
            for (const player of this._localPlayer.room.otherPlayers) {
                roomList += player.name + "\n";
            }
        }
        this._uiManager.roomList(roomList);

    }

}
