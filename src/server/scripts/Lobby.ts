import {Client} from "./Client";
import {IEvent} from "./Event";
import {Room} from "./Room";
import {Utility} from "./Utility";

export class Lobby {

    private _minimumClientsPerGame: number = 1;
    private readonly _rooms: Room[];
    private _maxRoomSize: number = 10;

    private _minGridSize: number = 3;
    private _maxGridSize: number = 10;

    constructor() {
        this._rooms = [];
    }
    /**
     * Tell all Clients to start GameManager
     * @constructor
     */
    public startGame(client: Client, sizeX: number, sizeY: number): IEvent[] {
        const room: Room = client.getRoom();
        if(!room) return; //ToDo Not in a room response (hide button)s
        if (room.Owner() === client ) {
            if (room.getClients().length < this._minimumClientsPerGame) {
                // ToDo Add NotEnoughPlayer Reponse
            }
            const sizes = this.adjustGameSize(sizeX, sizeY);
            sizeX = sizes[0];
            sizeY = sizes[1];

            room.createGame(sizeX, sizeY);
            const turnColor = client.getColor();

            const clients = room.getClients();
            const startResponse =  {response: "startGame", sizeX, sizeY};
            const startEvent: IEvent = {clients, name: "startGame", response: startResponse};

            const informResponse =   {response: "informTurn", turnColor};
            const informEvent: IEvent = {clients, name: "informTurn", response: informResponse};

            return [startEvent, informEvent];
        } else {
            const notOwnerResponse = {response: "notOwner"};
            const informEvent: IEvent = {clients: [client], name: "startGame", response: notOwnerResponse};
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
     * Return responses: RoomIsFull or JoinedRoom + clientCount
     * @param {Client} client
     * @param req
     * @returns {string}
     * @constructor
     */
    public joinRoom(client: Client, req: IJoinRoomRequest): IEvent[] {
        let room: Room = this.roomByName(req.roomName);
        if (room === null)room = this.createRoom(req.roomName);

        else if (room.getClients().length > room.Size()) {
            const response: IRoomIsFullResponse = {response: "roomIsFull"};
            return [{clients: [client], name: "roomIsFull", response}];
        }

        if (!room.ContainsClient(client)) {
            const joinedEvent: IEvent = this.joinedEvent(client, room);
            const otherJoinedEvent: IEvent = this.otherJoinedEvent(client);
            return [joinedEvent, otherJoinedEvent];
        }
    }

    private joinedEvent(client: Client, room: Room): IEvent {
        const otherClients = Array<IClient>();
        for (const curClient of room.getClients()) {
            otherClients.push({
                _name: curClient.getName(),
                _color: curClient.getColor()
            });
        }
        const response: IJoinedResponse = {response: "joinedRoom",
            roomName: room.getName(),
            roomKey: room.getKey(),
            color: room.AddClient(client),
            otherClients};
        return{clients: [client], name: "joinedRoom", response};
    }

    private otherJoinedEvent(client: Client): IEvent {
        const otherClient = {_name: client.getName(), _color: client.getColor()};
        const response: IOtherJoinedResponse = {response: "otherJoinedRoom", otherClient};
        return {clients: client.getRoom().getClients(), name: "otherJoinedRoom", response};

    }

    public leaveRoom(client: Client, req: ILeaveRoomRequest): IEvent[] {
        const room: Room = this.roomByKey(req.roomKey);
        if (room === null) return; // ToDo notfiy client that room does not exist
        if (!room.RemoveClient(client)) return; // ToDo Notify client that client is not in this room
        return this.leaveEvent(client, room);
    }

    private leaveEvent(client: Client, room: Room): IEvent[] {
        const leftResponse: ILeftResponse = {response: "leftRoom", roomKey: room.getKey()};
        const leftEvent: IEvent = {clients: [client], name: "leftRoom", response: leftResponse};

        const otherLeftresponse: IOtherLeftResponse = {response: "otherLeftRoom",
            roomKey: room.getKey(),
            name: client.getName()
        };
        const otherLeftEvent: IEvent = {clients: room.GetClientsExcept(client), name: "otherLeftRoom", response: otherLeftresponse};
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
