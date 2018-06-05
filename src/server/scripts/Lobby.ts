import {Player} from "./Player";
import {IEvent} from "./Event";
import {Room} from "./Room";
import {Utility} from "./Utility";

export class Lobby {

    private _minimumPlayersPerGame: number = 1;
    private readonly _rooms: Room[];
    private _maxRoomSize: number = 10;

    private _minGridSize: number = 3;
    private _maxGridSize: number = 10;

    constructor() {
        this._rooms = [];
    }
    /**
     * Tell all Players to start GameManager
     * @constructor
     */
    public startGame(player: Player, sizeX: number, sizeY: number): IEvent[] {
        const room: Room = player.getRoom();
        if(!room) return; //ToDo Not in a room response (hide button)s
        if (room.Owner() === player ) {
            if (room.getPlayers().length < this._minimumPlayersPerGame) {
                // ToDo Add NotEnoughPlayer Reponse
            }
            const sizes = this.adjustGameSize(sizeX, sizeY);
            sizeX = sizes[0];
            sizeY = sizes[1];

            room.createGame(sizeX, sizeY);
            const turnColor = player.getColor();

            const players = room.getPlayers();
            const startResponse =  {response: "startGame", sizeX, sizeY};
            const startEvent: IEvent = {players, name: "startGame", response: startResponse};

            const informResponse =   {response: "informTurn", turnColor};
            const informEvent: IEvent = {players, name: "informTurn", response: informResponse};

            return [startEvent, informEvent];
        } else {
            const notOwnerResponse = {response: "notOwner"};
            const informEvent: IEvent = {players: [player], name: "startGame", response: notOwnerResponse};
            return [informEvent];
        }
    }

    /**
     *
     * @param {number} sizeX
     * @param {number} sizeY
     * @returns {number[]}
     */
    private adjustGameSize(sizeX: number, sizeY: number): number[] {
        if (sizeX > this._maxGridSize) sizeX = this._maxGridSize;
        if (sizeY > this._maxGridSize) sizeY = this._maxGridSize;
        if (sizeX < this._minGridSize) sizeX = this._minGridSize;
        if (sizeY < this._minGridSize) sizeY =  this._minGridSize;
        return [sizeX, sizeY];
    }

    /**
     * Create Room if necessary
     * Return responses: RoomIsFull or JoinedRoom + playerCount
     * @param {Player} player
     * @param req
     * @returns {string}
     * @constructor
     */
    public joinRoom(player: Player, req: IJoinRoomRequest): IEvent[] {
        let room: Room = this.roomByName(req.roomName);
        if (room === null)room = this.createRoom(req.roomName);

        else if (room.getPlayers().length > room.Size()) {
            const response: IRoomIsFullResponse = {response: "roomIsFull"};
            return [{players: [player], name: "roomIsFull", response}];
        }

        if (!room.ContainsPlayer(player)) {
            const joinedEvent: IEvent = this.joinedEvent(player, room);
            const otherJoinedEvent: IEvent = this.otherJoinedEvent(player);
            return [joinedEvent, otherJoinedEvent];
        }
    }

    private joinedEvent(player: Player, room: Room): IEvent {
        const otherPlayers = Array<IPlayer>();
        for (const curPlayer of room.getPlayers()) {
            otherPlayers.push({
                _name: curPlayer.getName(),
                _color: curPlayer.getColor()
            });
        }
        const response: IJoinedResponse = {response: "joinedRoom",
            roomName: room.getName(),
            roomKey: room.getKey(),
            color: room.AddPlayer(player),
            otherPlayers};
        return{players: [player], name: "joinedRoom", response};
    }

    private otherJoinedEvent(player: Player): IEvent {
        const otherPlayer = {_name: player.getName(), _color: player.getColor()};
        const response: IOtherJoinedResponse = {response: "otherJoinedRoom", otherPlayer};
        return {players: player.getRoom().getPlayers(), name: "otherJoinedRoom", response};

    }

    public leaveRoom(player: Player, req: ILeaveRoomRequest): IEvent[] {
        const room: Room = this.roomByKey(req.roomKey);
        if (room === null) return; // ToDo notfiy player that room does not exist
        if (!room.RemovePlayer(player)) return; // ToDo Notify player that player is not in this room
        return this.leaveEvent(player, room);
    }

    private leaveEvent(player: Player, room: Room): IEvent[] {
        const leftResponse: ILeftResponse = {response: "leftRoom", roomKey: room.getKey()};
        const leftEvent: IEvent = {players: [player], name: "leftRoom", response: leftResponse};

        const otherLeftresponse: IOtherLeftResponse = {response: "otherLeftRoom",
            roomKey: room.getKey(),
            name: player.getName()
        };
        const otherLeftEvent: IEvent = {players: room.GetPlayersExcept(player), name: "otherLeftRoom", response: otherLeftresponse};
        return[leftEvent, otherLeftEvent];
    }

    /**
     * Create room with unique id
     * @returns {Room}
     * @constructor
     */
    private createRoom(roomName: string): Room {
        const room: Room = new Room(roomName, Utility.getGUID(), this._maxRoomSize);
        this._rooms.push(room);
        return room;
    }

    /**
     * Return room based on its unique id (name)
     * @param {string} roomName
     * @returns {Room}
     * @constructor
     */
    private roomByName(roomName: string): Room {
        for (const room of this._rooms) {
            if (room.getName().toString() === roomName) return room;
        }
        return null;
    }

    /**
     * Return a room based on its key
     * @param {string} roomKey
     * @returns {Room}
     * @constructor
     */
    private roomByKey(roomKey: string): Room {
        for (const room of this._rooms) {
            if (room.getKey() === roomKey) return room;
        }
        return null;
    }

}
