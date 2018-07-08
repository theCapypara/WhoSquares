import * as React from "react";
import {Connection} from "../../Connection";
import {Lobby} from "../../game/components/Lobby";
import {LocalPlayerManager} from "../../game/entity/LocalPlayer/LocalPlayerManager";
import {App} from "../App";
import {LogoutButton} from "../components/header/LogoutButton";
import {NewRoomForm} from "../components/lobby/NewRoomForm";
import {RoomList} from "../components/lobby/RoomList";
import {ILobbyUI} from "../interfaces/ILobbyUI";
import {Routes} from "../Routes";
import {UserStats} from "../components/misc-stats/UserStats";
import {GeneralStats} from "../components/misc-stats/GeneralStats";

export interface ILobbyViewProps {
    username: string;
}

export interface ILobbyViewState {
    roomList: IRoomListResponse;
}

export class LobbyView extends React.Component<ILobbyViewProps, ILobbyViewState> implements ILobbyUI {

    private lobby_backend: Lobby;

    constructor(props: ILobbyViewProps) {
        super(props);

        this.state = {roomList: null};

        this.joinRoom = this.joinRoom.bind(this);
        this.statsRoom = this.statsRoom.bind(this);

        Connection.initSocket();

        if (!Connection.getKey() || !Connection.getUsername()) {
            window.location.href = Routes.linkToLoginHREF();
            return;
        }

        if (!LocalPlayerManager.getLocalPlayer()) {
            const color = parseInt("FF33FF", 16);
            const name = Connection.getUsername();
            const isObserver = true;

            LocalPlayerManager.addLocalPlayer(
                {name, color, isObserver},
                Connection.getKey(),
                Connection.getSocket()
            );
        }

        this.lobby_backend = new Lobby(this);

        Connection._socket.emit("roomList");
        Connection._socket.once("roomList", (roomList: IRoomListResponse) => {
            this.setState({roomList});
        });
    }

    private joinRoom(roomname: string) {
        window.location.href = Routes.linkToGameHREF(roomname);
    }

    private statsRoom(roomname: string) {
        window.location.href = Routes.linkToGameStatsHREF(roomname);
    }

    public updateGameInfo(info: string): void {
        App.showTextOnSnackbar(info);
    }

    public updateRoomList(roomList: IRoomListResponse): void {
        this.setState({roomList});
    }

    public logout() {
        Connection.setUsername( "" );
        Connection.setKey( "" );
        window.location.href = Routes.linkToLoginHREF();
    }

    public componentDidMount() {
        LogoutButton.logOutFunction = this.logout;
    }

    public render() {
        return <div className={"content"}>
            <h3 className={"description"}> Available Rooms: </h3>
            <RoomList roomlist={this.state.roomList} actionJoinRoom={this.joinRoom} actionStatsRoom={this.statsRoom}/>
            <NewRoomForm actionCreate={this.joinRoom}/>
            <UserStats playerKey={Connection.getKey()}/>
            <GeneralStats/>
        </div>;
    }
}
